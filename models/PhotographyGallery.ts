import { Schema, model, models } from "mongoose";

const photographySchema = new Schema({ title: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true }, description: String, excerpt: String, content: String, category: { type: String, index: true }, tags: [String], location: String, coverImage: String, featuredImage: String, imageAlt: String, images: [{ url: String, alt: String }], capturedAt: Date, publishedAt: Date, status: { type: String, default: "published" }, isFeatured: { type: Boolean, default: false } }, { timestamps: true });
export const PhotographyGallery = models.PhotographyGallery || model("PhotographyGallery", photographySchema);
