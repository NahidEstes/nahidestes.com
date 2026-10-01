"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, editableCollections, type AdminRole, type AdminRow } from "./admin-types";
import { ContentTable } from "./content-table";
import { useToast } from "./toast-provider";
import type { PaginatedContentResponse } from "@/types/content";

type Metrics = { all: number; published: number; draft: number; scheduled: number; trash: number; featured: number; unread: number };

export function AdminDashboard({ role }: { role: AdminRole }) {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ all: 0, published: 0, draft: 0, scheduled: 0, trash: 0, featured: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(editableCollections.map((collection) => apiRequest<PaginatedContentResponse>(`/api/admin/${collection}?limit=8`)));
    const failure = results.find((result) => !result.ok);
    if (failure && !failure.ok) notify(failure.error.message, "error");
    const content = results.flatMap((result) => result.ok ? result.data.items : []).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    setRows(content);
    const aggregate = results.reduce<Metrics>((total, result) => {
      if (!result.ok) return total;
      for (const key of ["all", "published", "draft", "scheduled", "trash", "featured"] as const) total[key] += result.data.statusCounts[key];
      return total;
    }, { all: 0, published: 0, draft: 0, scheduled: 0, trash: 0, featured: 0, unread: 0 });
    if (role === "admin") {
      const messages = await apiRequest<AdminRow[]>("/api/admin/messages");
      if (messages.ok) aggregate.unread = messages.data.filter((item) => item.status === "unread").length;
    }
    setMetrics(aggregate);
    setLoading(false);
  }, [notify, role]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const cards = [["All content", metrics.all, "/admin/posts"], ["Published", metrics.published, "/admin/posts?status=published"], ["Drafts", metrics.draft, "/admin/posts?status=draft"], ["Scheduled", metrics.scheduled, "/admin/scheduled"], ["Featured", metrics.featured, "/admin/posts?featured=true"], ...(role === "admin" ? [["Trash", metrics.trash, "/admin/trash"], ["Unread messages", metrics.unread, "/admin/messages"]] : [])] as Array<[string, number, string]>;
  return <><div className="admin-top"><div><div className="eyebrow">Content studio</div><h1>Good to see you.</h1></div><Link className="button dark" href="/admin/posts/new">Write a Story →</Link></div><div className="dashboard-quick-links"><Link href="/admin/posts/new">New post</Link><Link href="/admin/projects/new">New project</Link><Link href="/admin/photography/new">New gallery</Link><Link href="/admin/places/new">New place story</Link><Link href="/admin/scheduled">Scheduled content</Link><Link href="/" target="_blank">View website ↗</Link></div><div className="stat-grid">{cards.map(([label, count, href]) => <Link className="stat-card" href={href} key={label}><span>{label}</span><strong>{loading ? "…" : count}</strong></Link>)}</div><div className="admin-panel"><div className="panel-heading"><h2 className="display">Recent content</h2><button type="button" className="text-button" onClick={() => void load()} disabled={loading}>Retry / Refresh</button></div><ContentTable rows={rows.slice(0, 8)} role={role} onRefresh={load} embedded/></div></>;
}
