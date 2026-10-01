"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { AdminRole } from "../admin-types";
import type { AdminContentRow, ContentCollection } from "@/types/content";

function localDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

type QuickForm = Record<string, string | boolean>;

function initialForm(row: AdminContentRow | null): QuickForm {
  if (!row) return {};
  return { title: row.title, slug: row.slug, status: row.status, category: row.category || "", tags: row.tags?.join(", ") || "", isFeatured: Boolean(row.isFeatured), publishedAt: localDate(row.publishedAt), scheduledAt: localDate(row.scheduledAt), country: row.country || "", location: row.location || "", technologies: row.technologies?.join(", ") || "", year: row.year ? String(row.year) : "", order: row.order == null ? "" : String(row.order), capturedAt: localDate(row.capturedAt) };
}

export function QuickEditPanel({ row, collection, role, busy, errors, onClose, onSave }: {
  row: AdminContentRow | null; collection: ContentCollection; role: AdminRole; busy: boolean;
  errors?: Record<string, string[]>;
  onClose: () => void; onSave: (payload: Record<string, unknown>) => void;
}) {
  const [original] = useState<QuickForm>(() => initialForm(row));
  const [form, setForm] = useState<QuickForm>(() => initialForm(row));
  const [clientErrors, setClientErrors] = useState<Record<string, string[]>>({});
  if (!row) return null;
  const field = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));
  const fieldErrors = { ...errors, ...clientErrors };
  const errorFor = (key: string) => fieldErrors[key]?.[0] ? <small className="field-error">{fieldErrors[key][0]}</small> : null;
  const close = () => {
    if (JSON.stringify(form) !== JSON.stringify(original) && !window.confirm("Discard your unsaved Quick Edit changes?")) return;
    onClose();
  };
  const submit = () => {
    const validation: Record<string, string[]> = {};
    if (String(form.title || "").trim().length < 2) validation.title = ["Enter a title with at least 2 characters."];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(form.slug || ""))) validation.slug = ["Use lowercase letters, numbers, and hyphens only."];
    if (String(form.category || "").trim().length < 2) validation.category = ["Enter a category."];
    const tags = String(form.tags || "").split(",").map((item) => item.trim()).filter(Boolean);
    if (tags.length > 40) validation.tags = ["Use no more than 40 tags."];
    if (form.status === "scheduled" && !form.scheduledAt) validation.scheduledAt = ["Choose a schedule date and time."];
    setClientErrors(validation);
    if (Object.keys(validation).length) return;
    const payload: Record<string, unknown> = { title: form.title, slug: form.slug, status: form.status, category: form.category, tags: String(form.tags || "").split(",").map((item) => item.trim()).filter(Boolean), isFeatured: form.isFeatured, version: row.version };
    if (form.publishedAt) payload.publishedAt = new Date(String(form.publishedAt)).toISOString();
    if (form.status === "scheduled" && form.scheduledAt) payload.scheduledAt = new Date(String(form.scheduledAt)).toISOString();
    if (collection === "places") Object.assign(payload, { country: form.country, location: form.location });
    if (collection === "photography") Object.assign(payload, { location: form.location, ...(form.capturedAt ? { capturedAt: new Date(String(form.capturedAt)).toISOString() } : {}) });
    if (collection === "projects") Object.assign(payload, { technologies: String(form.technologies || "").split(",").map((item) => item.trim()).filter(Boolean), ...(form.year ? { year: Number(form.year) } : {}), ...(form.order !== "" ? { order: Number(form.order) } : {}) });
    onSave(payload);
  };
  return <div className="dialog-backdrop"><section className="quick-edit-panel" role="dialog" aria-modal="true" aria-labelledby="quick-edit-title"><button type="button" className="dialog-close" onClick={close} disabled={busy} aria-label="Close quick edit"><X size={18}/></button><div className="eyebrow">Quick edit</div><h2 id="quick-edit-title">{row.title}</h2>{fieldErrors.form?.[0] && <p className="field-error">{fieldErrors.form[0]}</p>}<div className="quick-edit-grid"><label>Title<input value={String(form.title || "")} onChange={(event) => field("title", event.target.value)}/>{errorFor("title")}</label><label>Slug<input value={String(form.slug || "")} onChange={(event) => field("slug", event.target.value)}/>{errorFor("slug")}</label><label>Status<select value={String(form.status || "draft")} onChange={(event) => field("status", event.target.value)}><option value="draft">Draft</option>{role === "admin" && <><option value="published">Published</option><option value="scheduled">Scheduled</option></>}</select>{errorFor("status")}</label><label>Category<input value={String(form.category || "")} onChange={(event) => field("category", event.target.value)}/>{errorFor("category")}</label><label className="wide">Tags <span>(comma separated)</span><input value={String(form.tags || "")} onChange={(event) => field("tags", event.target.value)}/>{errorFor("tags")}</label><label>Published at<input type="datetime-local" value={String(form.publishedAt || "")} onChange={(event) => field("publishedAt", event.target.value)}/>{errorFor("publishedAt")}</label>{form.status === "scheduled" && <label>Scheduled for<input type="datetime-local" value={String(form.scheduledAt || "")} onChange={(event) => field("scheduledAt", event.target.value)}/>{errorFor("scheduledAt")}</label>}{collection === "places" && <><label>Country<input value={String(form.country || "")} onChange={(event) => field("country", event.target.value)}/></label><label>Location<input value={String(form.location || "")} onChange={(event) => field("location", event.target.value)}/></label></>}{collection === "photography" && <><label>Location<input value={String(form.location || "")} onChange={(event) => field("location", event.target.value)}/></label><label>Captured at<input type="datetime-local" value={String(form.capturedAt || "")} onChange={(event) => field("capturedAt", event.target.value)}/></label></>}{collection === "projects" && <><label className="wide">Technologies <span>(comma separated)</span><input value={String(form.technologies || "")} onChange={(event) => field("technologies", event.target.value)}/></label><label>Year<input type="number" value={String(form.year || "")} onChange={(event) => field("year", event.target.value)}/>{errorFor("year")}</label><label>Order<input type="number" min="0" value={String(form.order ?? "")} onChange={(event) => field("order", event.target.value)}/>{errorFor("order")}</label></>}<label className="check-row"><input type="checkbox" checked={Boolean(form.isFeatured)} onChange={(event) => field("isFeatured", event.target.checked)}/> Featured</label></div><div className="dialog-actions"><button type="button" className="button" onClick={close} disabled={busy}>Cancel</button><button type="button" className="button dark" onClick={submit} disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div></section></div>;
}
