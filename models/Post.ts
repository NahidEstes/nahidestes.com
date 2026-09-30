import { Schema, model, models } from "mongoose";

const postSchema = new Schema({ title: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true }, excerpt: String, content: String, featuredImage: String, imageAlt: String, category: { type: String, index: true }, tags: [String], author: { type: Schema.Types.ObjectId, ref: "User" }, authorName: String, authorTitle: String, authorBio: String, authorImage: String, status: { type: String, enum: ["draft", "published", "scheduled"], default: "draft", index: true }, publishedAt: Date, scheduledAt: Date, isFeatured: { type: Boolean, default: false }, readingTime: Number, sections: [Schema.Types.Mixed], gallery: [Schema.Types.Mixed], seoTitle: String, seoDescription: String, ogImage: String }, { timestamps: true });
postSchema.index({ title: "text", excerpt: "text", content: "text" });
export const Post = models.Post || model("Post", postSchema);
