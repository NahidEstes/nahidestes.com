"use client";

import Image from "next/image";
import Link from "next/link";
import { Copy, Edit3, Eye, MoreHorizontal, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { contentLabels, publicBases, type AdminRole } from "../admin-types";
import type { AdminContentRow, ContentCollection } from "@/types/content";

function when(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function Actions({ row, collection, role, trash, onQuickEdit, onDuplicate, onRemove }: {
  row: AdminContentRow; collection: ContentCollection; role: AdminRole; trash: boolean;
  onQuickEdit: () => void; onDuplicate: () => void; onRemove: (action: "trash" | "restore" | "delete") => void;
}) {
  if (trash) return <div className="row-actions">{role === "admin" && <><button type="button" onClick={() => onRemove("restore")}><RotateCcw size={14}/> Restore</button><button type="button" className="danger-link" onClick={() => onRemove("delete")}><Trash2 size={14}/> Delete forever</button></>}</div>;
  const viewHref = row.status === "published" ? `${publicBases[collection]}/${row.slug}` : `/admin/preview/${collection}/${row._id}`;
  const canEdit = role === "admin" || row.status === "draft";
  return <div className="row-actions">{canEdit && <><Link href={`/admin/${collection}/${row._id}/edit`}><Edit3 size={14}/> Edit</Link><button type="button" onClick={onQuickEdit}><PencilLine size={14}/> Quick edit</button></>}<Link href={viewHref} target="_blank" aria-label={`${row.status === "published" ? "View" : "Preview"} ${row.title} in a new tab`}><Eye size={14}/> {row.status === "published" ? "View" : "Preview"} ↗</Link><button type="button" onClick={onDuplicate}><Copy size={14}/> Duplicate</button>{role === "admin" && <button type="button" className="danger-link" onClick={() => onRemove("trash")}><Trash2 size={14}/> Trash</button>}</div>;
}

export function ContentRow({ row, collection, role, trash, selected, onSelect, onQuickEdit, onDuplicate, onRemove }: {
  row: AdminContentRow; collection: ContentCollection; role: AdminRole; trash: boolean; selected: boolean;
  onSelect: (checked: boolean) => void; onQuickEdit: () => void; onDuplicate: () => void; onRemove: (action: "trash" | "restore" | "delete") => void;
}) {
  return <>
    <tr className={selected ? "selected" : ""}>
      <td><input type="checkbox" aria-label={`Select ${row.title}`} checked={selected} onChange={(event) => onSelect(event.target.checked)}/></td>
      <td><div className="content-title-cell">{row.featuredImage ? <Image src={row.featuredImage} alt="" width={72} height={48} unoptimized/> : <span className="thumb-placeholder"/>}<div><strong>{row.title}</strong><small>/{row.slug}</small><small>{contentLabels[collection]} · ID {row._id.slice(-6)}</small></div></div></td>
      <td><span className={`status status-${row.status}`}>{row.status}</span>{row.isFeatured && <span className="featured-pill">Featured</span>}</td>
      <td>{row.category || "—"}<small className="tag-summary">{row.tags?.slice(0, 3).join(", ")}</small></td>
      {collection === "projects" && <td>{row.year || "—"}<small className="tag-summary">{row.technologies?.slice(0, 2).join(", ")}</small></td>}
      {collection === "photography" && <td>{row.location || "—"}<small className="tag-summary">{when(row.capturedAt)}</small></td>}
      {collection === "places" && <td>{row.country || "—"}<small className="tag-summary">{row.location || ""}</small></td>}
      {collection === "posts" && <td>{row.authorName || "—"}</td>}
      <td>{row.status === "scheduled" ? when(row.scheduledAt) : when(row.publishedAt)}</td>
      <td>{trash ? when(row.deletedAt) : when(row.updatedAt)}</td>
      <td className="desktop-actions"><Actions {...{ row, collection, role, trash, onQuickEdit, onDuplicate, onRemove }}/></td>
      <td className="mobile-actions"><details><summary aria-label={`Actions for ${row.title}`}><MoreHorizontal size={18}/></summary><Actions {...{ row, collection, role, trash, onQuickEdit, onDuplicate, onRemove }}/></details></td>
    </tr>
    <tr className="content-mobile-card"><td colSpan={9}><div className="mobile-card-head"><input type="checkbox" aria-label={`Select ${row.title}`} checked={selected} onChange={(event) => onSelect(event.target.checked)}/>{row.featuredImage && <Image src={row.featuredImage} alt="" width={80} height={54} unoptimized/>}<div><strong>{row.title}</strong><small>{contentLabels[collection]} · {row.category || "Uncategorized"} · ID {row._id.slice(-6)}</small></div></div><div className="mobile-card-meta"><span className={`status status-${row.status}`}>{row.status}</span><span>{row.status === "scheduled" ? when(row.scheduledAt) : when(row.publishedAt)}</span><span>Updated {trash ? when(row.deletedAt) : when(row.updatedAt)}</span></div><details className="mobile-action-menu"><summary><MoreHorizontal size={18}/> Actions</summary><Actions {...{ row, collection, role, trash, onQuickEdit, onDuplicate, onRemove }}/></details></td></tr>
  </>;
}
