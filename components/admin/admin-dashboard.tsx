"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiRequest, editableCollections, type AdminRole, type AdminRow } from "./admin-types";
import { ContentTable } from "./content-table";
import { useToast } from "./toast-provider";

export function AdminDashboard({ role }: { role: AdminRole }) {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(editableCollections.map((collection) => apiRequest<AdminRow[]>(`/api/admin/${collection}`)));
    const failure = results.find((result) => !result.ok);
    if (failure && !failure.ok) notify(failure.error.message, "error");
    const content = results.flatMap((result) => result.ok ? result.data : []).sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
    setRows(content);
    setLoading(false);
  }, [notify]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return <><div className="admin-top"><div><div className="eyebrow">Content studio</div><h1>Good to see you.</h1></div><Link className="button dark" href="/admin/posts/new">Write a Story →</Link></div><div className="stat-grid">{[["All content", rows.length], ["Published", rows.filter((row) => row.status === "published").length], ["Drafts", rows.filter((row) => row.status === "draft").length], ["Featured", rows.filter((row) => row.isFeatured).length]].map(([label, count]) => <div className="stat-card" key={String(label)}><span>{label}</span><strong>{loading ? "…" : count}</strong></div>)}</div><div className="admin-panel"><div className="panel-heading"><h2 className="display">Recent content</h2><button type="button" className="text-button" onClick={() => void load()} disabled={loading}>Retry / Refresh</button></div><ContentTable rows={rows.slice(0, 8)} role={role} onRefresh={load} embedded/></div></>;
}
