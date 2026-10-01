import { connectDB } from "@/lib/db";
import { apiError, apiSuccess, getAdminModel, isContentCollection, requireAdminActor, toFieldErrors } from "@/lib/admin/api";
import { createArticleRevision } from "@/lib/admin/revisions";
import { contentBulkSchema } from "@/lib/validation";
import { ArticleRevision } from "@/models/ArticleRevision";

function publishProblem(document: Record<string, unknown>) {
  const required = ["title", "slug", "excerpt", "featuredImage", "imageAlt", "category", "content"];
  const missing = required.filter((field) => !String(document[field] || "").trim());
  return missing.length ? `Complete these fields before publishing: ${missing.join(", ")}.` : null;
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const { collection } = await params;
  if (!isContentCollection(collection)) return apiError(404, "UNKNOWN_COLLECTION", "Bulk actions are only available for content collections.");
  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, "INVALID_JSON", "The request body is not valid JSON."); }
  const parsed = contentBulkSchema.safeParse(body);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "The bulk action is invalid.", toFieldErrors(parsed.error.issues));
  const requestData = parsed.data;
  const administratorOnly = new Set(["publish", "schedule", "trash", "restore", "delete"]);
  if (auth.actor.role !== "admin" && administratorOnly.has(requestData.action)) return apiError(403, "FORBIDDEN", "Only administrators can perform this bulk action.");
  if (requestData.action === "schedule" && new Date(requestData.scheduledAt).getTime() <= Date.now()) return apiError(400, "INVALID_SCHEDULE", "Choose a future schedule date and time.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");

  const ids = [...new Set(requestData.ids)];
  const model = getAdminModel(collection);
  const documents = await model.find({ _id: { $in: ids } }).lean();
  const byId = new Map(documents.map((document) => [String(document._id), document as Record<string, unknown>]));
  const failed: Array<{ id: string; title?: string; message: string }> = [];
  let affected = 0;

  for (const id of ids) {
    const document = byId.get(id);
    if (!document) { failed.push({ id, message: "Content not found." }); continue; }
    const title = String(document.title || "Untitled");
    const trashed = Boolean(document.deletedAt);
    if (auth.actor.role === "editor" && (trashed || document.status !== "draft")) { failed.push({ id, title, message: "Editors can only update active drafts." }); continue; }
    if (requestData.action === "trash" && trashed) { failed.push({ id, title, message: "Already in Trash." }); continue; }
    if ((requestData.action === "restore" || requestData.action === "delete") && !trashed) { failed.push({ id, title, message: "This item is not in Trash." }); continue; }
    if (!["restore", "delete"].includes(requestData.action) && trashed) { failed.push({ id, title, message: "Restore this item before changing it." }); continue; }
    if (requestData.action === "publish") {
      const problem = publishProblem(document);
      if (problem) { failed.push({ id, title, message: problem }); continue; }
    }
    const update: Record<string, unknown> = {};
    if (requestData.action === "publish") Object.assign(update, { status: "published", publishedAt: new Date(), scheduledAt: null });
    if (requestData.action === "draft") Object.assign(update, { status: "draft", scheduledAt: null });
    if (requestData.action === "schedule") Object.assign(update, { status: "scheduled", scheduledAt: new Date(requestData.scheduledAt) });
    if (requestData.action === "feature") update.isFeatured = true;
    if (requestData.action === "unfeature") update.isFeatured = false;
    if (requestData.action === "trash") update.deletedAt = new Date();
    if (requestData.action === "restore") update.deletedAt = null;
    if (requestData.action === "category") update.category = requestData.category;
    if (requestData.action === "addTags") update.tags = [...new Set([...(Array.isArray(document.tags) ? document.tags.map(String) : []), ...requestData.tags])].slice(0, 40);
    if (requestData.action === "removeTags") update.tags = (Array.isArray(document.tags) ? document.tags.map(String) : []).filter((tag) => !requestData.tags.includes(tag));
    try {
      if (requestData.action === "delete") {
        await model.deleteOne({ _id: id, deletedAt: { $ne: null } });
        if (collection === "posts" || collection === "places") await ArticleRevision.deleteMany({ articleId: id, contentCollection: collection });
      } else {
        await createArticleRevision(collection, document, auth.actor);
        await model.updateOne({ _id: id }, { $set: update, $inc: { version: 1 } }, { runValidators: true });
      }
      affected += 1;
    } catch { failed.push({ id, title, message: "The update failed." }); }
  }
  return apiSuccess({ affected, failed });
}
