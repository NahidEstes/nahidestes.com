import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { toPublicComment } from "@/lib/comment-core";
import { Comment } from "@/models/Comment";
import { PlaceStory } from "@/models/PlaceStory";
import { Post } from "@/models/Post";
import type { CommentPostType, PublicComment } from "@/types/comments";

export function commentArticleModel(postType: CommentPostType) {
  return postType === "post" ? Post : PlaceStory;
}

export function commentArticlePath(postType: CommentPostType, slug: string) {
  return `${postType === "post" ? "/journal" : "/places-culture"}/${slug}`;
}

export async function findPublishedCommentArticle(postType: CommentPostType, filter: { _id?: string; slug?: string }) {
  if (!await connectDB()) return null;
  const model = commentArticleModel(postType);
  return model.findOne({ ...filter, status: "published", deletedAt: null }).select("_id title slug commentsEnabled").lean() as Promise<{ _id: Types.ObjectId; title: string; slug: string; commentsEnabled?: boolean } | null>;
}

export async function getApprovedComments(postId: string, postType: CommentPostType, page = 1, limit = 50): Promise<{ comments: PublicComment[]; count: number }> {
  if (!Types.ObjectId.isValid(postId) || !await connectDB()) return { comments: [], count: 0 };
  const filter = { postId, postType, status: "approved" as const };
  const [docs, count] = await Promise.all([
    Comment.find(filter).select("_id name content createdAt").sort({ createdAt: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
    Comment.countDocuments(filter),
  ]);
  return { comments: docs.map((doc) => toPublicComment(doc)), count };
}
