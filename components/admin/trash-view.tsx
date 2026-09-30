"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, editableCollections, type AdminRow } from "./admin-types";
import { ContentTable } from "./content-table";
import { useToast } from "./toast-provider";

export function TrashView() {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const load = useCallback(async () => {
    const results = await Promise.all(editableCollections.map((collection) => apiRequest<AdminRow[]>(`/api/admin/${collection}?trash=true`)));
    const error = results.find((result) => !result.ok);
    if (error && !error.ok) notify(error.error.message, "error");
    setRows(results.flatMap((result) => result.ok ? result.data : []));
  }, [notify]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return <><div className="admin-top"><div><h1>Trash</h1><p className="admin-subtitle">Restore content or permanently delete it. Permanent deletion requires typing the item title.</p></div></div><ContentTable rows={rows} role="admin" trash onRefresh={load}/></>;
}
