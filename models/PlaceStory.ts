import { Schema, model, models } from "mongoose";

const placeStorySchema = new Schema({ title: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true }, country: String, location: String, excerpt: String, content: String, featuredImage: String, imageAlt: String, gallery: [Schema.Types.Mixed], sections: [Schema.Types.Mixed], category: String, tags: [String], author: { type: Schema.Types.ObjectId, ref: "User" }, authorName: String, authorTitle: String, authorBio: String, authorImage: String, readingTime: Number, status: { type: String, enum: ["draft", "published", "scheduled"], default: "draft", index: true }, publishedAt: Date, isFeatured: { type: Boolean, default: false }, seoTitle: String, seoDescription: String, ogImage: String }, { timestamps: true });
placeStorySchema.index({ title: "text", excerpt: "text", content: "text" });
export const PlaceStory = models.PlaceStory || model("PlaceStory", placeStorySchema);
