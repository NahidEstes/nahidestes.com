"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type AdminRow } from "./admin-types";
import { ContentTable } from "./content-table";
import { useToast } from "./toast-provider";

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function CategoryPanel() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const result = await apiRequest<Record<string, unknown>[]>("/api/admin/categories");
    if (result.ok) setRows(result.data as unknown as AdminRow[]);
    else notify(result.error.message, "error");
  }, [notify]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return <><div className="admin-top"><h1>Categories</h1></div><form className="admin-panel" onSubmit={async (event) => { event.preventDefault(); setBusy(true); const form = new FormData(event.currentTarget); const name = String(form.get("name") || ""); const result = await apiRequest("/api/admin/categories", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, slug: slugify(name), type: form.get("type") }) }); setBusy(false); if (!result.ok) { notify(result.error.message, "error"); return; } notify("Category added."); event.currentTarget.reset(); await load(); }}><div className="field-grid"><div className="field"><label>Category name</label><input name="name" required/></div><div className="field"><label>Content type</label><select name="type"><option value="post">Journal</option><option value="project">Project</option><option value="photography">Photography</option><option value="place">Place story</option></select></div></div><button className="button dark" disabled={busy}>{busy ? "Adding…" : "Add Category →"}</button></form><ContentTable section="categories" rows={rows} role="admin" onRefresh={load}/></>;
}
