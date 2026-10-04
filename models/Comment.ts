import { type InferSchemaType, type Model, Schema, model, models } from "mongoose";

const commentSchema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, required: true, index: true },
    postType: { type: String, enum: ["post", "place"], required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: ["pending", "approved", "spam", "trashed"], default: "pending", required: true, index: true },
    ipHash: { type: String, select: false },
    userAgent: { type: String, maxlength: 500, select: false },
    approvedAt: Date,
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User", select: false },
    deletedAt: Date,
  },
  { timestamps: true },
);

commentSchema.index({ postId: 1, postType: 1, status: 1, createdAt: 1 });
commentSchema.index({ status: 1, createdAt: -1 });
commentSchema.index({ email: 1 });

export type CommentRecord = InferSchemaType<typeof commentSchema>;
export const Comment = (models.Comment as Model<CommentRecord> | undefined) || model<CommentRecord>("Comment", commentSchema);
