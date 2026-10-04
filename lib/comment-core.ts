import { z } from "zod";
import type { CommentModerationAction, CommentStatus, PublicComment } from "@/types/comments";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid article ID.");
const plainCommentText = (minimum: number, maximum: number) => z.string().trim().min(minimum).max(maximum).superRefine((value, context) => {
  if (value.includes("\0") || /<\s*\/?\s*[a-z][^>]*>/i.test(value) || /javascript\s*:/i.test(value)) {
    context.addIssue({ code: "custom", message: "HTML or script content is not allowed." });
  }
});

export const commentSubmissionSchema = z.object({
  postId: objectId,
  postType: z.enum(["post", "place"]),
  name: plainCommentText(2, 80),
  email: z.email("Enter a valid email address.").trim().max(254).transform((value) => value.toLowerCase()),
  content: plainCommentText(5, 2000),
  website: z.string().max(240).optional().default(""),
  formStartedAt: z.number().int().positive(),
}).strict();

export const commentModerationSchema = z.object({
  action: z.enum(["approve", "pending", "spam", "trash", "restore"]),
}).strict();

export function isRealisticCommentTiming(formStartedAt: number, now = Date.now()) {
  const elapsed = now - formStartedAt;
  return elapsed >= 3_000 && elapsed <= 24 * 60 * 60_000;
}

export function commentTransition(current: CommentStatus, action: CommentModerationAction) {
  const transitions: Record<CommentModerationAction, Partial<Record<CommentStatus, CommentStatus>>> = {
    approve: { pending: "approved", spam: "approved" },
    pending: { approved: "pending", spam: "pending" },
    spam: { pending: "spam", approved: "spam" },
    trash: { pending: "trashed", approved: "trashed", spam: "trashed" },
    restore: { trashed: "pending" },
  };
  return transitions[action][current] || null;
}

export function canPermanentlyDeleteComment(status: CommentStatus) {
  return status === "trashed";
}

export function toPublicComment(value: { _id: unknown; name: unknown; content: unknown; createdAt: unknown }): PublicComment {
  return {
    id: String(value._id),
    name: String(value.name),
    content: String(value.content),
    createdAt: new Date(String(value.createdAt)).toISOString(),
  };
}
