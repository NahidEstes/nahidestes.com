import { Schema, model, models } from "mongoose";

const imageSchema = new Schema({ url: String, alt: String }, { _id: false });
const projectSchema = new Schema({ title: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true }, description: String, excerpt: String, content: String, coverImage: String, featuredImage: String, imageAlt: String, gallery: [imageSchema], technologies: [String], categories: [String], category: String, tags: [String], projectUrl: String, repositoryUrl: String, year: Number, isFeatured: { type: Boolean, default: false }, order: { type: Number, default: 0 }, status: { type: String, default: "published" }, publishedAt: Date, seoTitle: String, seoDescription: String, ogImage: String }, { timestamps: true });
export const Project = models.Project || model("Project", projectSchema);
