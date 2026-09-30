"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ConfirmationDialog } from "./confirmation-dialog";
import { apiRequest, contentLabels, editableCollections, publicBases, type AdminRole, type AdminRow } from "./admin-types";
import { useToast } from "./toast-provider";
import type { ContentCollection } from "@/types/content";

type PendingAction = { row: AdminRow; type: "trash" | "delete" | "restore" } | null;

function isContentCollection(value: string | undefined): value is ContentCollection {
  return Boolean(value && editableCollections.includes(value as ContentCollection));
}

function rowTitle(row: AdminRow) {
  return row.title || row.name || row.email || row.subject || "Untitled";
}

export function ContentTable({ section, rows, role, trash = false, onRefresh, embedded = false }: {
  section?: string;
  rows: AdminRow[];
  role: AdminRole;
  trash?: boolean;
  onRefresh: () => Promise<void>;
  embedded?: boolean;
}) {
  const { notify } = useToast();
  const [pending, setPending] = useState<PendingAction>(null);
  const [busy, setBusy] = useState(false);
  const normalized = useMemo(() => rows.map((row) => ({ ...row, collection: row.collection || (isContentCollection(section) ? section : undefined) } as AdminRow)), [rows, section]);
  const act = async () => {
    if (!pending) return;
    const collection = pending.row.collection || section;
    if (!collection) return;
    setBusy(true);
    const endpoint = trash ? `/api/admin/${collection}/${pending.row._id}/trash` : `/api/admin/${collection}/${pending.row._id}`;
    const method = pending.type === "restore" ? "PATCH" : "DELETE";
    const result = await apiRequest(endpoint, { method });
    setBusy(false);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    notify(pending.type === "restore" ? "Content restored." : pending.type === "trash" ? "Moved to Trash." : "Permanently deleted.");
    setPending(null);
    await onRefresh();
  };
  const table = <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Title</th><th>Content type</th><th>Status</th><th>Last updated</th><th>Actions</th></tr></thead><tbody>{normalized.length ? normalized.map((row) => {
    const collection = row.collection;
    const identified = isContentCollection(collection);
    const title = rowTitle(row);
    const published = row.status === "published";
    return <tr key={`${collection || section || "unknown"}:${row._id}`}><td><strong>{title}</strong></td><td>{identified ? contentLabels[collection] : section ? section.replace(/s$/, "") : "Unknown"}</td><td><span className="status">{row.status || "active"}</span></td><td>{row.updatedAt || row.createdAt ? new Date(row.updatedAt || row.createdAt || "").toLocaleString() : "—"}</td><td><div className="admin-actions">{!trash && identified && <Link href={`/admin/${collection}/${row._id}/edit`}>Edit</Link>}{!trash && identified && (published ? <Link href={`${publicBases[collection]}/${row.slug}`} target="_blank">View</Link> : <Link href={`/admin/preview/${collection}/${row._id}`} target="_blank">Preview</Link>)}{trash && identified && role === "admin" && <button type="button" onClick={() => setPending({ row, type: "restore" })}>Restore</button>}{trash && identified && role === "admin" && <button type="button" className="danger-link" onClick={() => setPending({ row, type: "delete" })}>Delete forever</button>}{!trash && <button type="button" className="danger-link" disabled={identified ? false : role !== "admin"} title={!identified && role !== "admin" ? "Collection could not be identified" : undefined} onClick={() => identified ? setPending({ row, type: "trash" }) : role === "admin" && setPending({ row, type: "delete" })}>{identified ? "Move to Trash" : "Delete"}</button>}</div></td></tr>;
  }) : <tr><td colSpan={5}>No records found.</td></tr>}</tbody></table></div>;
  return <>{embedded ? table : <div className="admin-panel">{table}</div>}<ConfirmationDialog open={Boolean(pending)} title={pending?.type === "delete" ? "Permanently delete this record?" : pending?.type === "restore" ? "Restore this record?" : "Move this record to Trash?"} description={pending?.type === "delete" ? "This action cannot be undone and its revision history will also be removed." : pending?.type === "restore" ? "The record will return to its content list." : "The record will disappear from the public site and can be restored by an administrator."} confirmLabel={pending?.type === "delete" ? "Delete permanently" : pending?.type === "restore" ? "Restore" : "Move to Trash"} confirmationText={pending?.type === "delete" ? rowTitle(pending.row) : undefined} busy={busy} onConfirm={act} onClose={() => setPending(null)}/></>;
}
