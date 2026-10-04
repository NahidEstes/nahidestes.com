import { NextResponse } from "next/server";
import { z } from "zod";
import { commentSubmissionSchema, isRealisticCommentTiming, toPublicComment } from "@/lib/comment-core";
import { privateIdentifier, requestIpHash } from "@/lib/comment-security";
import { connectDB } from "@/lib/db";
import { findPublishedCommentArticle } from "@/lib/comments";
import { checkRateLimit } from "@/lib/rate-limit";
import { Comment } from "@/models/Comment";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 12_000;
const publicQuerySchema = z.object({
  postType: z.enum(["post", "place"]),
  slug: z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

function error(status: number, message: string, fieldErrors?: Record<string, string>) {
  return NextResponse.json({ message, ...(fieldErrors ? { fieldErrors } : {}) }, { status });
}

function validationErrors(issues: { path: PropertyKey[]; message: string }[]) {
  return issues.reduce<Record<string, string>>((result, issue) => {
    const field = String(issue.path[0] || "form");
    if (!result[field]) result[field] = issue.message;
    return result;
  }, {});
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = publicQuerySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return error(400, "Invalid comment query.");
  const article = await findPublishedCommentArticle(parsed.data.postType, { slug: parsed.data.slug });
  if (!article) return error(404, "Article not found.");
  if (!await connectDB()) return error(503, "Comments are temporarily unavailable.");
  const filter = { postId: article._id, postType: parsed.data.postType, status: "approved" as const };
  const [docs, count] = await Promise.all([
    Comment.find(filter).select("_id name content createdAt").sort({ createdAt: 1, _id: 1 }).skip((parsed.data.page - 1) * parsed.data.limit).limit(parsed.data.limit).lean(),
    Comment.countDocuments(filter),
  ]);
  return NextResponse.json({
    comments: docs.map((doc) => toPublicComment(doc)),
    count,
    commentsEnabled: article.commentsEnabled !== false,
    pagination: { page: parsed.data.page, limit: parsed.data.limit, totalPages: Math.max(1, Math.ceil(count / parsed.data.limit)) },
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return error(415, "Use application/json for comment submissions.");
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > MAX_BODY_BYTES) return error(413, "Comment submission is too large.");
  let raw = "";
  try { raw = await request.text(); } catch { return error(400, "The request could not be read."); }
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return error(413, "Comment submission is too large.");
  let body: unknown;
  try { body = JSON.parse(raw); } catch { return error(400, "The request body is not valid JSON."); }
  const parsed = commentSubmissionSchema.safeParse(body);
  if (!parsed.success) return error(400, "Please correct the highlighted fields.", validationErrors(parsed.error.issues));
  const values = parsed.data;
  if (values.website || !isRealisticCommentTiming(values.formStartedAt)) return error(400, "Unable to submit this comment.");

  const ipHash = requestIpHash(request);
  const emailKey = privateIdentifier(values.email);
  const ipRate = checkRateLimit(`comment:ip:${ipHash || "unknown"}:${values.postId}`, 5, 60 * 60_000);
  const emailRate = checkRateLimit(`comment:email:${emailKey}:${values.postId}`, 3, 15 * 60_000);
  const articleRate = checkRateLimit(`comment:article:${values.postId}`, 50, 60 * 60_000);
  if (!ipRate.allowed || !emailRate.allowed || !articleRate.allowed) return error(429, "Please wait before submitting another comment.");

  const article = await findPublishedCommentArticle(values.postType, { _id: values.postId });
  if (!article) return error(404, "Article not found.");
  if (article.commentsEnabled === false) return error(403, "Comments are closed for this article.");
  if (!await connectDB()) return error(503, "Comments are temporarily unavailable.");

  const duplicateSince = new Date(Date.now() - 10 * 60_000);
  const duplicate = await Comment.exists({ postId: values.postId, postType: values.postType, email: values.email, content: values.content, createdAt: { $gte: duplicateSince }, status: { $ne: "trashed" } });
  if (duplicate) return error(429, "Please wait before submitting another comment.");

  try {
    await Comment.create({
      postId: values.postId,
      postType: values.postType,
      name: values.name,
      email: values.email,
      content: values.content,
      status: "pending",
      ...(ipHash ? { ipHash } : {}),
      userAgent: request.headers.get("user-agent")?.slice(0, 500),
    });
    return NextResponse.json({ message: "Your comment has been submitted and is awaiting moderation." }, { status: 201 });
  } catch {
    return error(500, "Your comment could not be submitted. Please try again.");
  }
}
