import { connectDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { apiError, apiSuccess, getAdminModel, isValidObjectId, publicPath, requireAdminActor } from "@/lib/admin/api";
import { createArticleRevision } from "@/lib/admin/revisions";
import { sanitizeContentPayload, schemaForCollection } from "@/lib/validation";
import { ArticleRevision } from "@/models/ArticleRevision";

export async function POST(_: Request, { params }: { params: Promise<{ collection: string; id: string; revisionId: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const { collection, id, revisionId } = await params;
  if (collection !== "posts" && collection !== "places") return apiError(404, "UNSUPPORTED_COLLECTION", "Revision history is available for posts and place stories.");
  if (!isValidObjectId(id) || !isValidObjectId(revisionId)) return apiError(400, "INVALID_ID", "The record or revision ID is malformed.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");

  const model = getAdminModel(collection);
  const [current, revision] = await Promise.all([model.findById(id).lean(), ArticleRevision.findOne({ _id: revisionId, articleId: id, contentCollection: collection }).lean()]);
  if (!current) return apiError(404, "NOT_FOUND", "The requested article does not exist.");
  if (!revision) return apiError(404, "REVISION_NOT_FOUND", "The requested revision does not exist.");
  const parsed = schemaForCollection(collection, true).safeParse(revision.snapshot);
  if (!parsed.success) return apiError(409, "INVALID_REVISION", "This revision cannot be restored because its data is no longer valid.");
  const parsedSnapshot = parsed.data as Record<string, unknown>;
  if (auth.actor.role === "editor" && parsedSnapshot.status && parsedSnapshot.status !== current.status && parsedSnapshot.status !== "draft") return apiError(403, "PUBLISH_FORBIDDEN", "Editors cannot restore a revision that changes the publication status.");

  await createArticleRevision(collection, current, auth.actor);
  const snapshot = sanitizeContentPayload(parsedSnapshot);
  delete snapshot.version;
  const restored = await model.findByIdAndUpdate(id, { $set: snapshot, $inc: { version: 1 } }, { returnDocument: "after", runValidators: true }).lean();
  if (!restored) return apiError(404, "NOT_FOUND", "The requested article does not exist.");
  if (restored.slug) revalidatePath(publicPath(collection, String(restored.slug)));
  return apiSuccess(restored);
}
