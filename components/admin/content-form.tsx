"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ArticleImage, ContentCollection } from "@/types/content";
import { ArticleBuilder, normalizeBuilderSections, type BuilderSection } from "./article-builder/article-builder";
import { ConfirmationDialog } from "./confirmation-dialog";
import { ImageUrlField } from "./image-url-field";
import { PublishPanel } from "./publish-panel";
import { RevisionHistory } from "./revision-history";
import { RichTextEditor } from "./rich-text-editor";
import { apiRequest, contentLabels, publicBases, type AdminRole, type ApiError } from "./admin-types";
import { useToast } from "./toast-provider";

type FormValues = {
  title: string; slug: string; excerpt: string; content: string; category: string; tags: string;
  status: "draft" | "published" | "scheduled"; publishedAt: string; scheduledAt: string; isFeatured: boolean; commentsEnabled: boolean;
  featuredImage: string; imageAlt: string; featuredImageCaption: string; featuredImageWidth: string; featuredImageHeight: string; featuredImageDecorative: boolean;
  seoTitle: string; seoDescription: string; ogImage: string; ogImageAlt: string; ogImageCaption: string; ogImageWidth: string; ogImageHeight: string; ogImageDecorative: boolean;
  readingTime: string; authorName: string; authorTitle: string; authorBio: string; authorImage: string; authorImageAlt: string; authorImageCaption: string; authorImageWidth: string; authorImageHeight: string; authorImageDecorative: boolean;
  country: string; location: string; technologies: string; projectUrl: string; repositoryUrl: string; year: string;
};

const today = () => new Date().toISOString().slice(0, 10);
const defaults: FormValues = {
  title: "", slug: "", excerpt: "", content: "<p>Begin your story…</p>", category: "", tags: "", status: "draft", publishedAt: today(), scheduledAt: "", isFeatured: false, commentsEnabled: true,
  featuredImage: "", imageAlt: "", featuredImageCaption: "", featuredImageWidth: "", featuredImageHeight: "", featuredImageDecorative: false,
  seoTitle: "", seoDescription: "", ogImage: "", ogImageAlt: "", ogImageCaption: "", ogImageWidth: "", ogImageHeight: "", ogImageDecorative: false,
  readingTime: "", authorName: "", authorTitle: "", authorBio: "", authorImage: "", authorImageAlt: "", authorImageCaption: "", authorImageWidth: "", authorImageHeight: "", authorImageDecorative: false,
  country: "", location: "", technologies: "", projectUrl: "", repositoryUrl: "", year: "",
};

const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const toDateInput = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 10) : today();
const toDateTimeInput = (value: unknown) => value ? new Date(String(value)).toISOString().slice(0, 16) : "";
const numberOrUndefined = (value: string) => value ? Number(value) : undefined;

export function ContentForm({ collection, id, role }: { collection: ContentCollection; id?: string; role: AdminRole }) {
  const router = useRouter();
  const { notify } = useToast();
  const { register, getValues, reset, setValue, watch } = useForm<FormValues>({ defaultValues: defaults });
  const [sections, setSections] = useState<BuilderSection[]>([]);
  const [gallery, setGallery] = useState<ArticleImage[]>([]);
  const [version, setVersion] = useState(0);
  const [recordId, setRecordId] = useState(id);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "dirty" | "saving" | "saved" | "error">("idle");
  const [lastSaved, setLastSaved] = useState<Date>();
  const [loaded, setLoaded] = useState(!id);
  const [trashOpen, setTrashOpen] = useState(false);
  const [revisionRefreshKey, setRevisionRefreshKey] = useState(0);
  const changeVersion = useRef(0);
  const savingRef = useRef(false);
  const status = watch("status");
  const scheduledAt = watch("scheduledAt");
  const featured = watch("isFeatured");
  const slug = watch("slug");

  const markDirty = useCallback(() => {
    if (!loaded) return;
    changeVersion.current += 1;
    setSaveState("dirty");
  }, [loaded]);

  const hydrate = useCallback((item: Record<string, unknown>) => {
    reset({
      ...defaults,
      ...item,
      commentsEnabled: item.commentsEnabled !== false,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      technologies: Array.isArray(item.technologies) ? item.technologies.join(", ") : "",
      publishedAt: toDateInput(item.publishedAt), scheduledAt: toDateTimeInput(item.scheduledAt),
      readingTime: item.readingTime ? String(item.readingTime) : "", year: item.year ? String(item.year) : "",
      featuredImageWidth: item.featuredImageWidth ? String(item.featuredImageWidth) : "", featuredImageHeight: item.featuredImageHeight ? String(item.featuredImageHeight) : "",
      authorImageWidth: item.authorImageWidth ? String(item.authorImageWidth) : "", authorImageHeight: item.authorImageHeight ? String(item.authorImageHeight) : "",
      ogImageWidth: item.ogImageWidth ? String(item.ogImageWidth) : "", ogImageHeight: item.ogImageHeight ? String(item.ogImageHeight) : "",
    } as FormValues);
    setSections(normalizeBuilderSections(item.sections));
    setGallery(Array.isArray(item.gallery) ? item.gallery as ArticleImage[] : []);
    setVersion(Number(item.version || 0));
    changeVersion.current = 0;
    setSaveState("idle");
    setLoaded(true);
  }, [reset]);

  const load = useCallback(async () => {
    if (!recordId) return;
    setLoaded(false);
    const result = await apiRequest<Record<string, unknown>>(`/api/admin/${collection}/${recordId}`);
    if (!result.ok) { notify(result.error.message, "error"); setLoaded(true); return; }
    hydrate(result.data);
  }, [collection, hydrate, notify, recordId]);
  useEffect(() => { if (recordId) void load(); }, [load, recordId]);
  useEffect(() => {
    // React Hook Form owns the subscription and returns its cleanup handle.
    // eslint-disable-next-line react-hooks/incompatible-library
    const subscription = watch(() => markDirty());
    return () => subscription.unsubscribe();
  }, [markDirty, watch]);
  useEffect(() => {
    const beforeUnload = (event: BeforeUnloadEvent) => { if (saveState === "dirty" || saveState === "error") event.preventDefault(); };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [saveState]);

  const validateClient = useCallback((values: FormValues) => {
    const errors: Record<string, string[]> = {};
    if (values.title.trim().length < 2) errors.title = ["Title must be at least 2 characters."];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug)) errors.slug = ["Use lowercase letters, numbers, and hyphens only."];
    if (values.excerpt.trim().length < 10) errors.excerpt = ["Excerpt must be at least 10 characters."];
    if (!/^https:\/\//i.test(values.featuredImage)) errors.featuredImage = ["Enter an HTTPS image URL."];
    if (!values.featuredImageDecorative && values.imageAlt.trim().length < 3) errors.imageAlt = ["Alt text is required unless the image is decorative."];
    if (values.authorImage && !values.authorImageDecorative && values.authorImageAlt.trim().length < 3) errors.authorImageAlt = ["Alt text is required unless the image is decorative."];
    if (values.ogImage && !values.ogImageDecorative && values.ogImageAlt.trim().length < 3) errors.ogImageAlt = ["Alt text is required unless the image is decorative."];
    if (values.seoTitle.length > 70) errors.seoTitle = ["SEO title must be 70 characters or fewer."];
    if (values.seoDescription.length > 170) errors.seoDescription = ["SEO description must be 170 characters or fewer."];
    sections.forEach((section, sectionIndex) => {
      if (!section.heading.trim()) errors[`sections.${sectionIndex}.heading`] = ["Section heading is required."];
      section.blocks.forEach((block, blockIndex) => {
        if (["paragraph", "text-image", "callout"].includes(block.type) && !String(block.text || "").replace(/<[^>]+>/g, "").trim()) errors[`sections.${sectionIndex}.blocks.${blockIndex}.text`] = ["Content cannot be empty."];
        if (["ordered-list", "unordered-list"].includes(block.type) && (!Array.isArray(block.items) || !block.items.some((item) => String(item).trim()))) errors[`sections.${sectionIndex}.blocks.${blockIndex}.items`] = ["Add at least one list item."];
      });
    });
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [sections]);

  const save = useCallback(async (statusOverride?: FormValues["status"], automatic = false) => {
    if (savingRef.current || (automatic && !recordId)) return false;
    const values = getValues();
    const nextStatus = role === "editor" ? "draft" : statusOverride || values.status;
    const nextValues = { ...values, status: nextStatus };
    if (!validateClient(nextValues)) { setSaveState("error"); if (!automatic) notify("Please correct the highlighted fields.", "error"); return false; }
    const startedAtVersion = changeVersion.current;
    const payload: Record<string, unknown> = {
      title: values.title, slug: values.slug, excerpt: values.excerpt, content: values.content,
      featuredImage: values.featuredImage, imageAlt: values.imageAlt, featuredImageCaption: values.featuredImageCaption,
      featuredImageWidth: numberOrUndefined(values.featuredImageWidth), featuredImageHeight: numberOrUndefined(values.featuredImageHeight), featuredImageDecorative: values.featuredImageDecorative,
      category: values.category, tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean), status: nextStatus,
      publishedAt: new Date(values.publishedAt).toISOString(), scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
      isFeatured: values.isFeatured, seoTitle: values.seoTitle, seoDescription: values.seoDescription, ogImage: values.ogImage, ogImageAlt: values.ogImageAlt,
      ogImageCaption: values.ogImageCaption, ogImageWidth: numberOrUndefined(values.ogImageWidth), ogImageHeight: numberOrUndefined(values.ogImageHeight), ogImageDecorative: values.ogImageDecorative,
      version,
    };
    if (collection === "posts" || collection === "places") Object.assign(payload, {
      sections, gallery, commentsEnabled: values.commentsEnabled, readingTime: numberOrUndefined(values.readingTime), authorName: values.authorName, authorTitle: values.authorTitle,
      authorBio: values.authorBio, authorImage: values.authorImage, authorImageAlt: values.authorImageAlt, authorImageCaption: values.authorImageCaption,
      authorImageWidth: numberOrUndefined(values.authorImageWidth), authorImageHeight: numberOrUndefined(values.authorImageHeight), authorImageDecorative: values.authorImageDecorative,
    });
    if (collection === "places") Object.assign(payload, { country: values.country, location: values.location });
    if (collection === "projects") Object.assign(payload, { gallery, technologies: values.technologies.split(",").map((item) => item.trim()).filter(Boolean), projectUrl: values.projectUrl, repositoryUrl: values.repositoryUrl, year: numberOrUndefined(values.year) });
    if (collection === "photography") Object.assign(payload, { gallery, location: values.location });
    savingRef.current = true;
    setSaving(true);
    setSaveState("saving");
    const endpoint = recordId ? `/api/admin/${collection}/${recordId}` : `/api/admin/${collection}`;
    const result = await apiRequest<Record<string, unknown>>(endpoint, { method: recordId ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    savingRef.current = false;
    setSaving(false);
    if (!result.ok) {
      const error = result.error as ApiError;
      setFieldErrors(error.fieldErrors || {});
      setSaveState("error");
      notify(error.message, "error");
      return false;
    }
    const nextId = String(result.data._id || recordId || "");
    setVersion(Number(result.data.version || version + 1));
    setValue("status", nextStatus, { shouldDirty: false });
    setLastSaved(new Date());
    if (changeVersion.current === startedAtVersion) setSaveState("saved");
    else setSaveState("dirty");
    setFieldErrors({});
    if (recordId && (collection === "posts" || collection === "places")) {
      setRevisionRefreshKey((current) => current + 1);
    }
    if (!automatic) notify(recordId ? "Changes saved." : "Draft created.");
    if (!recordId && nextId) {
      setRecordId(nextId);
      router.replace(`/admin/${collection}/${nextId}/edit`);
    }
    return nextId || true;
  }, [collection, gallery, getValues, notify, recordId, role, router, sections, setValue, validateClient, version]);

  useEffect(() => {
    if (!recordId || saveState !== "dirty" || saving) return;
    const timer = window.setTimeout(() => { void save(undefined, true); }, 30_000);
    return () => window.clearTimeout(timer);
  }, [recordId, save, saveState, saving]);

  const featureImage: ArticleImage = { url: watch("featuredImage"), alt: watch("imageAlt"), caption: watch("featuredImageCaption"), width: numberOrUndefined(watch("featuredImageWidth")), height: numberOrUndefined(watch("featuredImageHeight")), decorative: watch("featuredImageDecorative") };
  const setFeaturedImage = (image: ArticleImage) => {
    setValue("featuredImage", image.url); setValue("imageAlt", image.alt); setValue("featuredImageCaption", image.caption || ""); setValue("featuredImageWidth", image.width ? String(image.width) : ""); setValue("featuredImageHeight", image.height ? String(image.height) : ""); setValue("featuredImageDecorative", Boolean(image.decorative)); markDirty();
  };
  const authorImage: ArticleImage = { url: watch("authorImage"), alt: watch("authorImageAlt"), caption: watch("authorImageCaption"), width: numberOrUndefined(watch("authorImageWidth")), height: numberOrUndefined(watch("authorImageHeight")), decorative: watch("authorImageDecorative") };
  const setAuthorImage = (image: ArticleImage) => { setValue("authorImage", image.url); setValue("authorImageAlt", image.alt); setValue("authorImageCaption", image.caption || ""); setValue("authorImageWidth", image.width ? String(image.width) : ""); setValue("authorImageHeight", image.height ? String(image.height) : ""); setValue("authorImageDecorative", Boolean(image.decorative)); markDirty(); };
  const ogImage: ArticleImage = { url: watch("ogImage"), alt: watch("ogImageAlt"), caption: watch("ogImageCaption"), width: numberOrUndefined(watch("ogImageWidth")), height: numberOrUndefined(watch("ogImageHeight")), decorative: watch("ogImageDecorative") };
  const setOgImage = (image: ArticleImage) => { setValue("ogImage", image.url); setValue("ogImageAlt", image.alt); setValue("ogImageCaption", image.caption || ""); setValue("ogImageWidth", image.width ? String(image.width) : ""); setValue("ogImageHeight", image.height ? String(image.height) : ""); setValue("ogImageDecorative", Boolean(image.decorative)); markDirty(); };
  const saveDraft = () => { setValue("status", "draft"); void save("draft"); };
  const publish = () => void save(status === "scheduled" ? "scheduled" : "published");
  const preview = async () => {
    let targetId = recordId;
    if (!targetId) { const created = await save("draft"); if (!created) return; targetId = typeof created === "string" ? created : undefined; }
    if (targetId) window.open(`/admin/preview/${collection}/${targetId}`, "_blank", "noopener,noreferrer");
  };
  const trash = async () => {
    if (!recordId) return;
    setSaving(true);
    const result = await apiRequest(`/api/admin/${collection}/${recordId}`, { method: "DELETE" });
    setSaving(false);
    if (!result.ok) { notify(result.error.message, "error"); return; }
    notify("Moved to Trash.");
    router.push(`/admin/${collection}`);
  };
  const onSections = (value: BuilderSection[]) => { setSections(value); markDirty(); };
  const onGallery = (value: ArticleImage[]) => { setGallery(value); markDirty(); };
  const title = `${recordId ? "Edit" : "New"} ${contentLabels[collection]}`;
  if (!loaded) return <div className="admin-panel"><p>Loading editor…</p></div>;

  return <>
    <div className="admin-top"><h1>{title}</h1><Link className="text-link" href={`/admin/${collection}`}>Back to list</Link></div>
    <form className="admin-editor-form" onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <div className="editor-main-column">
        <section className="admin-panel form-section"><h2>Story details</h2><div className="field-grid"><Field label="Title" error={fieldErrors.title}><input {...register("title")} onChange={(event) => { setValue("title", event.target.value); if (!recordId) setValue("slug", slugify(event.target.value)); markDirty(); }}/></Field><Field label="Slug" error={fieldErrors.slug}><input {...register("slug")}/></Field></div><Field label="Excerpt" error={fieldErrors.excerpt}><textarea {...register("excerpt")} rows={4}/></Field><Field label={collection === "posts" || collection === "places" ? "Article introduction" : "Description"} error={fieldErrors.content}><RichTextEditor value={watch("content")} onChange={(value) => { setValue("content", value); markDirty(); }}/></Field>{collection === "places" && <div className="field-grid"><Field label="Country"><input {...register("country")}/></Field><Field label="Location"><input {...register("location")}/></Field></div>}{collection === "photography" && <Field label="Location"><input {...register("location")}/></Field>}{collection === "projects" && <><div className="field-grid"><Field label="Technologies, comma separated"><input {...register("technologies")}/></Field><Field label="Year"><input type="number" {...register("year")}/></Field></div><div className="field-grid"><Field label="Project URL"><input type="url" {...register("projectUrl")}/></Field><Field label="Repository URL"><input type="url" {...register("repositoryUrl")}/></Field></div></>}</section>
        {(collection === "posts" || collection === "places") && <ArticleBuilder sections={sections} onChange={onSections} errors={fieldErrors}/>}
        <GalleryEditor images={gallery} onChange={onGallery} label={collection === "posts" || collection === "places" ? "Article gallery" : "Image gallery"}/>
        {recordId && (collection === "posts" || collection === "places") && <RevisionHistory collection={collection} id={recordId} refreshKey={revisionRefreshKey} onRestored={load}/>}</div>
      <div className="editor-side-column">
        <PublishPanel role={role} status={status} scheduledAt={scheduledAt} featured={featured} saving={saving} saveState={saveState} lastSaved={lastSaved} canPreview={Boolean(recordId)} publicUrl={status === "published" && recordId ? `${publicBases[collection]}/${slug}` : undefined} onStatus={(value) => { setValue("status", value as FormValues["status"]); markDirty(); }} onSchedule={(value) => { setValue("scheduledAt", value); markDirty(); }} onFeatured={(value) => { setValue("isFeatured", value); markDirty(); }} onSaveDraft={saveDraft} onPublish={publish} onPreview={preview} onTrash={() => setTrashOpen(true)}/>
        <section className="admin-panel form-section"><h2>Taxonomy</h2><Field label="Category" error={fieldErrors.category}><input {...register("category")}/></Field><Field label="Tags, comma separated"><input {...register("tags")}/></Field></section>
        {(collection === "posts" || collection === "places") && <section className="admin-panel form-section"><h2>Discussion</h2><label className="check-label"><input type="checkbox" {...register("commentsEnabled")}/> Enable comments</label><p className="builder-hint">Approved comments remain visible when comments are closed; new submissions are disabled.</p></section>}
        <section className="admin-panel form-section"><h2>Featured image</h2><ImageUrlField value={featureImage} onChange={setFeaturedImage} error={fieldErrors.featuredImage?.[0] || fieldErrors.imageAlt?.[0]}/></section>
        {(collection === "posts" || collection === "places") && <section className="admin-panel form-section"><h2>Author</h2><Field label="Author name"><input {...register("authorName")}/></Field><Field label="Author title"><input {...register("authorTitle")}/></Field><Field label="Author biography"><textarea {...register("authorBio")} rows={4}/></Field><ImageUrlField value={authorImage} onChange={setAuthorImage} label="Author image" error={fieldErrors.authorImage?.[0] || fieldErrors.authorImageAlt?.[0]}/><Field label="Reading time (minutes)"><input type="number" min="1" {...register("readingTime")}/></Field></section>}
        <section className="admin-panel form-section"><h2>SEO</h2><Field label={`SEO title (${watch("seoTitle").length}/70)`} error={fieldErrors.seoTitle}><input {...register("seoTitle")}/></Field><Field label={`SEO description (${watch("seoDescription").length}/170)`} error={fieldErrors.seoDescription}><textarea {...register("seoDescription")} rows={4}/></Field><ImageUrlField value={ogImage} onChange={setOgImage} label="Open Graph image" error={fieldErrors.ogImage?.[0] || fieldErrors.ogImageAlt?.[0]}/></section>
      </div>
    </form>
    <ConfirmationDialog open={trashOpen} title="Move this content to Trash?" description="It will be removed from public queries immediately and can be restored by an administrator." confirmLabel="Move to Trash" busy={saving} onConfirm={trash} onClose={() => setTrashOpen(false)}/>
  </>;
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  return <div className="field"><label>{label}</label>{children}{error && <span className="field-error">{error.join(" ")}</span>}</div>;
}

function GalleryEditor({ images, onChange, label }: { images: ArticleImage[]; onChange: (images: ArticleImage[]) => void; label: string }) {
  const move = (from: number, to: number) => { const next = [...images]; const [item] = next.splice(from, 1); next.splice(to, 0, item); onChange(next); };
  return <section className="admin-panel form-section"><div className="panel-heading"><div><h2>{label}</h2><p>No JSON required. Add existing HTTPS image URLs.</p></div><button type="button" className="button" onClick={() => onChange([...images, { url: "", alt: "", decorative: false }])}>Add image</button></div>{images.map((image, index) => <div className="gallery-entry" key={`${index}:${image.url}`}><div className="builder-controls"><button type="button" disabled={index === 0} onClick={() => move(index, index - 1)}>Move up</button><button type="button" disabled={index === images.length - 1} onClick={() => move(index, index + 1)}>Move down</button><button type="button" className="danger-link" onClick={() => onChange(images.filter((_, current) => current !== index))}>Remove</button></div><ImageUrlField compact label={`Image ${index + 1}`} value={image} onChange={(next) => onChange(images.map((entry, current) => current === index ? next : entry))}/></div>)}{!images.length && <p className="builder-hint">No gallery images yet.</p>}</section>;
}
