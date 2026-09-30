import { Schema, model, models } from "mongoose";

const categorySchema = new Schema({ name: { type: String, required: true }, slug: { type: String, required: true, unique: true, index: true }, type: { type: String, enum: ["post", "project", "photography", "place"], required: true } }, { timestamps: true });
export const Category = models.Category || model("Category", categorySchema);
