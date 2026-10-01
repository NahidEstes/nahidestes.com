"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ContentManager } from "./content-list/content-manager";
import { editableCollections } from "./admin-types";
import type { ContentCollection } from "@/types/content";

export function TrashView() {
  const params = useSearchParams();
  const requested = params.get("collection") as ContentCollection | null;
  const collection = requested && editableCollections.includes(requested) ? requested : "posts";
  const labels: Record<ContentCollection, string> = { posts: "Posts", projects: "Projects", photography: "Photography", places: "Places & Culture" };
  return <><div className="admin-top"><div><div className="eyebrow">Recovery</div><h1>Trash</h1><p className="admin-subtitle">Restore content or permanently delete it. Permanent deletion requires confirmation.</p></div></div><nav className="collection-tabs" aria-label="Trash content type">{editableCollections.map((item) => <Link key={item} className={collection === item ? "active" : ""} href={`/admin/trash?collection=${item}`}>{labels[item]}</Link>)}</nav><ContentManager collection={collection} role="admin" lockedStatus="trash" compactHeading/></>;
}
