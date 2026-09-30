import { Schema, model, models } from "mongoose";

const contactMessageSchema = new Schema({ name: { type: String, required: true }, email: { type: String, required: true, index: true }, subject: String, message: String, status: { type: String, enum: ["unread", "read", "archived"], default: "unread", index: true } }, { timestamps: true });
export const ContactMessage = models.ContactMessage || model("ContactMessage", contactMessageSchema);
