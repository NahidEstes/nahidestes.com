import { Schema, model, models } from "mongoose";

const siteSettingsSchema = new Schema({ key: { type: String, unique: true, default: "primary" }, siteTitle: String, tagline: String, biography: String, profileImage: String, email: String, socialLinks: { instagram: String, facebook: String, youtube: String, linkedin: String }, contactDetails: Schema.Types.Mixed, defaultSeo: Schema.Types.Mixed }, { timestamps: true });
export const SiteSettings = models.SiteSettings || model("SiteSettings", siteSettingsSchema);
