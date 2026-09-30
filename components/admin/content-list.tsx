"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ContentCollection } from "@/types/content";
import { apiRequest, contentLabels, type AdminRole, type AdminRow } from "./admin-types";
import { ContentTable } from "./content-table";
import { useToast } from "./toast-provider";

export function ContentList({ collection, role }: { collection: ContentCollection; role: AdminRole }) {
  const { notify } = useToast();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const load = useCallback(async () => {
    const result = await apiRequest<AdminRow[]>(`/api/admin/${collection}`);
    if (result.ok) setRows(result.data);
    else notify(result.error.message, "error");
  }, [collection, notify]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  return <><div className="admin-top"><h1>{collection === "places" ? "Places & Culture" : collection === "photography" ? "Photography" : `${contentLabels[collection]}s`}</h1><Link className="button dark" href={`/admin/${collection}/new`}>New {contentLabels[collection]} →</Link></div><ContentTable section={collection} rows={rows} role={role} onRefresh={load}/></>;
}
