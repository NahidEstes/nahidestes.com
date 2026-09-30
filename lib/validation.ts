import { z } from "zod";

export const newsletterSchema = z.object({ email: z.email().max(160) });
export const contactSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email().max(160), subject: z.string().trim().min(3).max(160), message: z.string().trim().min(10).max(5000) });
export const contentSchema = z.object({
  title: z.string().trim().min(2).max(180), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), excerpt: z.string().trim().min(10).max(500), content: z.string().min(10), featuredImage: z.url(), imageAlt: z.string().trim().min(3).max(220), category: z.string().trim().min(2).max(80), tags: z.array(z.string()).default([]), status: z.enum(["draft", "published", "scheduled"]), publishedAt: z.string(), isFeatured: z.boolean().default(false), seoTitle: z.string().max(70).optional(), seoDescription: z.string().max(170).optional(), ogImage: z.union([z.url(),z.literal("")]).optional(), readingTime: z.number().int().positive().optional(), authorName: z.string().max(120).optional(), authorTitle: z.string().max(180).optional(), authorBio: z.string().max(1200).optional(), authorImage: z.union([z.url(),z.literal("")]).optional(), sections: z.array(z.unknown()).optional(), gallery: z.array(z.unknown()).optional(),
});
