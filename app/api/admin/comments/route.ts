import { z } from "zod";
import { apiError, apiSuccess, requireAdminActor } from "@/lib/admin/api";
import { commentArticlePath } from "@/lib/comments";
import { connectDB } from "@/lib/db";
import { Comment } from "@/models/Comment";
import { PlaceStory } from "@/models/PlaceStory";
import { Post } from "@/models/Post";
import type { AdminCommentRow, CommentPostType } from "@/types/comments";

const querySchema = z.object({
  status: z.enum(["all", "pending", "approved", "spam", "trash"]).default("pending"),
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return apiError(400, "INVALID_QUERY", "Invalid comments query.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");

  const { status, q, page, limit } = parsed.data;
  const filter: Record<string, unknown> = status === "all" ? {} : { status: status === "trash" ? "trashed" : status };
  if (q) {
    const regex = { $regex: escapeRegex(q), $options: "i" };
    const [postMatches, placeMatches] = await Promise.all([
      Post.find({ title: regex }).select("_id").limit(200).lean(),
      PlaceStory.find({ title: regex }).select("_id").limit(200).lean(),
    ]);
    const articleIds = [...postMatches, ...placeMatches].map((item) => item._id);
    filter.$or = [{ name: regex }, { email: regex }, { content: regex }, ...(articleIds.length ? [{ postId: { $in: articleIds } }] : [])];
  }

  const [docs, total, all, pending, approved, spam, trash] = await Promise.all([
    Comment.find(filter).select("_id postId postType name email content status createdAt updatedAt").sort({ createdAt: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Comment.countDocuments(filter),
    Comment.countDocuments(),
    Comment.countDocuments({ status: "pending" }),
    Comment.countDocuments({ status: "approved" }),
    Comment.countDocuments({ status: "spam" }),
    Comment.countDocuments({ status: "trashed" }),
  ]);

  const postIds = docs.filter((item) => item.postType === "post").map((item) => item.postId);
  const placeIds = docs.filter((item) => item.postType === "place").map((item) => item.postId);
  const [posts, places] = await Promise.all([
    Post.find({ _id: { $in: postIds } }).select("_id title slug").lean(),
    PlaceStory.find({ _id: { $in: placeIds } }).select("_id title slug").lean(),
  ]);
  const articles = new Map([...posts, ...places].map((item) => [String(item._id), { title: String(item.title), slug: String(item.slug) }]));
  const items: AdminCommentRow[] = docs.map((item) => {
    const postType = item.postType as CommentPostType;
    const article = articles.get(String(item.postId));
    return {
      id: String(item._id),
      name: String(item.name),
      email: String(item.email),
      content: String(item.content),
      status: item.status,
      postId: String(item.postId),
      postType,
      articleTitle: article?.title || "Unavailable article",
      articleSlug: article?.slug || "",
      articlePath: article?.slug ? commentArticlePath(postType, article.slug) : "",
      createdAt: new Date(item.createdAt).toISOString(),
      updatedAt: new Date(item.updatedAt).toISOString(),
    };
  });

  return apiSuccess({
    items,
    pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), hasPreviousPage: page > 1, hasNextPage: page * limit < total },
    statusCounts: { all, pending, approved, spam, trash },
  });
}
