"use client";

import { useState } from "react";
import type { AdminRole } from "../admin-types";
import type { ContentBulkAction } from "@/types/content";

export function BulkActionBar({ selected, role, trash, categories, onApply, onClear, busy }: {
  selected: number; role: AdminRole; trash: boolean; categories: string[]; busy: boolean;
  onApply: (action: ContentBulkAction, extra?: Record<string, unknown>) => void; onClear: () => void;
}) {
  const [action, setAction] = useState<ContentBulkAction>(trash ? "restore" : "draft");
  const [value, setValue] = useState("");
  if (!selected) return null;
  const options: Array<[ContentBulkAction, string]> = trash ? [["restore", "Restore"], ["delete", "Delete permanently"]] : [
    ...(role === "admin" ? [["publish", "Publish now"], ["schedule", "Schedule"], ["trash", "Move to Trash"]] as Array<[ContentBulkAction, string]> : []),
    ["draft", "Set as draft"], ["feature", "Mark featured"], ["unfeature", "Remove featured"], ["category", "Change category"], ["addTags", "Add tags"], ["removeTags", "Remove tags"],
  ];
  const needsValue = action === "schedule" || action === "category" || action === "addTags" || action === "removeTags";
  const submit = () => {
    if (action === "schedule") onApply(action, { scheduledAt: new Date(value).toISOString() });
    else if (action === "category") onApply(action, { category: value });
    else if (action === "addTags" || action === "removeTags") onApply(action, { tags: value.split(",").map((item) => item.trim()).filter(Boolean) });
    else onApply(action);
  };
  return <div className="bulk-action-bar" role="region" aria-label="Bulk actions"><strong>{selected} selected</strong><select value={action} onChange={(event) => { setAction(event.target.value as ContentBulkAction); setValue(""); }}>{options.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>{action === "schedule" && <input type="datetime-local" aria-label="Schedule date and time" value={value} onChange={(event) => setValue(event.target.value)}/>} {action === "category" && <><input list="bulk-categories" placeholder="Category" value={value} onChange={(event) => setValue(event.target.value)}/><datalist id="bulk-categories">{categories.map((category) => <option key={category} value={category}/>)}</datalist></>}{(action === "addTags" || action === "removeTags") && <input placeholder="Comma-separated tags" value={value} onChange={(event) => setValue(event.target.value)}/>}<button type="button" className="button dark" disabled={busy || (needsValue && !value)} onClick={submit}>{busy ? "Applying…" : "Apply"}</button><button type="button" onClick={onClear} disabled={busy}>Clear</button></div>;
}
