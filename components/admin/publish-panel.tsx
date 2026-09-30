"use client";

import { ExternalLink, Eye, Save, Send, Trash2 } from "lucide-react";
import type { AdminRole } from "./admin-types";

export function PublishPanel({ role, status, scheduledAt, featured, saving, saveState, lastSaved, publicUrl, canPreview, canTrash = canPreview, onStatus, onSchedule, onFeatured, onSaveDraft, onPublish, onPreview, onTrash }: {
  role: AdminRole;
  status: string;
  scheduledAt: string;
  featured: boolean;
  saving: boolean;
  saveState: "idle" | "dirty" | "saving" | "saved" | "error";
  lastSaved?: Date;
  publicUrl?: string;
  canPreview: boolean;
  canTrash?: boolean;
  onStatus: (status: string) => void;
  onSchedule: (value: string) => void;
  onFeatured: (value: boolean) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onTrash: () => void;
}) {
  const canPublish = role === "admin";
  const stateLabel = saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : saveState === "dirty" ? "Unsaved changes" : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not saved yet";
  return <aside className="publish-panel"><div className="panel-heading"><h2>Publishing</h2><span className={`save-state ${saveState}`}>{stateLabel}</span></div><div className="field"><label>Current status</label><select value={status} onChange={(event) => onStatus(event.target.value)} disabled={!canPublish}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select>{!canPublish && <small>Editors can save and preview drafts; an administrator publishes them.</small>}</div>{status === "scheduled" && <div className="field"><label>Schedule date and time</label><input type="datetime-local" value={scheduledAt} onChange={(event) => onSchedule(event.target.value)} disabled={!canPublish}/></div>}<label className="check-label"><input type="checkbox" checked={featured} onChange={(event) => onFeatured(event.target.checked)}/> Feature this item</label><div className="publish-actions"><button type="button" className="button" onClick={onSaveDraft} disabled={saving}><Save size={16}/> Save Draft</button><button type="button" className="button" onClick={onPreview} disabled={!canPreview || saving}><Eye size={16}/> Preview</button>{canPublish && <button type="button" className="button dark primary-publish" onClick={onPublish} disabled={saving}><Send size={16}/>{status === "published" ? "Update" : status === "scheduled" ? "Schedule" : "Publish"}</button>}</div>{publicUrl && <a className="public-url" href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Open public URL</a>}<button type="button" className="trash-button" onClick={onTrash} disabled={!canTrash || saving}><Trash2 size={15}/> Move to Trash</button></aside>;
}
