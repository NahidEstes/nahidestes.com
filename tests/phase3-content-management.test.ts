import assert from "node:assert/strict";
import test from "node:test";
import { buildContentFilter, buildContentSort, parseContentQuery } from "../lib/admin/content-query";
import { contentBulkSchema } from "../lib/validation";

test("content list query applies safe defaults and bounded pagination", () => {
  const result = parseContentQuery(new URLSearchParams());
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual({ page: result.data.page, limit: result.data.limit, status: result.data.status, sort: result.data.sort, direction: result.data.direction }, { page: 1, limit: 20, status: "all", sort: "updatedAt", direction: "desc" });
  assert.equal(parseContentQuery(new URLSearchParams("limit=101")).ok, false);
  assert.equal(parseContentQuery(new URLSearchParams("page=0")).ok, false);
});

test("content list query rejects invalid and reversed dates", () => {
  assert.equal(parseContentQuery(new URLSearchParams("dateFrom=2026-13-40")).ok, false);
  assert.equal(parseContentQuery(new URLSearchParams("dateFrom=2026-10-02&dateTo=2026-10-01")).ok, false);
  assert.equal(parseContentQuery(new URLSearchParams("status=deleted")).ok, false);
});

test("search text is escaped before it reaches a MongoDB regex", () => {
  const result = parseContentQuery(new URLSearchParams("q=%24where%3A.*&status=draft&featured=true"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const filter = buildContentFilter("posts", result.data);
  assert.equal(filter.status, "draft");
  assert.equal(filter.isFeatured, true);
  const expression = (filter.$or as Array<Record<string, { $regex: string }>>)[0].title.$regex;
  assert.equal(expression, "\\$where:\\.\\*");
});

test("collection-specific filters cannot target unapproved fields", () => {
  const result = parseContentQuery(new URLSearchParams("country=Türkiye&technology=Next.js&year=2026"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  const postFilter = buildContentFilter("posts", result.data);
  assert.equal("country" in postFilter, false);
  assert.equal("technologies" in postFilter, false);
  assert.equal("year" in postFilter, false);
  const projectFilter = buildContentFilter("projects", result.data);
  assert.equal(projectFilter.technologies, "Next.js");
  assert.equal(projectFilter.year, 2026);
});

test("sort fields and directions are allowlisted", () => {
  assert.equal(parseContentQuery(new URLSearchParams("sort=%24where")).ok, false);
  const result = parseContentQuery(new URLSearchParams("sort=title&direction=asc"));
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(buildContentSort(result.data), { title: 1, _id: 1 });
});

test("bulk requests enforce strict action payloads and ID limits", () => {
  const id = "507f1f77bcf86cd799439011";
  assert.equal(contentBulkSchema.safeParse({ action: "publish", ids: [id] }).success, true);
  assert.equal(contentBulkSchema.safeParse({ action: "publish", ids: ["bad-id"] }).success, false);
  assert.equal(contentBulkSchema.safeParse({ action: "schedule", ids: [id] }).success, false);
  assert.equal(contentBulkSchema.safeParse({ action: "deleteEverything", ids: [id] }).success, false);
  assert.equal(contentBulkSchema.safeParse({ action: "draft", ids: Array.from({ length: 101 }, () => id) }).success, false);
});
