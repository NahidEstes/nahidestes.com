import type { ContentItem, ContentKind, SiteSettingsData } from "@/types/content";
import { connectDB } from "@/lib/db";
import { samples, defaultSettings } from "@/lib/sample-data";
import { Post } from "@/models/Post";
import { Project } from "@/models/Project";
import { PhotographyGallery } from "@/models/PhotographyGallery";
import { PlaceStory } from "@/models/PlaceStory";
import { SiteSettings } from "@/models/SiteSettings";

const modelMap = { posts: Post, projects: Project, photography: PhotographyGallery, places: PlaceStory };

function normalize(item: Record<string, unknown>): ContentItem {
  return {
    _id: String(item._id || ""), title: String(item.title || ""), slug: String(item.slug || ""), excerpt: String(item.excerpt || item.description || ""), content: String(item.content || ""), featuredImage: String(item.featuredImage || item.coverImage || ""), imageAlt: String(item.imageAlt || item.title || ""), category: String(item.category || (Array.isArray(item.categories) ? item.categories[0] : "")), tags: Array.isArray(item.tags) ? item.tags.map(String) : [], location: item.location ? String(item.location) : undefined, country: item.country ? String(item.country) : undefined, status: (item.status as ContentItem["status"]) || "published", publishedAt: new Date(String(item.publishedAt || item.createdAt || Date.now())).toISOString(), modifiedAt: item.updatedAt ? new Date(String(item.updatedAt)).toISOString() : undefined, isFeatured: Boolean(item.isFeatured), seoTitle: item.seoTitle ? String(item.seoTitle) : undefined, seoDescription: item.seoDescription ? String(item.seoDescription) : undefined, ogImage: item.ogImage ? String(item.ogImage) : undefined, gallery: Array.isArray(item.gallery) ? item.gallery as ContentItem["gallery"] : undefined, sections: Array.isArray(item.sections) ? item.sections as ContentItem["sections"] : undefined, authorName: item.authorName ? String(item.authorName) : undefined, authorTitle: item.authorTitle ? String(item.authorTitle) : undefined, authorBio: item.authorBio ? String(item.authorBio) : undefined, authorImage: item.authorImage ? String(item.authorImage) : undefined, readingTime: item.readingTime ? Number(item.readingTime) : undefined, technologies: Array.isArray(item.technologies) ? item.technologies.map(String) : undefined, projectUrl: item.projectUrl ? String(item.projectUrl) : undefined, repositoryUrl: item.repositoryUrl ? String(item.repositoryUrl) : undefined, year: item.year ? Number(item.year) : undefined,
  };
}

export async function getItems(kind: ContentKind, options: { featured?: boolean; limit?: number; category?: string; tag?: string; query?: string; page?: number } = {}) {
  try {
    if (!await connectDB()) throw new Error("No database configured");
    const filter: Record<string, unknown> = { status: "published" };
    if (options.featured) filter.isFeatured = true;
    if (options.category) filter.category = options.category;
    if (options.tag) filter.tags = options.tag;
    if (options.query) filter.$text = { $search: options.query };
    const limit = options.limit || 12;
    const docs = await modelMap[kind].find(filter).sort({ publishedAt: -1, order: 1 }).skip(((options.page || 1) - 1) * limit).limit(limit).lean();
    return docs.map((doc) => normalize(doc as Record<string, unknown>));
  } catch {
    let result = [...samples[kind]];
    if (options.featured) result = result.filter((item) => item.isFeatured);
    if (options.category) result = result.filter((item) => item.category === options.category);
    if (options.tag) result = result.filter((item) => item.tags.includes(options.tag as string));
    if (options.query) { const q = options.query.toLowerCase(); result = result.filter((item) => `${item.title} ${item.excerpt} ${item.tags.join(" ")}`.toLowerCase().includes(q)); }
    const limit = options.limit || 12; const offset = ((options.page || 1) - 1) * limit;
    return result.slice(offset, offset + limit);
  }
}

export async function getItem(kind: ContentKind, slug: string) {
  try {
    if (!await connectDB()) throw new Error("No database configured");
    const doc = await modelMap[kind].findOne({ slug, status: "published" }).lean();
    return doc ? normalize(doc as Record<string, unknown>) : null;
  } catch { return samples[kind].find((item) => item.slug === slug) || null; }
}

export async function getSettings(): Promise<SiteSettingsData> {
  try {
    if (!await connectDB()) throw new Error("No database configured");
    const doc = await SiteSettings.findOne({ key: "primary" }).lean();
    return doc ? { ...defaultSettings, ...(doc as Partial<SiteSettingsData>) } : defaultSettings;
  } catch { return defaultSettings; }
}
