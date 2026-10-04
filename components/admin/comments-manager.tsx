"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { Check, RotateCcw, Search, ShieldAlert, Trash2, Undo2 } from "lucide-react";
import { apiRequest, type AdminRole } from "./admin-types";
import { ConfirmationDialog } from "./confirmation-dialog";
import { useToast } from "./toast-provider";
import type { AdminCommentRow, CommentModerationAction, CommentPagination, CommentStatusCounts } from "@/types/comments";

type CommentFilter = "all" | "pending" | "approved" | "spam" | "trash";
type CommentsResponse = { items: AdminCommentRow[]; pagination: CommentPagination; statusCounts: CommentStatusCounts };
const filters: Array<{ value: CommentFilter; label: string }> = [
  { value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Approved" }, { value: "spam", label: "Spam" }, { value: "trash", label: "Trash" },
];

function when(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function CommentsManager({ role }: { role: AdminRole }) {
  const { notify } = useToast();
  const [status, setStatus] = useState<CommentFilter>("pending");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<CommentsResponse>();
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState<string>();
  const [deleteTarget, setDeleteTarget] = useState<AdminCommentRow>();

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status, page: String(page), limit: "20" });
    if (query) params.set("q", query);
    const result = await apiRequest<CommentsResponse>(`/api/admin/comments?${params}`);
    setLoading(false);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    setData(result.data);
  }, [notify, page, query, status]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const chooseStatus = (value: CommentFilter) => { setStatus(value); setPage(1); };
  const submitSearch = (event: FormEvent) => { event.preventDefault(); setPage(1); setQuery(search.trim()); };
  const moderate = async (row: AdminCommentRow, action: CommentModerationAction) => {
    setWorking(row.id);
    const result = await apiRequest<{ id: string; status: string }>(`/api/admin/comments/${row.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ action }) });
    setWorking(undefined);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    notify(action === "approve" ? "Comment approved." : action === "spam" ? "Comment marked as spam." : action === "trash" ? "Comment moved to Trash." : action === "restore" ? "Comment restored to Pending." : "Comment returned to Pending.");
    await load();
  };
  const permanentlyDelete = async () => {
    if (!deleteTarget) return;
    setWorking(deleteTarget.id);
    const result = await apiRequest<{ id: string }>(`/api/admin/comments/${deleteTarget.id}`, { method: "DELETE" });
    setWorking(undefined);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    notify("Comment permanently deleted.");
    setDeleteTarget(undefined);
    await load();
  };

  const counts = data?.statusCounts;
  return <>
    <div className="admin-top"><div><h1>Comments</h1><p className="admin-subtitle">Review guest comments before they appear publicly.</p></div></div>
    <section className="admin-panel comments-manager">
      <div className="comment-admin-toolbar">
        <div className="content-status-tabs" role="tablist" aria-label="Filter comments by status">{filters.map((filter) => <button type="button" role="tab" aria-selected={status === filter.value} className={status === filter.value ? "active" : ""} key={filter.value} onClick={() => chooseStatus(filter.value)}>{filter.label} <span>{counts?.[filter.value] ?? 0}</span></button>)}</div>
        <form className="content-search comment-admin-search" onSubmit={submitSearch}><Search size={16}/><label className="sr-only" htmlFor="comment-search">Search comments</label><input id="comment-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, email, article or comment" maxLength={120}/><button type="submit">Search</button></form>
      </div>
      {loading ? <div className="content-state"><p>Loading comments…</p></div> : !data?.items.length ? <div className="content-state"><h2>No comments found</h2><p>There are no comments in this view.</p></div> : <div className="admin-table-wrap"><table className="admin-table comment-admin-table"><thead><tr><th>Commenter</th><th>Comment</th><th>Article</th><th>Type</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead><tbody>{data.items.map((row) => <tr key={row.id}><td><strong>{row.name}</strong><small>{row.email}</small></td><td><p className="comment-admin-preview">{row.content}</p></td><td>{row.articlePath ? <Link className="text-button" href={row.articlePath} target="_blank">{row.articleTitle}</Link> : row.articleTitle}</td><td>{row.postType === "post" ? "Journal" : "Place"}</td><td><span className={`status status-${row.status}`}>{row.status === "trashed" ? "trash" : row.status}</span></td><td>{when(row.createdAt)}</td><td><div className="row-actions comment-actions">
          {row.status !== "approved" && row.status !== "trashed" && <button disabled={working === row.id} onClick={() => void moderate(row, "approve")}><Check size={14}/>Approve</button>}
          {(row.status === "approved" || row.status === "spam") && <button disabled={working === row.id} onClick={() => void moderate(row, "pending")}><Undo2 size={14}/>Pending</button>}
          {row.status !== "spam" && row.status !== "trashed" && <button disabled={working === row.id} onClick={() => void moderate(row, "spam")}><ShieldAlert size={14}/>Spam</button>}
          {row.status !== "trashed" && <button className="danger-link" disabled={working === row.id} onClick={() => void moderate(row, "trash")}><Trash2 size={14}/>Trash</button>}
          {row.status === "trashed" && <button disabled={working === row.id} onClick={() => void moderate(row, "restore")}><RotateCcw size={14}/>Restore</button>}
          {row.status === "trashed" && role === "admin" && <button className="danger-link" disabled={working === row.id} onClick={() => setDeleteTarget(row)}><Trash2 size={14}/>Delete forever</button>}
        </div></td></tr>)}</tbody></table></div>}
      {data && <div className="content-pagination"><span>Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.total} comments</span><div><button type="button" disabled={!data.pagination.hasPreviousPage || loading} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button><button type="button" disabled={!data.pagination.hasNextPage || loading} onClick={() => setPage((value) => value + 1)}>Next</button></div></div>}
    </section>
    <ConfirmationDialog open={Boolean(deleteTarget)} title="Permanently delete this comment?" description="This action cannot be undone. Permanent deletion is only available for comments already in Trash." confirmLabel="Delete Forever" confirmationText="DELETE" busy={Boolean(deleteTarget && working === deleteTarget.id)} onConfirm={() => void permanentlyDelete()} onClose={() => setDeleteTarget(undefined)}/>
  </>;
}
