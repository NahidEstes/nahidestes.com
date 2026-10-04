import { connectDB } from "@/lib/db";
import { revalidatePath } from "next/cache";
import {
  apiError, apiSuccess, getAdminModel, isAdminCollection, isContentCollection, isDuplicateKeyError,
  isValidObjectId, publicPath, requireAdminActor, toFieldErrors,
} from "@/lib/admin/api";
import { createArticleRevision } from "@/lib/admin/revisions";
import { sanitizeContentPayload, schemaForCollection, validateContentImageFields } from "@/lib/validation";

async function resolveContext(params: Promise<{ collection: string; id: string }>) {
  const values = await params;
  if (!isAdminCollection(values.collection)) return { error: apiError(404, "UNKNOWN_COLLECTION", "Unknown collection.") } as const;
  if (!isValidObjectId(values.id)) return { error: apiError(400, "INVALID_ID", "The record ID is malformed.") } as const;
  return { collection: values.collection, id: values.id, model: getAdminModel(values.collection) } as const;
}

export async function GET(_: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const context = await resolveContext(params);
  if ("error" in context) return context.error;
  if (auth.actor.role !== "admin" && !isContentCollection(context.collection)) return apiError(403, "FORBIDDEN", "Editors can only access content collections.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  const doc = await context.model.findById(context.id).lean();
  if (!doc) return apiError(404, "NOT_FOUND", "The requested record does not exist.");
  return apiSuccess(doc);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const context = await resolveContext(params);
  if ("error" in context) return context.error;
  if (auth.actor.role !== "admin" && !isContentCollection(context.collection)) return apiError(403, "FORBIDDEN", "Editors can only update content.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");

  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, "INVALID_JSON", "The request body is not valid JSON."); }
  const parsed = schemaForCollection(context.collection, true).safeParse(body);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Please correct the highlighted fields.", toFieldErrors(parsed.error.issues));
  let payload = parsed.data as Record<string, unknown>;
  if (!Object.keys(payload).length) return apiError(400, "EMPTY_UPDATE", "Provide at least one field to update.");

  const existing = await context.model.findById(context.id).lean();
  if (!existing) return apiError(404, "NOT_FOUND", "The requested record does not exist.");
  if (isContentCollection(context.collection) && existing.deletedAt) return apiError(409, "IN_TRASH", "Restore this record before editing it.");

  if (isContentCollection(context.collection)) {
    if (payload.slug && await context.model.exists({ slug: payload.slug, _id: { $ne: context.id } })) return apiError(409, "DUPLICATE_SLUG", "This slug is already in use.", { slug: ["Choose a unique slug."] });
    if (auth.actor.role === "editor" && existing.status !== "draft" && payload.status !== "draft") return apiError(403, "PUBLISH_FORBIDDEN", "An administrator must move published or scheduled content back to draft before an editor can change it.");
    if (auth.actor.role === "editor" && payload.status && payload.status !== existing.status && payload.status !== "draft") return apiError(403, "PUBLISH_FORBIDDEN", "Editors can save drafts but cannot publish or schedule content.");
    const effective = { ...existing, ...payload };
    const imageErrors = validateContentImageFields(effective);
    if (Object.keys(imageErrors).length) return apiError(400, "VALIDATION_ERROR", "Please correct the highlighted image fields.", imageErrors);
    const expectedVersion = typeof payload.version === "number" ? payload.version : Number(existing.version || 0);
    delete payload.version;
    payload = sanitizeContentPayload(payload);
    if (context.collection === "projects" || context.collection === "photography") {
      if (payload.excerpt !== undefined) payload.description = payload.excerpt;
      if (payload.featuredImage !== undefined) payload.coverImage = payload.featuredImage;
    }
    await createArticleRevision(context.collection, existing, auth.actor);
    const versionFilter = expectedVersion === 0
      ? { $or: [{ version: 0 }, { version: { $exists: false } }] }
      : { version: expectedVersion };
    const updated = await context.model.findOneAndUpdate(
      { _id: context.id, ...versionFilter },
      { $set: payload, $inc: { version: 1 } },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!updated) return apiError(409, "EDIT_CONFLICT", "This record was updated elsewhere. Reload before saving again.");
    if ((context.collection === "posts" || context.collection === "places") && updated.slug) revalidatePath(publicPath(context.collection, String(updated.slug)));
    return apiSuccess(updated);
  }

  try {
    const updated = await context.model.findByIdAndUpdate(context.id, { $set: payload }, { returnDocument: "after", runValidators: true }).lean();
    if (!updated) return apiError(404, "NOT_FOUND", "The requested record does not exist.");
    return apiSuccess(updated);
  } catch (error) {
    if (isDuplicateKeyError(error)) return apiError(409, "DUPLICATE_VALUE", "A record with this unique value already exists.");
    return apiError(500, "SAVE_FAILED", "The record could not be updated.");
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const context = await resolveContext(params);
  if ("error" in context) return context.error;
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");

  if (isContentCollection(context.collection)) {
    if (auth.actor.role !== "admin") return apiError(403, "FORBIDDEN", "Only administrators can move content to Trash.");
    const updated = await context.model.findOneAndUpdate({ _id: context.id, deletedAt: null }, { $set: { deletedAt: new Date() } }, { returnDocument: "after" }).lean();
    if (!updated) {
      const exists = await context.model.exists({ _id: context.id });
      return exists ? apiError(409, "ALREADY_TRASHED", "This record is already in Trash.") : apiError(404, "NOT_FOUND", "The requested record does not exist.");
    }
    return apiSuccess({ id: context.id, deletedAt: updated.deletedAt });
  }

  if (auth.actor.role !== "admin") return apiError(403, "FORBIDDEN", "Only administrators can permanently delete records.");
  if (context.collection === "settings") return apiError(405, "METHOD_NOT_ALLOWED", "Site settings cannot be deleted.");
  const deleted = await context.model.findByIdAndDelete(context.id).lean();
  if (!deleted) return apiError(404, "NOT_FOUND", "The requested record does not exist.");
  return apiSuccess({ id: context.id });
}
