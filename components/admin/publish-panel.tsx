"use client";

import { Eye, Save, Send, Settings2 } from "lucide-react";
import type { AdminRole } from "./admin-types";

export function PublishPanel({ role, status, saving, saveState, lastSaved, canPreview, onSaveDraft, onPublish, onPreview, onSettings, settingsOpen, settingsId }: {
  role: AdminRole;
  status: string;
  saving: boolean;
  saveState: "idle" | "dirty" | "saving" | "saved" | "error";
  lastSaved?: Date;
  canPreview: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  onPreview: () => void;
  onSettings: () => void;
  settingsOpen: boolean;
  settingsId: string;
}) {
  const canPublish = role === "admin";
  const stateLabel = saveState === "saving" ? "Saving…" : saveState === "error" ? "Save failed" : saveState === "dirty" ? "Unsaved changes" : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Not saved yet";
  return <aside className="publish-panel compact-publishing" aria-label="Publishing controls">
    <div className="publishing-state"><h2>Publishing</h2><span role="status" aria-live="polite" className={`save-state ${saveState}`}>{stateLabel}</span></div>
    <div className="publishing-status">Current status<span className={`status status-${status}`}>{status}</span></div>
    <div className="publish-actions">
      <button type="button" className="button" onClick={onSaveDraft} disabled={saving}><Save size={15}/><span>Save Draft</span></button>
      <button type="button" className="button" onClick={onPreview} disabled={!canPreview || saving}><Eye size={15}/><span>Preview</span></button>
      {canPublish && <button type="button" className="button dark primary-publish" onClick={onPublish} disabled={saving}><Send size={15}/><span>{status === "published" ? "Update" : status === "scheduled" ? "Schedule" : "Publish"}</span></button>}
      <button type="button" className="button editor-settings-trigger" aria-haspopup="dialog" aria-expanded={settingsOpen} aria-controls={settingsId} onClick={onSettings}><Settings2 size={15}/><span>Article settings</span></button>
    </div>
  </aside>;
}
