"use client";

import { FormEvent, useState } from "react";
import type { CommentPostType, PublicComment } from "@/types/comments";

type CommentForm = { name: string; email: string; content: string; website: string };
type PublicError = { message?: string; fieldErrors?: Record<string, string> };
const emptyForm: CommentForm = { name: "", email: "", content: "", website: "" };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}

export function CommentSection({ postId, postType, commentsEnabled, initialComments, initialCount }: {
  postId: string;
  postType: CommentPostType;
  commentsEnabled: boolean;
  initialComments: PublicComment[];
  initialCount: number;
}) {
  const [form, setForm] = useState<CommentForm>(emptyForm);
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState<"success" | "error">("success");
  const [submitting, setSubmitting] = useState(false);
  const update = (field: keyof CommentForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const validate = () => {
    const errors: Record<string, string> = {};
    if (form.name.trim().length < 2) errors.name = "Enter at least 2 characters.";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address.";
    if (form.content.trim().length < 5) errors.content = "Enter at least 5 characters.";
    if (form.content.trim().length > 2000) errors.content = "Keep your comment within 2000 characters.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !validate()) return;
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ postId, postType, ...form, formStartedAt }),
      });
      const payload = await response.json() as PublicError;
      if (!response.ok) {
        setTone("error");
        setMessage(payload.message || "Your comment could not be submitted.");
        setFieldErrors(payload.fieldErrors || {});
        return;
      }
      setTone("success");
      setMessage(payload.message || "Your comment has been submitted and is awaiting moderation.");
      setForm(emptyForm);
      setFieldErrors({});
      setFormStartedAt(Date.now());
    } catch {
      setTone("error");
      setMessage("Network error. Your comment is still here—please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return <section className="article-comments" aria-labelledby="comments-heading">
    <div className="comments-heading"><div><div className="eyebrow">Join the conversation</div><h2 className="display" id="comments-heading">Comments</h2></div><span aria-label={`${initialCount} approved comments`}>{initialCount}</span></div>
    <div className="comment-list">
      {initialComments.length ? initialComments.map((comment) => <article className="comment-card" key={comment.id}><div className="comment-avatar" aria-hidden="true">{initials(comment.name)}</div><div><header><strong>{comment.name}</strong><time dateTime={comment.createdAt}>{displayDate(comment.createdAt)}</time></header><p>{comment.content}</p></div></article>) : <p className="comment-empty">Be the first to comment.</p>}
    </div>
    {commentsEnabled ? <form className="comment-form" onSubmit={submit} noValidate>
      <div><h3>Leave a comment</h3><p>Your email address will not be published.</p></div>
      <div className="comment-form-grid">
        <label>Name <span aria-hidden="true">*</span><input name="name" autoComplete="name" required minLength={2} maxLength={80} value={form.name} onChange={(event) => update("name", event.target.value)} aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "comment-name-error" : undefined}/>{fieldErrors.name && <small id="comment-name-error" className="field-error">{fieldErrors.name}</small>}</label>
        <label>Email <span aria-hidden="true">*</span><input name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={(event) => update("email", event.target.value)} aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "comment-email-error" : undefined}/>{fieldErrors.email && <small id="comment-email-error" className="field-error">{fieldErrors.email}</small>}</label>
      </div>
      <label>Comment <span aria-hidden="true">*</span><textarea name="content" required minLength={5} maxLength={2000} rows={7} value={form.content} onChange={(event) => update("content", event.target.value)} aria-invalid={Boolean(fieldErrors.content)} aria-describedby={fieldErrors.content ? "comment-content-error" : undefined}/>{fieldErrors.content && <small id="comment-content-error" className="field-error">{fieldErrors.content}</small>}</label>
      <div className="comment-honeypot" aria-hidden="true"><label htmlFor="comment-website">Website</label><input id="comment-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => update("website", event.target.value)}/></div>
      <div className="comment-submit-row"><button className="button dark" type="submit" disabled={submitting}>{submitting ? "Submitting…" : "Submit Comment →"}</button><span className={`comment-form-message ${tone}`} role="status" aria-live="polite">{message}</span></div>
    </form> : <p className="comments-closed" role="status">Comments are closed for this article.</p>}
  </section>;
}
