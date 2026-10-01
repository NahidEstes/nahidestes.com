"use client";

import { ContentRow } from "./content-row";
import type { AdminRole } from "../admin-types";
import type { AdminContentRow, ContentCollection } from "@/types/content";

export function ContentListTable({ rows, collection, role, trash, selected, sort, direction, dateSort, onSort, onSelect, onSelectAll, onQuickEdit, onDuplicate, onRemove }: {
  rows: AdminContentRow[]; collection: ContentCollection; role: AdminRole; trash: boolean; selected: Set<string>;
  sort: string; direction: string; dateSort: "publishedAt" | "scheduledAt"; onSort: (field: string) => void;
  onSelect: (id: string, checked: boolean) => void; onSelectAll: (checked: boolean) => void;
  onQuickEdit: (row: AdminContentRow) => void; onDuplicate: (row: AdminContentRow) => void;
  onRemove: (row: AdminContentRow, action: "trash" | "restore" | "delete") => void;
}) {
  const allSelected = rows.length > 0 && rows.every((row) => selected.has(row._id));
  const heading = (field: string, label: string) => <button type="button" className="sort-heading" onClick={() => onSort(field)} aria-label={`Sort by ${label}${sort === field ? `, currently ${direction}ending` : ""}`}>{label}{sort === field ? (direction === "asc" ? " ↑" : " ↓") : ""}</button>;
  return <div className="content-table-wrap"><table className="content-list-table"><thead><tr><th><input type="checkbox" aria-label="Select all rows on this page" checked={allSelected} onChange={(event) => onSelectAll(event.target.checked)}/></th><th>{heading("title", "Title")}</th><th>{heading("status", "Status")}</th><th>Category & tags</th>{collection === "projects" && <th>{heading("year", "Year")} & technology</th>}{collection === "photography" && <th>Location & captured</th>}{collection === "places" && <th>Country & location</th>}{collection === "posts" && <th>Author</th>}<th>{heading(dateSort, "Publish / schedule")}</th><th>{heading("updatedAt", trash ? "Deleted" : "Last updated")}</th><th>Actions</th><th className="mobile-actions">Menu</th></tr></thead><tbody>{rows.map((row) => <ContentRow key={row._id} {...{ row, collection, role, trash }} selected={selected.has(row._id)} onSelect={(checked) => onSelect(row._id, checked)} onQuickEdit={() => onQuickEdit(row)} onDuplicate={() => onDuplicate(row)} onRemove={(action) => onRemove(row, action)}/>)}</tbody></table></div>;
}
