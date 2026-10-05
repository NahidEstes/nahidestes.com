import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import type { AdminCollection } from "@/lib/admin/api";

const slug = z.string().trim().min(2).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only.");
const plain = (min: number, max: number) => z.string().trim().min(min).max(max);
const httpsUrl = z.string().trim().url("Enter a valid URL.").refine((value) => value.startsWith("https://"), "Use an HTTPS URL.");
const optionalHttpsUrl = z.union([httpsUrl, z.literal("")]).optional();
const status = z.enum(["draft", "published", "scheduled"]);
const dateValue = z.union([z.string().datetime(), z.string().date(), z.date()]);
const richText = (max: number) => z.string().max(max).refine((value) => value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim().length > 0, "Rich-text content cannot be empty.");

export const newsletterSchema = z.object({ email: z.email().max(160) });
export const contactSchema = z.object({ name: plain(2, 80), email: z.email().max(160), subject: plain(3, 160), message: plain(10, 5000) });

export const articleImageSchema = z.object({
  url: httpsUrl,
  alt: z.string().trim().max(220).default(""),
  caption: z.string().trim().max(500).optional(),
  width: z.number().int().positive().max(10000).optional(),
  height: z.number().int().positive().max(10000).optional(),
  decorative: z.boolean().optional(),
}).strict().superRefine((image, context) => {
  if (!image.decorative && image.alt.length < 3) context.addIssue({ code: "custom", path: ["alt"], message: "Alt text is required unless the image is decorative." });
});

const blockId = z.string().trim().min(1).max(120).optional();
const paragraphBlock = z.object({ id: blockId, type: z.literal("paragraph"), text: richText(50000) }).strict();
const headingBlock = z.object({ id: blockId, type: z.enum(["heading", "subheading"]), text: plain(1, 240) }).strict();
const imageBlock = z.object({ id: blockId, type: z.literal("image"), image: articleImageSchema, fullWidth: z.boolean().optional() }).strict();
const textImageBlock = z.object({ id: blockId, type: z.literal("text-image"), text: richText(50000), image: articleImageSchema, imagePosition: z.enum(["left", "right"]).optional(), emphasis: z.enum(["balanced", "image", "text"]).optional() }).strict();
const galleryBlock = z.object({ id: blockId, type: z.literal("gallery"), images: z.array(articleImageSchema).min(1).max(30), layout: z.enum(["grid", "two-columns", "editorial-strip", "full-width"]).optional() }).strict();
const quoteBlock = z.object({ id: blockId, type: z.enum(["blockquote", "pullquote"]), text: plain(1, 5000), source: z.string().trim().max(240).optional(), variant: z.enum(["inline", "card", "overlay"]).optional(), image: articleImageSchema.optional() }).strict().superRefine((block, context) => {
  if (block.variant === "overlay" && !block.image) context.addIssue({ code: "custom", path: ["image"], message: "An overlay quote needs an image." });
});
const listBlock = z.object({ id: blockId, type: z.enum(["ordered-list", "unordered-list"]), items: z.array(plain(1, 1000)).min(1) }).strict();
const dividerBlock = z.object({ id: blockId, type: z.literal("divider") }).strict();
const videoBlock = z.object({ id: blockId, type: z.literal("video"), url: httpsUrl.refine((value) => {
  try { return ["www.youtube.com", "youtube.com", "youtu.be", "player.vimeo.com", "vimeo.com"].includes(new URL(value).hostname); } catch { return false; }
}, "Use a supported YouTube or Vimeo URL."), title: z.string().trim().max(180).optional() }).strict();
const calloutBlock = z.object({ id: blockId, type: z.literal("callout"), title: z.string().trim().max(180).optional(), text: richText(10000) }).strict();
const knownBlockTypes = ["paragraph", "heading", "subheading", "image", "text-image", "gallery", "blockquote", "pullquote", "ordered-list", "unordered-list", "divider", "video", "callout"];
const unsupportedBlock = z.object({ id: blockId, type: z.string().refine((value) => !knownBlockTypes.includes(value), "Invalid block data.") }).passthrough();

export const articleBlockSchema = z.union([paragraphBlock, headingBlock, imageBlock, textImageBlock, galleryBlock, quoteBlock, listBlock, dividerBlock, videoBlock, calloutBlock, unsupportedBlock]);
export const articleSectionSchema = z.object({ id: z.string().trim().min(1).max(120), number: z.string().trim().max(20).optional(), heading: plain(1, 240), blocks: z.array(articleBlockSchema).max(100) }).strict();
const sectionsSchema = z.array(articleSectionSchema).max(100).superRefine((sections, context) => {
  const seen = new Set<string>();
  sections.forEach((section, index) => {
    if (seen.has(section.id)) context.addIssue({ code: "custom", path: [index, "id"], message: "Section IDs must be unique." });
    seen.add(section.id);
  });
});

const commonContentShape = {
  title: plain(2, 180), slug, excerpt: plain(10, 500), content: richText(100000),
  featuredImage: httpsUrl, imageAlt: z.string().trim().max(220), category: plain(2, 80),
  featuredImageCaption: z.string().trim().max(500).optional(), featuredImageWidth: z.number().int().positive().max(10000).optional(),
  featuredImageHeight: z.number().int().positive().max(10000).optional(), featuredImageDecorative: z.boolean().optional(),
  tags: z.array(plain(1, 80)).max(40).default([]), status, publishedAt: dateValue,
  scheduledAt: dateValue.optional(), isFeatured: z.boolean().default(false),
  seoTitle: z.string().trim().max(70).optional(), seoDescription: z.string().trim().max(170).optional(),
  ogImage: optionalHttpsUrl, ogImageAlt: z.string().trim().max(220).optional(), ogImageCaption: z.string().trim().max(500).optional(), ogImageWidth: z.number().int().positive().max(10000).optional(), ogImageHeight: z.number().int().positive().max(10000).optional(), ogImageDecorative: z.boolean().optional(), version: z.number().int().nonnegative().optional(),
};

const articleShape = {
  ...commonContentShape,
  commentsEnabled: z.boolean().default(true),
  readingTime: z.number().int().positive().max(1000).nullable().optional(),
  authorName: z.string().trim().max(120).optional(), authorTitle: z.string().trim().max(180).optional(),
  authorBio: z.string().trim().max(1200).optional(), authorImage: optionalHttpsUrl, authorImageAlt: z.string().trim().max(220).optional(), authorImageCaption: z.string().trim().max(500).optional(), authorImageWidth: z.number().int().positive().max(10000).optional(), authorImageHeight: z.number().int().positive().max(10000).optional(), authorImageDecorative: z.boolean().optional(),
  sections: sectionsSchema.optional(), gallery: z.array(articleImageSchema).max(50).optional(),
};
const articlePatchShape = { ...articleShape, commentsEnabled: z.boolean().optional() };

export const postCreateSchema = z.object(articleShape).strict();
export const postPatchSchema = z.object(articlePatchShape).partial().strict();
export const placeCreateSchema = z.object({ ...articleShape, country: z.string().trim().max(120).optional(), location: z.string().trim().max(180).optional() }).strict();
export const placePatchSchema = z.object({ ...articlePatchShape, country: z.string().trim().max(120).optional(), location: z.string().trim().max(180).optional() }).partial().strict();
export const projectCreateSchema = z.object({ ...commonContentShape, technologies: z.array(plain(1, 80)).max(40).optional(), projectUrl: optionalHttpsUrl, repositoryUrl: optionalHttpsUrl, year: z.number().int().min(1900).max(2200).optional(), order: z.number().int().min(0).max(100000).optional(), gallery: z.array(articleImageSchema).max(50).optional() }).strict();
export const projectPatchSchema = z.object({ ...commonContentShape, technologies: z.array(plain(1, 80)).max(40).optional(), projectUrl: optionalHttpsUrl, repositoryUrl: optionalHttpsUrl, year: z.number().int().min(1900).max(2200).optional(), order: z.number().int().min(0).max(100000).optional(), gallery: z.array(articleImageSchema).max(50).optional() }).partial().strict();
export const photographyCreateSchema = z.object({ ...commonContentShape, location: z.string().trim().max(180).optional(), capturedAt: dateValue.optional(), gallery: z.array(articleImageSchema).max(100).optional() }).strict();
export const photographyPatchSchema = z.object({ ...commonContentShape, location: z.string().trim().max(180).optional(), capturedAt: dateValue.optional(), gallery: z.array(articleImageSchema).max(100).optional() }).partial().strict();
export const categoryCreateSchema = z.object({ name: plain(2, 80), slug, type: z.enum(["post", "project", "photography", "place"]) }).strict();
export const categoryPatchSchema = categoryCreateSchema.partial().strict();
export const subscriberCreateSchema = z.object({ email: z.email().max(160), status: z.enum(["active", "unsubscribed"]).optional() }).strict();
export const subscriberPatchSchema = subscriberCreateSchema.partial().strict();
export const messagePatchSchema = z.object({ status: z.enum(["unread", "read", "archived"]) }).partial().strict();
export const settingsCreateSchema = z.object({ siteTitle: plain(2, 100), tagline: z.string().trim().max(180), biography: plain(20, 3000), profileImage: httpsUrl, email: z.email().max(160), socialLinks: z.record(z.string(), z.union([httpsUrl, z.literal("")])) }).strict();
export const settingsPatchSchema = settingsCreateSchema.partial().strict();

const bulkIds = z.array(z.string().regex(/^[a-f\d]{24}$/i, "Invalid content ID.")).min(1).max(100);
const bulkTags = z.array(plain(1, 80)).min(1).max(40);
export const contentBulkSchema = z.discriminatedUnion("action", [
  z.object({ action: z.enum(["publish", "draft", "feature", "unfeature", "trash", "restore", "delete"]), ids: bulkIds }).strict(),
  z.object({ action: z.literal("schedule"), ids: bulkIds, scheduledAt: z.string().datetime() }).strict(),
  z.object({ action: z.literal("category"), ids: bulkIds, category: plain(2, 80) }).strict(),
  z.object({ action: z.enum(["addTags", "removeTags"]), ids: bulkIds, tags: bulkTags }).strict(),
]);

export function schemaForCollection(collection: AdminCollection, partial: boolean) {
  const schemas = {
    posts: partial ? postPatchSchema : postCreateSchema,
    projects: partial ? projectPatchSchema : projectCreateSchema,
    photography: partial ? photographyPatchSchema : photographyCreateSchema,
    places: partial ? placePatchSchema : placeCreateSchema,
    categories: partial ? categoryPatchSchema : categoryCreateSchema,
    subscribers: partial ? subscriberPatchSchema : subscriberCreateSchema,
    messages: messagePatchSchema,
    settings: partial ? settingsPatchSchema : settingsCreateSchema,
  };
  return schemas[collection];
}

const allowedTags = ["p", "h2", "h3", "blockquote", "ul", "ol", "li", "strong", "em", "a", "br"];
export function sanitizeRichText(value: string) {
  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }, true) },
  }).trim();
}

export function sanitizeContentPayload(payload: Record<string, unknown>) {
  const next = structuredClone(payload);
  if (typeof next.content === "string") next.content = sanitizeRichText(next.content);
  if (Array.isArray(next.sections)) {
    next.sections = next.sections.map((section) => {
      if (!section || typeof section !== "object") return section;
      const copy = { ...(section as Record<string, unknown>) };
      if (Array.isArray(copy.blocks)) copy.blocks = copy.blocks.map((block) => {
        if (!block || typeof block !== "object") return block;
        const cleanBlock = { ...(block as Record<string, unknown>) };
        if (["paragraph", "text-image", "callout"].includes(String(cleanBlock.type)) && typeof cleanBlock.text === "string") cleanBlock.text = sanitizeRichText(cleanBlock.text);
        return cleanBlock;
      });
      return copy;
    });
  }
  return next;
}

export function validateContentImageFields(payload: Record<string, unknown>) {
  const errors: Record<string, string[]> = {};
  if (!payload.featuredImageDecorative && String(payload.imageAlt || "").trim().length < 3) errors.imageAlt = ["Alt text is required unless the featured image is decorative."];
  if (payload.authorImage && !payload.authorImageDecorative && String(payload.authorImageAlt || "").trim().length < 3) errors.authorImageAlt = ["Alt text is required unless the author image is decorative."];
  if (payload.ogImage && !payload.ogImageDecorative && String(payload.ogImageAlt || "").trim().length < 3) errors.ogImageAlt = ["Alt text is required unless the Open Graph image is decorative."];
  if (payload.status === "scheduled" && !payload.scheduledAt) errors.scheduledAt = ["Choose a schedule date and time."];
  return errors;
}
