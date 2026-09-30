import { connectDB } from "@/lib/db";
import {
  apiError, apiSuccess, collectionLabel, getAdminModel, isAdminCollection, isContentCollection,
  isDuplicateKeyError, requireAdminActor, toFieldErrors,
} from "@/lib/admin/api";
import { sanitizeContentPayload, schemaForCollection, validateContentImageFields } from "@/lib/validation";

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const { collection } = await params;
  if (!isAdminCollection(collection)) return apiError(404, "UNKNOWN_COLLECTION", "Unknown collection.");
  if (auth.actor.role !== "admin" && !isContentCollection(collection)) return apiError(403, "FORBIDDEN", "Editors can only access content collections.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");

  const model = getAdminModel(collection);
  const url = new URL(request.url);
  const query = url.searchParams.get("q")?.trim();
  const trash = url.searchParams.get("trash") === "true";
  if (trash && (!isContentCollection(collection) || auth.actor.role !== "admin")) return apiError(403, "FORBIDDEN", "Only administrators can view Trash.");

  const filter: Record<string, unknown> = {};
  if (isContentCollection(collection)) filter.deletedAt = trash ? { $ne: null } : null;
  if (query) {
    const field = collection === "subscribers" ? "email" : collection === "messages" ? "subject" : collection === "categories" ? "name" : "title";
    filter[field] = { $regex: escapeRegex(query), $options: "i" };
  }
  const docs = await model.find(filter).sort({ updatedAt: -1, createdAt: -1 }).limit(100).lean();
  const data = isContentCollection(collection)
    ? docs.map((doc) => ({ ...doc, collection, contentType: collectionLabel(collection) }))
    : docs;
  return apiSuccess(data);
}

export async function POST(request: Request, { params }: { params: Promise<{ collection: string }> }) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const { collection } = await params;
  if (!isAdminCollection(collection)) return apiError(404, "UNKNOWN_COLLECTION", "Unknown collection.");
  if (auth.actor.role !== "admin" && !isContentCollection(collection)) return apiError(403, "FORBIDDEN", "Editors can only create content.");
  if (collection === "messages") return apiError(405, "METHOD_NOT_ALLOWED", "Messages cannot be created from the admin API.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");

  let body: unknown;
  try { body = await request.json(); } catch { return apiError(400, "INVALID_JSON", "The request body is not valid JSON."); }
  const parsed = schemaForCollection(collection, false).safeParse(body);
  if (!parsed.success) return apiError(400, "VALIDATION_ERROR", "Please correct the highlighted fields.", toFieldErrors(parsed.error.issues));
  let payload = parsed.data as Record<string, unknown>;

  if (isContentCollection(collection)) {
    if (auth.actor.role === "editor" && payload.status !== "draft") return apiError(403, "PUBLISH_FORBIDDEN", "Editors can save drafts but cannot publish or schedule content.");
    const imageErrors = validateContentImageFields(payload);
    if (Object.keys(imageErrors).length) return apiError(400, "VALIDATION_ERROR", "Please correct the highlighted image fields.", imageErrors);
    const model = getAdminModel(collection);
    if (await model.exists({ slug: payload.slug })) return apiError(409, "DUPLICATE_SLUG", "This slug is already in use.", { slug: ["Choose a unique slug."] });
    payload = sanitizeContentPayload(payload);
    payload.version = 1;
    payload.deletedAt = null;
    if (collection === "projects" || collection === "photography") {
      payload.description = payload.excerpt;
      payload.coverImage = payload.featuredImage;
    }
  }

  try {
    if (collection === "settings") {
      const model = getAdminModel(collection);
      const doc = await model.findOneAndUpdate({ key: "primary" }, { key: "primary", ...payload }, { returnDocument: "after", upsert: true, runValidators: true }).lean();
      return apiSuccess(doc, 201);
    }
    const doc = await getAdminModel(collection).create(payload);
    return apiSuccess(doc.toObject(), 201);
  } catch (error) {
    if (isDuplicateKeyError(error)) return apiError(409, "DUPLICATE_VALUE", "A record with this unique value already exists.");
    return apiError(500, "SAVE_FAILED", "The record could not be saved.");
  }
}
