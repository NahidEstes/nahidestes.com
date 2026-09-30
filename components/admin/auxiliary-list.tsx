"use client";

import { useCallback, useEffect, useState } from "react";
import { apiRequest, type AdminRow } from "./admin-types";
import { ContentTable } from "./content-table";
import { useToast } from "./toast-provider";

export function AuxiliaryList({ section }: { section: "subscribers" | "messages" }) {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const load = useCallback(async () => {
    const result = await apiRequest<Record<string, unknown>[]>(`/api/admin/${section}`);
    if (result.ok) setRows(result.data as unknown as AdminRow[]);
    else notify(result.error.message, "error");
  }, [notify, section]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return <><div className="admin-top"><h1>{section === "messages" ? "Messages" : "Subscribers"}</h1></div><ContentTable section={section} rows={rows} role="admin" onRefresh={load}/></>;
}
