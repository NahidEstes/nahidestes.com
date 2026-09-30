import { Schema, model, models } from "mongoose";

const subscriberSchema = new Schema({ email: { type: String, required: true, unique: true, lowercase: true, index: true }, status: { type: String, enum: ["active", "unsubscribed"], default: "active" }, subscribedAt: { type: Date, default: Date.now } }, { timestamps: true });
export const Subscriber = models.Subscriber || model("Subscriber", subscriberSchema);
