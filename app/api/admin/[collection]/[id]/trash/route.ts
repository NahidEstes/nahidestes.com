import { connectDB } from "@/lib/db";
import { apiError, apiSuccess, getAdminModel, isContentCollection, isValidObjectId, requireAdminActor } from "@/lib/admin/api";
import { ArticleRevision } from "@/models/ArticleRevision";

async function context(params: Promise<{ collection: string; id: string }>) {
  const { collection, id } = await params;
  if (!isContentCollection(collection)) return { error: apiError(404, "UNKNOWN_COLLECTION", "Trash is only available for content collections.") } as const;
  if (!isValidObjectId(id)) return { error: apiError(400, "INVALID_ID", "The record ID is malformed.") } as const;
  return { collection, id, model: getAdminModel(collection) } as const;
}

export async function PATCH(_: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const auth = await requireAdminActor(["admin"]);
  if ("response" in auth) return auth.response;
  const resolved = await context(params);
  if ("error" in resolved) return resolved.error;
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  const restored = await resolved.model.findOneAndUpdate({ _id: resolved.id, deletedAt: { $ne: null } }, { $set: { deletedAt: null } }, { returnDocument: "after" }).lean();
  if (!restored) {
    const exists = await resolved.model.exists({ _id: resolved.id });
    return exists ? apiError(409, "NOT_TRASHED", "This record is not in Trash.") : apiError(404, "NOT_FOUND", "The requested record does not exist.");
  }
  return apiSuccess(restored);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const auth = await requireAdminActor(["admin"]);
  if ("response" in auth) return auth.response;
  const resolved = await context(params);
  if ("error" in resolved) return resolved.error;
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  const deleted = await resolved.model.findOneAndDelete({ _id: resolved.id, deletedAt: { $ne: null } }).lean();
  if (!deleted) {
    const exists = await resolved.model.exists({ _id: resolved.id });
    return exists ? apiError(409, "NOT_TRASHED", "Move this record to Trash before permanently deleting it.") : apiError(404, "NOT_FOUND", "The requested record does not exist.");
  }
  if (resolved.collection === "posts" || resolved.collection === "places") await ArticleRevision.deleteMany({ articleId: resolved.id, contentCollection: resolved.collection });
  return apiSuccess({ id: resolved.id });
}
