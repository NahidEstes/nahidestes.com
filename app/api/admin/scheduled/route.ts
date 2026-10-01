import { z } from "zod";
import { connectDB } from "@/lib/db";
import { apiError, apiSuccess, contentCollections, getAdminModel, requireAdminActor } from "@/lib/admin/api";
import { toAdminContentRow } from "@/lib/admin/content-query";

const querySchema = z.object({
  q: z.string().trim().max(120).default(""),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).strict();

function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

export async function GET(request: Request) {
  const auth = await requireAdminActor();
  if ("response" in auth) return auth.response;
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(["q", "page", "limit"].flatMap((key) => {
    const value = url.searchParams.get(key); return value === null || value === "" ? [] : [[key, value]];
  })));
  if (!parsed.success) return apiError(400, "INVALID_QUERY", parsed.error.issues[0]?.message || "Invalid scheduled-content query.");
  if (!await connectDB()) return apiError(503, "DATABASE_UNAVAILABLE", "MongoDB is not configured or unavailable.");
  const filter: Record<string, unknown> = { deletedAt: null, status: "scheduled" };
  if (parsed.data.q) filter.$or = ["title", "slug", "excerpt"].map((field) => ({ [field]: { $regex: escapeRegex(parsed.data.q), $options: "i" } }));
  const results = await Promise.all(contentCollections.map(async (collection) => {
    const docs = await getAdminModel(collection).find(filter).select("title slug status isFeatured featuredImage imageAlt excerpt category tags publishedAt scheduledAt country location technologies year order capturedAt authorName version updatedAt createdAt deletedAt").lean();
    return docs.map((doc) => toAdminContentRow(collection, doc));
  }));
  const all = results.flat().sort((a, b) => new Date(a.scheduledAt || 0).getTime() - new Date(b.scheduledAt || 0).getTime());
  const start = (parsed.data.page - 1) * parsed.data.limit;
  return apiSuccess({
    items: all.slice(start, start + parsed.data.limit),
    pagination: { page: parsed.data.page, limit: parsed.data.limit, total: all.length, totalItems: all.length, totalPages: Math.max(1, Math.ceil(all.length / parsed.data.limit)), hasPreviousPage: parsed.data.page > 1, hasNextPage: parsed.data.page * parsed.data.limit < all.length },
  });
}
