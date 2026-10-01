"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiRequest, contentLabels } from "./admin-types";
import { useToast } from "./toast-provider";
import { ContentPagination } from "./content-list/content-pagination";
import type { AdminContentRow, ContentBulkResult, ContentPagination as PaginationData } from "@/types/content";

type ScheduledResponse = { items: AdminContentRow[]; pagination: PaginationData };

function scheduleState(value: string | null | undefined, now: number) {
  const time = new Date(value || "").getTime();
  if (Number.isNaN(time)) return "Schedule unavailable";
  const minutes = Math.round(Math.abs(time - now) / 60000);
  const amount = minutes >= 1440 ? `${Math.round(minutes / 1440)}d` : minutes >= 60 ? `${Math.round(minutes / 60)}h` : `${minutes}m`;
  return time < now ? `Overdue by ${amount}` : `In ${amount}`;
}

function displayDate(value?: string | null) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export function ScheduledContent() {
  const { notify } = useToast();
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const [data, setData] = useState<ScheduledResponse>({ items: [], pagination: { page: 1, limit: 20, total: 0, totalItems: 0, totalPages: 1, hasPreviousPage: false, hasNextPage: false } });
  const [now] = useState(() => Date.now());
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [draft, setDraft] = useState(params.get("q") || ""); const [reschedule, setReschedule] = useState<AdminContentRow | null>(null); const [date, setDate] = useState("");
  const replace = useCallback((updates: Record<string, string | number>) => { const next = new URLSearchParams(params.toString()); Object.entries(updates).forEach(([key, value]) => value ? next.set(key, String(value)) : next.delete(key)); router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }); }, [params, pathname, router]);
  useEffect(() => { const q = params.get("q") || ""; if (draft === q) return; const timer = window.setTimeout(() => replace({ q: draft, page: "" }), 400); return () => window.clearTimeout(timer); }, [draft, params, replace]);
  const load = useCallback(async () => { setLoading(true); setError(""); const result = await apiRequest<ScheduledResponse>(`/api/admin/scheduled?${params}`); if (result.ok) setData(result.data); else setError(result.error.message); setLoading(false); }, [params]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const act = async (row: AdminContentRow, action: "publish" | "draft" | "schedule", scheduledAt?: string) => { const result = await apiRequest<ContentBulkResult>(`/api/admin/${row.collection}/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids: [row._id], ...(scheduledAt ? { scheduledAt } : {}) }) }); if (!result.ok) return notify(result.error.message, "error"); notify(action === "publish" ? "Content published." : action === "draft" ? "Schedule cancelled and draft restored." : "Schedule updated."); setReschedule(null); await load(); };
  return <><div className="admin-top"><div><div className="eyebrow">Publishing calendar</div><h1>Scheduled</h1><p className="admin-subtitle">Scheduled state is preserved here; automatic publishing depends on your existing deployment automation.</p></div></div><div className="admin-panel scheduled-manager"><label className="content-search"><span className="sr-only">Search scheduled content</span><input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Search scheduled content…"/></label>{loading ? <div className="content-loading"><span/><span/><span/></div> : error ? <div className="content-state error"><h2>Scheduled content could not be loaded</h2><p>{error}</p><button className="button" onClick={() => void load()}>Retry</button></div> : data.items.length ? <><div className="scheduled-list">{data.items.map((row) => <article key={`${row.collection}:${row._id}`} className={new Date(row.scheduledAt || "").getTime() < now ? "overdue" : ""}><div><span className="eyebrow">{contentLabels[row.collection]}</span><h2>{row.title}</h2><p>{displayDate(row.scheduledAt)} · <strong>{scheduleState(row.scheduledAt, now)}</strong> · {row.authorName || "No author"} · Updated {displayDate(row.updatedAt)}</p></div><div className="row-actions"><Link href={`/admin/${row.collection}/${row._id}/edit`}>Edit</Link><Link href={`/admin/preview/${row.collection}/${row._id}`} target="_blank">Preview ↗</Link><button type="button" onClick={() => void act(row, "publish")}>Publish now</button><button type="button" onClick={() => { setReschedule(row); setDate(""); }}>Reschedule</button><button type="button" onClick={() => void act(row, "draft")}>Cancel schedule</button></div></article>)}</div><ContentPagination pagination={data.pagination} onPage={(page) => replace({ page })} onLimit={(limit) => replace({ limit, page: 1 })}/></> : <div className="content-state"><h2>No scheduled content</h2><p>Content scheduled for future publication will appear here.</p></div>}</div>{reschedule && <div className="dialog-backdrop"><section className="confirmation-dialog" role="dialog" aria-modal="true"><h2>Reschedule “{reschedule.title}”</h2><label className="field">New date and time<input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)}/></label><div className="dialog-actions"><button className="button" onClick={() => setReschedule(null)}>Cancel</button><button className="button dark" disabled={!date} onClick={() => void act(reschedule, "schedule", new Date(date).toISOString())}>Save schedule</button></div></section></div>}</>;
}
