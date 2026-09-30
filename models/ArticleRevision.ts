import { Schema, model, models } from "mongoose";

const articleRevisionSchema = new Schema(
  {
    articleId: { type: Schema.Types.ObjectId, required: true, index: true },
    contentCollection: { type: String, enum: ["posts", "places"], required: true, index: true },
    editorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    editorName: String,
    snapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

articleRevisionSchema.index({ articleId: 1, contentCollection: 1, createdAt: -1 });
export const ArticleRevision = models.ArticleRevision || model("ArticleRevision", articleRevisionSchema);
