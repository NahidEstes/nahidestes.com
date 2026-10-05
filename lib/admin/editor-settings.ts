export type EditorSettingsPanel = "featured" | "taxonomy" | "seo" | "author" | "discussion";

export function toLocalDateTimeInput(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export const authorOverrideFields = ["authorName", "authorTitle", "authorBio", "authorImage", "authorImageAlt", "authorImageCaption", "authorImageWidth", "authorImageHeight", "authorImageDecorative"] as const;

export function hasCustomAuthor(values: Record<string, unknown>) {
  return authorOverrideFields.some((field) => typeof values[field] === "boolean" ? values[field] : Boolean(String(values[field] ?? "").trim()));
}

export function settingsPanelForField(field: string): EditorSettingsPanel | undefined {
  if (field === "featuredImage" || field === "imageAlt" || field.startsWith("featuredImage")) return "featured";
  if (field === "category" || field.startsWith("tags")) return "taxonomy";
  if (field.startsWith("seo") || field.startsWith("ogImage")) return "seo";
  if (field.startsWith("author") || field === "readingTime") return "author";
  if (field === "commentsEnabled") return "discussion";
}

export function normalizeEditorFieldErrors(errors: Record<string, string[]>) {
  return Object.entries(errors).reduce<Record<string, string[]>>((result, [field, messages]) => {
    // Tags use a single comma-separated input even though the API validates an array.
    const input = /^tags\.\d+$/.test(field) ? "tags" : field;
    result[input] = [...(result[input] || []), ...messages];
    return result;
  }, {});
}
