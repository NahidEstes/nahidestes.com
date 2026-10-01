"use client";

import type { ContentPagination as PaginationData } from "@/types/content";

export function ContentPagination({ pagination, onPage, onLimit }: { pagination: PaginationData; onPage: (page: number) => void; onLimit: (limit: number) => void }) {
  const first = pagination.totalItems ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const last = Math.min(pagination.page * pagination.limit, pagination.totalItems);
  return <div className="content-pagination"><span>Showing {first}–{last} of {pagination.totalItems}</span><label>Rows <select value={pagination.limit} onChange={(event) => onLimit(Number(event.target.value))}><option>10</option><option>20</option><option>50</option><option>100</option></select></label><div><button type="button" disabled={!pagination.hasPreviousPage} onClick={() => onPage(pagination.page - 1)}>← Previous</button><span>Page {pagination.page} of {pagination.totalPages}</span><button type="button" disabled={!pagination.hasNextPage} onClick={() => onPage(pagination.page + 1)}>Next →</button></div></div>;
}
