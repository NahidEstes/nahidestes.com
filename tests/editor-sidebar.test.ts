import assert from "node:assert/strict";
import test from "node:test";
import { hasCustomAuthor, normalizeEditorFieldErrors, settingsPanelForField, toLocalDateTimeInput } from "../lib/admin/editor-settings";
import { postPatchSchema, placePatchSchema } from "../lib/validation";

test("legacy partial author overrides enable customization without mutating their values", () => {
  const legacy = { authorName: "", authorBio: "A legacy biography", authorImage: "" };
  const before = structuredClone(legacy);
  assert.equal(hasCustomAuthor(legacy), true);
  assert.deepEqual(legacy, before);
  assert.equal(hasCustomAuthor({ authorName: "  ", authorImage: "", authorImageDecorative: false }), false);
});

test("loading and resaving a schedule preserves its instant in the local timezone", () => {
  const scheduled = new Date(2026, 9, 8, 10, 30);
  const input = toLocalDateTimeInput(scheduled.toISOString());
  assert.equal(input, "2026-10-08T10:30");
  assert.equal(new Date(input).toISOString(), scheduled.toISOString());
  assert.equal(toLocalDateTimeInput("bad date"), "");
});

test("image metadata errors reveal the corresponding settings panel", () => {
  assert.equal(settingsPanelForField("featuredImageWidth"), "featured");
  assert.equal(settingsPanelForField("imageAlt"), "featured");
  assert.equal(settingsPanelForField("ogImageHeight"), "seo");
  assert.equal(settingsPanelForField("authorImageCaption"), "author");
  assert.equal(settingsPanelForField("readingTime"), "author");
  assert.equal(settingsPanelForField("sections.0.heading"), undefined);
});

test("indexed tag errors target the visible tags input without changing builder error paths", () => {
  const errors = { "tags.0": ["Tag is too long"], "tags.1": ["Tag is empty"], "sections.0.heading": ["Heading required"] };
  assert.deepEqual(normalizeEditorFieldErrors(errors), { tags: ["Tag is too long", "Tag is empty"], "sections.0.heading": ["Heading required"] });
  assert.equal(errors["tags.0"][0], "Tag is too long");
});

test("both article APIs accept explicit fallback resets and keep positive reading-time validation", () => {
  for (const schema of [postPatchSchema, placePatchSchema]) {
    const cleared = schema.parse({ authorName: "", authorTitle: "", authorBio: "", authorImage: "", ogImage: "", readingTime: null });
    assert.equal(cleared.authorName, "");
    assert.equal(cleared.authorImage, "");
    assert.equal(cleared.ogImage, "");
    assert.equal(cleared.readingTime, null);
    assert.equal(schema.safeParse({ readingTime: -1 }).success, false);
    assert.equal(schema.safeParse({ readingTime: 0 }).success, false);
    assert.equal(schema.parse({ readingTime: 7 }).readingTime, 7);
  }
});
