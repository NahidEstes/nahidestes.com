"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BulkActionBar } from "./bulk-action-bar";
import { ContentFilters, emptyValues, type FilterValues } from "./content-filters";
import { ContentPagination } from "./content-pagination";
import { ContentListTable } from "./content-table";
import { QuickEditPanel } from "./quick-edit-panel";
import { ConfirmationDialog } from "../confirmation-dialog";
import { apiRequest, contentLabels, type AdminRole } from "../admin-types";
import { useToast } from "../toast-provider";
import type { AdminContentRow, ContentBulkAction, ContentBulkResult, ContentCollection, ContentListStatus, PaginatedContentResponse } from "@/types/content";

const emptyResponse: PaginatedContentResponse = { items: [], pagination: { page: 1, limit: 20, total: 0, totalItems: 0, totalPages: 1, hasPreviousPage: false, hasNextPage: false }, statusCounts: { all: 0, published: 0, draft: 0, scheduled: 0, trash: 0, featured: 0 }, filterOptions: { categories: [], tags: [] } };

function valuesFrom(params: URLSearchParams, lockedStatus?: ContentListStatus): FilterValues {
  return { ...emptyValues, ...Object.fromEntries((Object.keys(emptyValues) as Array<keyof FilterValues>).map((key) => [key, params.get(key) || emptyValues[key]])), ...(lockedStatus ? { status: lockedStatus } : {}) } as FilterValues;
}

type Pending = { action: ContentBulkAction; ids: string[]; extra?: Record<string, unknown>; title?: string } | null;

export function ContentManager({ collection, role, lockedStatus, compactHeading = false }: { collection: ContentCollection; role: AdminRole; lockedStatus?: ContentListStatus; compactHeading?: boolean }) {
  const { notify } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();
  const values = useMemo(() => valuesFrom(new URLSearchParams(queryKey), lockedStatus), [queryKey, lockedStatus]);
  const [searchDraft, setSearchDraft] = useState(values.q);
  const [data, setData] = useState(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [quickEdit, setQuickEdit] = useState<AdminContentRow | null>(null);
  const [quickErrors, setQuickErrors] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<Pending>(null);
  const [duplicate, setDuplicate] = useState<AdminContentRow | null>(null);

  const replaceParams = useCallback((updates: Record<string, string | number | null>, resetPage = true) => {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "all" || (key === "sort" && value === "updatedAt") || (key === "direction" && value === "desc")) next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage && !("page" in updates)) next.delete("page");
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }, [pathname, router, searchParams]);

  // Keep the debounced input synchronized with browser back/forward navigation.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSearchDraft(values.q); }, [values.q]);
  useEffect(() => {
    if (searchDraft === values.q) return;
    const timer = window.setTimeout(() => replaceParams({ q: searchDraft }), 400);
    return () => window.clearTimeout(timer);
  }, [searchDraft, values.q, replaceParams]);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("collection");
    if (lockedStatus) params.set("status", lockedStatus);
    const result = await apiRequest<PaginatedContentResponse>(`/api/admin/${collection}?${params}`);
    if (result.ok) {
      if (result.data.pagination.page > result.data.pagination.totalPages) {
        const next = new URLSearchParams(searchParams.toString());
        if (result.data.pagination.totalPages <= 1) next.delete("page"); else next.set("page", String(result.data.pagination.totalPages));
        router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
      } else { setData(result.data); setSelected(new Set()); }
    }
    else { setError(result.error.message); notify(result.error.message, "error"); }
    setLoading(false);
  }, [collection, lockedStatus, notify, pathname, router, searchParams]);
  // The callback performs the initial remote data synchronization.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  const onFilter = (key: keyof FilterValues, value: string) => {
    if (key === "q") { setSearchDraft(value); return; }
    replaceParams({ [key]: value });
  };
  const resetFilters = () => {
    const next = new URLSearchParams();
    const collectionParam = searchParams.get("collection");
    if (collectionParam) next.set("collection", collectionParam);
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    setSearchDraft("");
  };

  const executeBulk = async (action: ContentBulkAction, ids: string[], extra?: Record<string, unknown>) => {
    setBusy(true);
    const result = await apiRequest<ContentBulkResult>(`/api/admin/${collection}/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ids, ...extra }) });
    setBusy(false);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    const message = result.data.failed.length ? `${result.data.affected} updated; ${result.data.failed.length} failed.` : `${result.data.affected} item${result.data.affected === 1 ? "" : "s"} updated.`;
    notify(message, result.data.failed.length ? "error" : "success");
    setPending(null); setSelected(new Set()); await load();
  };
  const requestBulk = (action: ContentBulkAction, extra?: Record<string, unknown>) => {
    const ids = [...selected];
    if (["trash", "delete"].includes(action)) setPending({ action, ids, extra });
    else void executeBulk(action, ids, extra);
  };
  const rowRemove = (row: AdminContentRow, action: "trash" | "restore" | "delete") => {
    if (action === "restore") void executeBulk(action, [row._id]);
    else setPending({ action, ids: [row._id], title: row.title });
  };
  const duplicateRow = async (row: AdminContentRow) => {
    setBusy(true);
    const result = await apiRequest<AdminContentRow>(`/api/admin/${collection}/${row._id}/duplicate`, { method: "POST" });
    setBusy(false);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    setDuplicate(result.data); notify("Draft duplicate created."); await load();
  };
  const saveQuickEdit = async (payload: Record<string, unknown>) => {
    if (!quickEdit) return;
    setBusy(true);
    const result = await apiRequest<Record<string, unknown>>(`/api/admin/${collection}/${quickEdit._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setBusy(false);
    if (!result.ok) { setQuickErrors(result.error.fieldErrors || { form: [result.error.message] }); notify(result.error.message, "error"); return; }
    notify("Quick edit saved."); setQuickErrors({}); setQuickEdit(null); await load();
  };
  const trash = lockedStatus === "trash";
  const hasActiveFilters = (Object.keys(emptyValues) as Array<keyof FilterValues>).some((key) => key !== "status" && values[key] !== emptyValues[key]) || (!lockedStatus && values.status !== "all");
  const emptyNames: Record<ContentCollection, string> = { posts: "posts", projects: "projects", photography: "photography galleries", places: "place stories" };
  const affectedType = pending?.ids.length === 1 ? contentLabels[collection] : emptyNames[collection];
  return <>
    {!compactHeading && <div className="admin-top"><div><div className="eyebrow">Content management</div><h1>{collection === "places" ? "Places & Culture" : collection === "photography" ? "Photography" : `${contentLabels[collection]}s`}</h1><p className="admin-subtitle">Search, filter, edit and organize your content.</p></div><Link className="button dark" href={`/admin/${collection}/new`}>New {contentLabels[collection]} →</Link></div>}
    {duplicate && <div className="admin-inline-notice">Duplicate “{duplicate.title}” was created as a draft. <Link href={`/admin/${collection}/${duplicate._id}/edit`}>Edit duplicate →</Link><button type="button" onClick={() => setDuplicate(null)}>Dismiss</button></div>}
    <div className="admin-panel content-manager">
      <ContentFilters collection={collection} values={{ ...values, q: searchDraft }} options={data.filterOptions} counts={data.statusCounts} lockedStatus={lockedStatus} onChange={onFilter} onReset={resetFilters}/>
      <BulkActionBar selected={selected.size} role={role} trash={trash} categories={data.filterOptions.categories} onApply={requestBulk} onClear={() => setSelected(new Set())} busy={busy}/>
      {loading ? <div className="content-loading" aria-label="Loading content"><span/><span/><span/><span/></div> : error ? <div className="content-state error"><h2>Content could not be loaded</h2><p>{error}</p><button type="button" className="button" onClick={() => void load()}>Retry</button></div> : data.items.length ? <><ContentListTable rows={data.items} collection={collection} role={role} trash={trash} selected={selected} sort={values.sort} direction={values.direction} dateSort={values.status === "scheduled" ? "scheduledAt" : "publishedAt"} onSort={(field) => replaceParams({ sort: field, direction: values.sort === field && values.direction === "asc" ? "desc" : "asc" })} onSelect={(id, checked) => setSelected((current) => { const next = new Set(current); if (checked) next.add(id); else next.delete(id); return next; })} onSelectAll={(checked) => setSelected(checked ? new Set(data.items.map((row) => row._id)) : new Set())} onQuickEdit={(row) => { setQuickErrors({}); setQuickEdit(row); }} onDuplicate={(row) => void duplicateRow(row)} onRemove={rowRemove}/><ContentPagination pagination={data.pagination} onPage={(page) => replaceParams({ page }, false)} onLimit={(limit) => replaceParams({ limit, page: 1 }, false)}/></> : <div className="content-state"><h2>{trash ? "Trash is empty" : hasActiveFilters ? "No results match your filters" : `No ${emptyNames[collection]} have been created yet`}</h2><p>{trash ? "Deleted content will appear here." : hasActiveFilters ? "Clear or change a filter to see more content." : "Create the first item to get started."}</p>{!trash && !hasActiveFilters && <Link className="button dark" href={`/admin/${collection}/new`}>Create {contentLabels[collection]}</Link>}</div>}
    </div>
    <QuickEditPanel key={quickEdit?._id || "closed"} row={quickEdit} collection={collection} role={role} busy={busy} errors={quickErrors} onClose={() => { setQuickErrors({}); setQuickEdit(null); }} onSave={saveQuickEdit}/>
    <ConfirmationDialog open={Boolean(pending)} title={pending?.action === "delete" ? `Permanently delete ${pending.ids.length} ${affectedType}?` : `Move ${pending?.ids.length || 0} ${affectedType} to Trash?`} description={pending?.action === "delete" ? "This cannot be undone. Associated article revision history will also be removed." : "The selected content will disappear from the public site and can be restored by an administrator."} confirmLabel={pending?.action === "delete" ? "Delete permanently" : "Move to Trash"} confirmationText={pending?.action === "delete" ? pending.title || String(pending.ids.length) : undefined} busy={busy} onClose={() => setPending(null)} onConfirm={() => pending && void executeBulk(pending.action, pending.ids, pending.extra)}/>
  </>;
}
