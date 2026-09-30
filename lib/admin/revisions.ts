import { ArticleRevision } from "@/models/ArticleRevision";
import type { ContentCollection } from "@/lib/admin/api";

const revisionFields = [
  "title", "slug", "excerpt", "content", "featuredImage", "imageAlt", "category", "tags",
  "status", "publishedAt", "scheduledAt", "isFeatured", "seoTitle", "seoDescription", "ogImage",
  "readingTime", "authorName", "authorTitle", "authorBio", "authorImage", "sections", "gallery",
  "authorImageAlt", "authorImageCaption", "authorImageWidth", "authorImageHeight", "authorImageDecorative",
  "featuredImageCaption", "featuredImageWidth", "featuredImageHeight", "featuredImageDecorative",
  "ogImageAlt", "ogImageCaption", "ogImageWidth", "ogImageHeight", "ogImageDecorative",
  "country", "location", "version",
] as const;

export function revisionSnapshot(document: Record<string, unknown>) {
  return revisionFields.reduce<Record<string, unknown>>((snapshot, field) => {
    if (document[field] !== undefined) snapshot[field] = document[field];
    return snapshot;
  }, {});
}

export async function createArticleRevision(
  collection: ContentCollection,
  document: Record<string, unknown>,
  actor: { id: string; name: string },
) {
  if (collection !== "posts" && collection !== "places") return;
  const articleId = document._id;
  if (!articleId) return;
  await ArticleRevision.create({ articleId, contentCollection: collection, editorId: actor.id, editorName: actor.name, snapshot: revisionSnapshot(document) });
  const older = await ArticleRevision.find({ articleId, contentCollection: collection }).sort({ createdAt: -1 }).skip(20).select("_id").lean();
  if (older.length) await ArticleRevision.deleteMany({ _id: { $in: older.map((item) => item._id) } });
}
