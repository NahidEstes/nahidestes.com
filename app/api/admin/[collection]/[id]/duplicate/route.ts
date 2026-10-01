import { connectDB } from "@/lib/db";
import { apiError, apiSuccess, getAdminModel, isContentCollection, isDuplicateKeyError, isValidObjectId, requireAdminActor } from "@/lib/admin/api";
import { toAdminContentRow } from "@/lib/admin/content-query";

function copyTitle(value: unknown, attempt: number) {
  const suffix = attempt === 1 ? " — Copy" : ` — Copy ${attempt}`;
  return `${String(value || "Untitled").slice(0, Math.max(1, 180 - suffix.length))}${suffix}`;
}

function copySlug(value: unknown, attempt: number) {
  const base = String(value || "content").replace(/-copy(?:-\d+)?$/, "").slice(0, 155).replace(/-+$/, "") || "content";
  return `${base}-copy${attempt === 1 ? "" : `-${attempt}`}`;
}

export async function POST(_: Request, { params }: { params: Promise<{ collection: string; id: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const { collection, id } = await params;
  if (!isContentCollection(collection)) return apiError(404, "UNKNOWN_COLLECTION", "Duplicate is only available for content collections.");
  if (!isValidObjectId(id)) return apiError(400, "INVALID_ID", "The record ID is malformed.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  const model = getAdminModel(collection);
  const source = await model.findOne({ _id: id, deletedAt: null }).lean();
  if (!source) return apiError(404, "NOT_FOUND", "The content does not exist or is in Trash.");
  const payload = { ...source } as Record<string, unknown>;
  for (const key of ["_id", "__v", "createdAt", "updatedAt", "deletedAt", "publishedAt", "scheduledAt"]) delete payload[key];
  payload.status = "draft";
  payload.isFeatured = false;
  payload.version = 1;
  payload.deletedAt = null;
  for (let attempt = 1; attempt <= 50; attempt += 1) {
    payload.title = copyTitle(source.title, attempt);
    payload.slug = copySlug(source.slug, attempt);
    if (await model.exists({ slug: payload.slug })) continue;
    try {
      const duplicate = await model.create(payload);
      return apiSuccess(toAdminContentRow(collection, duplicate.toObject() as Record<string, unknown>), 201);
    } catch (error) {
      if (isDuplicateKeyError(error)) continue;
      return apiError(500, "DUPLICATE_FAILED", "The content could not be duplicated.");
    }
  }
  return apiError(409, "DUPLICATE_SLUG", "A unique slug could not be generated for the duplicate.");
}
