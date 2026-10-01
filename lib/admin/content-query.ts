import type { SortOrder } from "mongoose";
import { z } from "zod";
import { collectionLabel, getAdminModel, type ContentCollection } from "@/lib/admin/api";
import type { AdminContentRow, ContentFilterOptions, ContentStatusCounts } from "@/types/content";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Enter a valid date.");

const querySchema = z.object({
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(["all", "published", "draft", "scheduled", "trash"]).default("all"),
  category: z.string().trim().max(80).optional(),
  tag: z.string().trim().max(80).optional(),
  featured: z.enum(["true", "false"]).optional(),
  dateFrom: dateString.optional(),
  dateTo: dateString.optional(),
  dateField: z.enum(["publishedAt", "updatedAt", "scheduledAt", "capturedAt"]).optional(),
  sort: z.enum(["updatedAt", "publishedAt", "scheduledAt", "capturedAt", "title", "status", "isFeatured", "order", "year"]).default("updatedAt"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  country: z.string().trim().max(120).optional(),
  location: z.string().trim().max(180).optional(),
  technology: z.string().trim().max(80).optional(),
  year: z.coerce.number().int().min(1900).max(2200).optional(),
  author: z.string().trim().max(120).optional(),
}).strict();

export type ParsedContentQuery = z.infer<typeof querySchema>;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function utcDay(value: string, nextDay = false) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (nextDay) date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

export function parseContentQuery(searchParams: URLSearchParams) {
  const known = ["q", "page", "limit", "status", "category", "tag", "featured", "dateFrom", "dateTo", "dateField", "sort", "direction", "country", "location", "technology", "year", "author"] as const;
  const raw = Object.fromEntries(known.flatMap((key) => {
    const value = searchParams.get(key);
    return value === null || value === "" ? [] : [[key, value]];
  }));
  const result = querySchema.safeParse(raw);
  if (!result.success) return { ok: false as const, message: result.error.issues[0]?.message || "Invalid list query." };
  if (result.data.dateFrom && result.data.dateTo && result.data.dateFrom > result.data.dateTo) return { ok: false as const, message: "The end date must be on or after the start date." };
  return { ok: true as const, data: result.data };
}

const searchFields: Record<ContentCollection, string[]> = {
  posts: ["title", "slug", "excerpt", "category", "tags", "authorName"],
  projects: ["title", "slug", "excerpt", "category", "tags", "technologies"],
  photography: ["title", "slug", "excerpt", "category", "tags", "location"],
  places: ["title", "slug", "excerpt", "category", "tags", "country", "location", "authorName"],
};

export function buildContentFilter(collection: ContentCollection, query: ParsedContentQuery, options: { omitStatus?: boolean } = {}) {
  const filter: Record<string, unknown> = {};
  const trash = !options.omitStatus && query.status === "trash";
  filter.deletedAt = trash ? { $ne: null } : null;
  if (!options.omitStatus && query.status !== "all" && query.status !== "trash") filter.status = query.status;
  if (query.q) {
    const regex = { $regex: escapeRegex(query.q), $options: "i" };
    filter.$or = searchFields[collection].map((field) => ({ [field]: regex }));
  }
  if (query.category) filter.category = query.category;
  if (query.tag) filter.tags = query.tag;
  if (query.featured) filter.isFeatured = query.featured === "true";
  if (query.country && collection === "places") filter.country = query.country;
  if (query.location && (collection === "places" || collection === "photography")) filter.location = query.location;
  if (query.technology && collection === "projects") filter.technologies = query.technology;
  if (query.year && collection === "projects") filter.year = query.year;
  if (query.author && (collection === "posts" || collection === "places")) filter.authorName = query.author;
  if (query.dateFrom || query.dateTo) {
    const field = query.dateField || (query.status === "scheduled" ? "scheduledAt" : collection === "photography" ? "capturedAt" : "publishedAt");
    const range: Record<string, Date> = {};
    if (query.dateFrom) {
      const from = utcDay(query.dateFrom);
      if (from) range.$gte = from;
    }
    if (query.dateTo) {
      const to = utcDay(query.dateTo, true);
      if (to) range.$lt = to;
    }
    filter[field] = range;
  }
  return filter;
}

export function buildContentSort(query: ParsedContentQuery) {
  return { [query.sort]: (query.direction === "asc" ? 1 : -1) as SortOrder, _id: (query.direction === "asc" ? 1 : -1) as SortOrder };
}

function strings(values: unknown[]) {
  return values.filter((value): value is string => typeof value === "string" && value.trim().length > 0).sort((a, b) => a.localeCompare(b));
}

export async function getContentFilterOptions(collection: ContentCollection) {
  const model = getAdminModel(collection);
  const active = { deletedAt: null };
  const [categories, tags] = await Promise.all([model.distinct("category", active), model.distinct("tags", active)]);
  const options: ContentFilterOptions = { categories: strings(categories), tags: strings(tags) };
  if (collection === "places") {
    const [countries, locations, authors] = await Promise.all([model.distinct("country", active), model.distinct("location", active), model.distinct("authorName", active)]);
    options.countries = strings(countries); options.locations = strings(locations); options.authors = strings(authors);
  }
  if (collection === "photography") options.locations = strings(await model.distinct("location", active));
  if (collection === "projects") {
    options.technologies = strings(await model.distinct("technologies", active));
    options.years = (await model.distinct("year", active)).filter((value): value is number => typeof value === "number").sort((a, b) => b - a);
  }
  if (collection === "posts") options.authors = strings(await model.distinct("authorName", active));
  return options;
}

export async function getContentStatusCounts(collection: ContentCollection, query: ParsedContentQuery) {
  const model = getAdminModel(collection);
  const activeFilters = buildContentFilter(collection, { ...query, status: "all" });
  const trashFilters = { ...activeFilters, deletedAt: { $ne: null } };
  const [all, published, draft, scheduled, trash, featured] = await Promise.all([
    model.countDocuments(activeFilters),
    model.countDocuments({ ...activeFilters, status: "published" }),
    model.countDocuments({ ...activeFilters, status: "draft" }),
    model.countDocuments({ ...activeFilters, status: "scheduled" }),
    model.countDocuments(trashFilters),
    model.countDocuments({ ...activeFilters, isFeatured: true }),
  ]);
  return { all, published, draft, scheduled, trash, featured } satisfies ContentStatusCounts;
}

export function toAdminContentRow(collection: ContentCollection, source: Record<string, unknown>): AdminContentRow {
  const value = (key: string) => source[key] == null ? undefined : source[key];
  return {
    _id: String(source._id), collection, contentType: collectionLabel(collection), title: String(source.title || "Untitled"),
    slug: String(source.slug || ""), status: String(source.status || "draft"), isFeatured: Boolean(source.isFeatured),
    featuredImage: value("featuredImage") as string | undefined, imageAlt: value("imageAlt") as string | undefined,
    excerpt: value("excerpt") as string | undefined, category: value("category") as string | undefined,
    tags: Array.isArray(source.tags) ? source.tags.map(String) : [], technologies: Array.isArray(source.technologies) ? source.technologies.map(String) : undefined,
    publishedAt: value("publishedAt") as Date | string | undefined as string | undefined,
    scheduledAt: value("scheduledAt") as Date | string | undefined as string | undefined,
    capturedAt: value("capturedAt") as Date | string | undefined as string | undefined,
    country: value("country") as string | undefined, location: value("location") as string | undefined,
    year: value("year") as number | undefined, order: value("order") as number | undefined, authorName: value("authorName") as string | undefined,
    version: value("version") as number | undefined,
    updatedAt: value("updatedAt") as Date | string | undefined as string | undefined,
    createdAt: value("createdAt") as Date | string | undefined as string | undefined,
    deletedAt: value("deletedAt") as Date | string | undefined as string | null | undefined,
  };
}
