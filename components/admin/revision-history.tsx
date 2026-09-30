"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmationDialog } from "./confirmation-dialog";
import { apiRequest } from "./admin-types";
import { useToast } from "./toast-provider";

type Revision = { _id: string; editorName?: string; createdAt: string; snapshot?: { title?: string; status?: string } };

export function RevisionHistory({ collection, id, refreshKey, onRestored }: { collection: "posts" | "places"; id: string; refreshKey: number; onRestored: () => Promise<void> }) {
  const { notify } = useToast();
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [selected, setSelected] = useState<Revision | null>(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const result = await apiRequest<Revision[]>(`/api/admin/${collection}/${id}/revisions`);
    if (result.ok) setRevisions(result.data);
  }, [collection, id]);
  // Refresh after the editor reports a completed save as well as on mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load, refreshKey]);
  const restore = async () => {
    if (!selected) return;
    setBusy(true);
    const result = await apiRequest(`/api/admin/${collection}/${id}/revisions/${selected._id}/restore`, { method: "POST" });
    setBusy(false);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    notify("Revision restored. The previous version remains in history.");
    setSelected(null);
    await onRestored();
    await load();
  };
  return <section className="revision-panel"><div className="panel-heading"><h2>Revision history</h2><span>{revisions.length}/20</span></div>{revisions.length ? <ol>{revisions.map((revision) => <li key={revision._id}><div><strong>{new Date(revision.createdAt).toLocaleString()}</strong><small>{revision.editorName || "Unknown editor"} · {revision.snapshot?.status || "draft"}</small></div><div className="admin-actions"><a href={`/admin/preview/${collection}/${id}?revision=${revision._id}`} target="_blank" rel="noreferrer">Preview</a><button type="button" onClick={() => setSelected(revision)}>Restore</button></div></li>)}</ol> : <p>No previous revisions yet.</p>}<ConfirmationDialog open={Boolean(selected)} title="Restore this revision?" description="The current article will be saved as a new revision before this version is restored." confirmLabel="Restore revision" busy={busy} onConfirm={restore} onClose={() => setSelected(null)}/></section>;
}
