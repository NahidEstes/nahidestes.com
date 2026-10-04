import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, isValidObjectId, requireAdminActor, toFieldErrors } from "@/lib/admin/api";
import { canPermanentlyDeleteComment, commentModerationSchema, commentTransition } from "@/lib/comment-core";
import { commentArticleModel, commentArticlePath } from "@/lib/comments";
import { connectDB } from "@/lib/db";
import { Comment } from "@/models/Comment";
import type { CommentPostType, CommentStatus } from "@/types/comments";

async function refreshArticle(postType: CommentPostType, postId: string) {
  const article = await commentArticleModel(postType).findById(postId).select("slug").lean() as { slug?: string } | null;
  if (article?.slug) revalidatePath(commentArticlePath(postType, article.slug));
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!isValidObjectId(id)) return apiError(400, "INVALID_ID", "The comment ID is malformed.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, "INVALID_JSON", "The request body is not valid JSON."); }
  const parsed = commentModerationSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Choose a supported moderation action.", toFieldErrors(parsed.error.issues));

  const existing = await Comment.findById(id).select("_id postId postType status").lean();
  if (!existing) return apiError(404, "NOT_FOUND", "The comment does not exist.");
  const nextStatus = commentTransition(existing.status as CommentStatus, parsed.data.action);
  if (!nextStatus) return apiError(409, "INVALID_TRANSITION", `This comment cannot be changed from ${existing.status} using that action.`);

  const now = new Date();
  const $set: Record<string, unknown> = { status: nextStatus, moderatedBy: auth.actor.id };
  const $unset: Record<string, 1> = {};
  if (nextStatus === "approved") $set.approvedAt = now; else $unset.approvedAt = 1;
  if (nextStatus === "trashed") $set.deletedAt = now; else $unset.deletedAt = 1;
  const updated = await Comment.findByIdAndUpdate(id, { $set, ...(Object.keys($unset).length ? { $unset } : {}) }, { returnDocument: "after", runValidators: true }).select("_id status updatedAt").lean();
  await refreshArticle(existing.postType as CommentPostType, String(existing.postId));
  return apiSuccess({ id, status: updated?.status, updatedAt: updated?.updatedAt });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminActor(["admin"]);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  if (!isValidObjectId(id)) return apiError(400, "INVALID_ID", "The comment ID is malformed.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  const existing = await Comment.findById(id).select("_id postId postType status").lean();
  if (!existing) return apiError(404, "NOT_FOUND", "The comment does not exist.");
  if (!canPermanentlyDeleteComment(existing.status as CommentStatus)) return apiError(409, "NOT_IN_TRASH", "Only comments in Trash can be permanently deleted.");
  await Comment.deleteOne({ _id: id, status: "trashed" });
  await refreshArticle(existing.postType as CommentPostType, String(existing.postId));
  return apiSuccess({ id });
}
