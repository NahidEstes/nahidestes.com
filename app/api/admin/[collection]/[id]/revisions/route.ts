import { connectDB } from "@/lib/db";
import { apiError, apiSuccess, isValidObjectId, requireAdminActor } from "@/lib/admin/api";
import { ArticleRevision } from "@/models/ArticleRevision";

export async function GET(_: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const { collection, id } = await params;
  if (collection !== "posts" && collection !== "places") return apiError(404, "UNSUPPORTED_COLLECTION", "Revision history is available for posts and place stories.");
  if (!isValidObjectId(id)) return apiError(400, "INVALID_ID", "The record ID is malformed.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  const revisions = await ArticleRevision.find({ articleId: id, contentCollection: collection }).sort({ createdAt: -1 }).limit(20).select("_id editorName createdAt snapshot.title snapshot.status").lean();
  return apiSuccess(revisions);
}
