import assert from "node:assert/strict";
import test from "node:test";
import { canPermanentlyDeleteComment, commentSubmissionSchema, commentTransition, isRealisticCommentTiming, toPublicComment } from "../lib/comment-core";
import { checkRateLimit } from "../lib/rate-limit";
import { placeCreateSchema, postCreateSchema, postPatchSchema } from "../lib/validation";

const validComment = {
  postId: "507f1f77bcf86cd799439011",
  postType: "post" as const,
  name: "  A Reader  ",
  email: "READER@EXAMPLE.COM",
  content: "A thoughtful comment.",
  website: "",
  formStartedAt: Date.now() - 10_000,
};

test("comment submission trims fields and normalizes email", () => {
  const result = commentSubmissionSchema.parse(validComment);
  assert.equal(result.name, "A Reader");
  assert.equal(result.email, "reader@example.com");
  assert.equal(result.content, "A thoughtful comment.");
});

test("comment validation rejects malformed IDs, HTML, scripts, null bytes, and oversized content", () => {
  assert.equal(commentSubmissionSchema.safeParse({ ...validComment, postId: "bad" }).success, false);
  assert.equal(commentSubmissionSchema.safeParse({ ...validComment, content: "<strong>unsafe</strong>" }).success, false);
  assert.equal(commentSubmissionSchema.safeParse({ ...validComment, content: "javascript:alert(1)" }).success, false);
  assert.equal(commentSubmissionSchema.safeParse({ ...validComment, content: "hello\0world" }).success, false);
  assert.equal(commentSubmissionSchema.safeParse({ ...validComment, content: "x".repeat(2001) }).success, false);
});

test("honeypot is represented in the schema and unrealistic timing is rejected", () => {
  assert.equal(commentSubmissionSchema.parse({ ...validComment, website: "spam.example" }).website, "spam.example");
  assert.equal(isRealisticCommentTiming(Date.now() - 500), false);
  assert.equal(isRealisticCommentTiming(Date.now() - 5_000), true);
  assert.equal(isRealisticCommentTiming(Date.now() - 25 * 60 * 60_000), false);
});

test("moderation transitions enforce Trash-only restoration and explicit state changes", () => {
  assert.equal(commentTransition("pending", "approve"), "approved");
  assert.equal(commentTransition("approved", "spam"), "spam");
  assert.equal(commentTransition("spam", "trash"), "trashed");
  assert.equal(commentTransition("trashed", "restore"), "pending");
  assert.equal(commentTransition("pending", "restore"), null);
  assert.equal(commentTransition("trashed", "approve"), null);
  assert.equal(canPermanentlyDeleteComment("trashed"), true);
  assert.equal(canPermanentlyDeleteComment("pending"), false);
  assert.equal(canPermanentlyDeleteComment("approved"), false);
});

test("rate limiter blocks requests after the configured allowance", () => {
  const key = `comment-test-${crypto.randomUUID()}`;
  assert.equal(checkRateLimit(key, 1, 60_000).allowed, true);
  const blocked = checkRateLimit(key, 1, 60_000);
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.remaining, 0);
  assert.ok(blocked.resetAt > Date.now());
});

test("public comment serializer never includes private moderation fields", () => {
  const result = toPublicComment({ _id: validComment.postId, name: validComment.name, content: validComment.content, createdAt: "2026-10-04T00:00:00.000Z", email: validComment.email, ipHash: "private" } as never);
  assert.deepEqual(Object.keys(result).sort(), ["content", "createdAt", "id", "name"]);
  assert.equal("email" in result, false);
  assert.equal("ipHash" in result, false);
});

const validArticle = {
  title: "Comment-ready article",
  slug: "comment-ready-article",
  excerpt: "A sufficiently long article excerpt.",
  content: "<p>Article content.</p>",
  featuredImage: "https://images.unsplash.com/photo.jpg",
  imageAlt: "A descriptive image",
  category: "Journal",
  tags: [],
  status: "draft" as const,
  publishedAt: "2026-10-04",
  isFeatured: false,
};

test("new articles default comments on and patches preserve explicit comment settings", () => {
  assert.equal(postCreateSchema.parse(validArticle).commentsEnabled, true);
  assert.equal(placeCreateSchema.parse(validArticle).commentsEnabled, true);
  assert.equal(postPatchSchema.parse({ commentsEnabled: false }).commentsEnabled, false);
  assert.equal(Object.hasOwn(postPatchSchema.parse({ title: "Updated title" }), "commentsEnabled"), false);
});
