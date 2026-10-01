"use client";

import { Search, X } from "lucide-react";
import type { ContentCollection, ContentFilterOptions, ContentListStatus, ContentStatusCounts } from "@/types/content";

export type FilterValues = {
  q: string; status: ContentListStatus; category: string; tag: string; featured: string;
  dateFrom: string; dateTo: string; dateField: string; sort: string; direction: string; country: string;
  location: string; technology: string; year: string; author: string;
};

const emptyValues: FilterValues = { q: "", status: "all", category: "", tag: "", featured: "", dateFrom: "", dateTo: "", dateField: "", sort: "updatedAt", direction: "desc", country: "", location: "", technology: "", year: "", author: "" };
export { emptyValues };

export function ContentFilters({ collection, values, options, counts, lockedStatus, onChange, onReset }: {
  collection: ContentCollection;
  values: FilterValues;
  options: ContentFilterOptions;
  counts: ContentStatusCounts;
  lockedStatus?: ContentListStatus;
  onChange: (key: keyof FilterValues, value: string, immediate?: boolean) => void;
  onReset: () => void;
}) {
  const statuses: Array<[ContentListStatus, string, number]> = [["all", "All", counts.all], ["published", "Published", counts.published], ["draft", "Drafts", counts.draft], ["scheduled", "Scheduled", counts.scheduled]];
  return <div className="content-filters">
    {!lockedStatus && <div className="content-status-tabs" role="list" aria-label="Content status">{statuses.map(([status, label, count]) => <button type="button" key={status} className={values.status === status ? "active" : ""} onClick={() => onChange("status", status, true)}>{label} <span>{count}</span></button>)}</div>}
    <div className="content-filter-grid">
      <label className="content-search"><span className="sr-only">Search content</span><Search size={16}/><input value={values.q} onChange={(event) => onChange("q", event.target.value)} placeholder="Search title, slug, excerpt…"/><button type="button" aria-label="Clear search" onClick={() => onChange("q", "", true)} disabled={!values.q}><X size={14}/></button></label>
      <select aria-label="Category" value={values.category} onChange={(event) => onChange("category", event.target.value, true)}><option value="">All categories</option>{options.categories.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Tag" value={values.tag} onChange={(event) => onChange("tag", event.target.value, true)}><option value="">All tags</option>{options.tags.map((value) => <option key={value}>{value}</option>)}</select>
      <select aria-label="Featured status" value={values.featured} onChange={(event) => onChange("featured", event.target.value, true)}><option value="">Featured: any</option><option value="true">Featured</option><option value="false">Not featured</option></select>
      {collection === "places" && <select aria-label="Country" value={values.country} onChange={(event) => onChange("country", event.target.value, true)}><option value="">All countries</option>{options.countries?.map((value) => <option key={value}>{value}</option>)}</select>}
      {(collection === "places" || collection === "photography") && <select aria-label="Location" value={values.location} onChange={(event) => onChange("location", event.target.value, true)}><option value="">All locations</option>{options.locations?.map((value) => <option key={value}>{value}</option>)}</select>}
      {collection === "projects" && <select aria-label="Technology" value={values.technology} onChange={(event) => onChange("technology", event.target.value, true)}><option value="">All technologies</option>{options.technologies?.map((value) => <option key={value}>{value}</option>)}</select>}
      {collection === "projects" && <select aria-label="Year" value={values.year} onChange={(event) => onChange("year", event.target.value, true)}><option value="">All years</option>{options.years?.map((value) => <option key={value}>{value}</option>)}</select>}
      {(collection === "posts" || collection === "places") && <select aria-label="Author" value={values.author} onChange={(event) => onChange("author", event.target.value, true)}><option value="">All authors</option>{options.authors?.map((value) => <option key={value}>{value}</option>)}</select>}
      <select aria-label="Date field" value={values.dateField} onChange={(event) => onChange("dateField", event.target.value, true)}><option value="">Relevant date</option><option value="publishedAt">Published date</option><option value="scheduledAt">Scheduled date</option><option value="updatedAt">Last updated</option>{collection === "photography" && <option value="capturedAt">Captured date</option>}</select>
      <label className="compact-field">From<input type="date" value={values.dateFrom} onChange={(event) => onChange("dateFrom", event.target.value, true)}/></label>
      <label className="compact-field">To<input type="date" value={values.dateTo} onChange={(event) => onChange("dateTo", event.target.value, true)}/></label>
      <select aria-label="Sort field" value={values.sort} onChange={(event) => onChange("sort", event.target.value, true)}><option value="updatedAt">Last updated</option><option value="publishedAt">Published date</option><option value="scheduledAt">Scheduled date</option>{collection === "photography" && <option value="capturedAt">Captured date</option>}<option value="title">Title</option><option value="status">Status</option><option value="isFeatured">Featured</option>{collection === "projects" && <><option value="order">Order</option><option value="year">Year</option></>}</select>
      <select aria-label="Sort direction" value={values.direction} onChange={(event) => onChange("direction", event.target.value, true)}><option value="desc">Descending</option><option value="asc">Ascending</option></select>
      <button type="button" className="filter-reset" onClick={onReset}>Reset filters</button>
    </div>
  </div>;
}
