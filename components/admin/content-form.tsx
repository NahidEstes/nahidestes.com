"use client";

import Link from "next/link";
import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState } from "react";
import { ExternalLink, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import type { ArticleImage, ContentCollection } from "@/types/content";
import { ArticleBuilder, normalizeBuilderSections, type BuilderSection } from "./article-builder/article-builder";
import { ConfirmationDialog } from "./confirmation-dialog";
import { ImageThumbnail, ImageUrlField } from "./image-url-field";
import { ArticleSettingsDrawer } from "./article-settings-drawer";
import { SettingsAccordion } from "./settings-accordion";
import { hasCustomAuthor, normalizeEditorFieldErrors, settingsPanelForField, toLocalDateTimeInput, type EditorSettingsPanel } from "@/lib/admin/editor-settings";
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
const numberOrUndefined = (value: string) => value ? Number(value) : undefined;
const featuredFields = { url: "featuredImage", alt: "imageAlt", caption: "featuredImageCaption", width: "featuredImageWidth", height: "featuredImageHeight", decorative: "featuredImageDecorative" };
const authorFields = { url: "authorImage", alt: "authorImageAlt", caption: "authorImageCaption", width: "authorImageWidth", height: "authorImageHeight", decorative: "authorImageDecorative" };
const socialFields = { url: "ogImage", alt: "ogImageAlt", caption: "ogImageCaption", width: "ogImageWidth", height: "ogImageHeight", decorative: "ogImageDecorative" };

export type DefaultAuthor = { name: string; title: string; biography: string; image: string };

export function ContentForm({ collection, id, role, defaultAuthor }: { collection: ContentCollection; id?: string; role: AdminRole; defaultAuthor: DefaultAuthor }) {
  const router = useRouter();
  const { notify } = useToast();
  const { register, getValues, reset, setValue, watch } = useForm<FormValues>({ defaultValues: defaults, shouldUnregister: false });
  const formRef = useRef<HTMLFormElement>(null);
  const settingsId = useId();
  const settingsInitialized = useRef(false);
  const silentChange = useRef(false);
  const [openPanel, setOpenPanel] = useState<EditorSettingsPanel | null>(id ? null : "featured");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [publicationOpen, setPublicationOpen] = useState(false);
  const [customAuthor, setCustomAuthor] = useState(false);
  const [customSocialImage, setCustomSocialImage] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
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
  const featured = watch("isFeatured");
  const slug = watch("slug");

  const markDirty = useCallback(() => {
    if (!loaded || silentChange.current) return;
    changeVersion.current += 1;
    setSaveState("dirty");
  }, [loaded]);

  const hydrate = useCallback((item: Record<string, unknown>) => {
    silentChange.current = true;
    reset({
      ...defaults,
      ...item,
      commentsEnabled: item.commentsEnabled !== false,
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : "",
      technologies: Array.isArray(item.technologies) ? item.technologies.join(", ") : "",
      publishedAt: toDateInput(item.publishedAt), scheduledAt: toLocalDateTimeInput(item.scheduledAt),
      readingTime: item.readingTime ? String(item.readingTime) : "", year: item.year ? String(item.year) : "",
      featuredImageWidth: item.featuredImageWidth ? String(item.featuredImageWidth) : "", featuredImageHeight: item.featuredImageHeight ? String(item.featuredImageHeight) : "",
      authorImageWidth: item.authorImageWidth ? String(item.authorImageWidth) : "", authorImageHeight: item.authorImageHeight ? String(item.authorImageHeight) : "",
      ogImageWidth: item.ogImageWidth ? String(item.ogImageWidth) : "", ogImageHeight: item.ogImageHeight ? String(item.ogImageHeight) : "",
    } as FormValues);
    silentChange.current = false;
    setCustomAuthor(hasCustomAuthor(item));
    setCustomSocialImage(Boolean(item.ogImage));
    if (!settingsInitialized.current) {
      setOpenPanel(item.featuredImage ? null : "featured");
      settingsInitialized.current = true;
    }
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

  const revealErrors = useCallback((errors: Record<string, string[]>) => {
    const fields = Object.keys(errors);
    const first = fields[0];
    if (!first) return;
    const panel = settingsPanelForField(first);
    if (panel) {
      setOpenPanel(panel);
      if (panel === "author" && first.startsWith("author")) setCustomAuthor(true);
      if (panel === "seo" && first.startsWith("ogImage")) setCustomSocialImage(true);
      if (window.matchMedia("(max-width: 850px)").matches) setDrawerOpen(true);
    } else {
      if (first === "status" || first === "scheduledAt" || first === "publishedAt") { setPublicationOpen(true); if (window.matchMedia("(max-width: 850px)").matches) setDrawerOpen(true); }
      else setDrawerOpen(false);
    }
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const form = formRef.current;
      const field = form?.querySelector<HTMLElement>(`[data-error-field="${CSS.escape(first)}"], [name="${CSS.escape(first)}"]`) || form?.querySelector<HTMLElement>('[aria-invalid="true"]');
      const target = field?.matches("input,textarea,select,button,[contenteditable]") ? field : field?.querySelector<HTMLElement>('input:not(:disabled),textarea,select,[contenteditable="true"]');
      (target || field)?.scrollIntoView({ block: "center", behavior: "instant" });
      target?.focus({ preventScroll: true });
    }));
  }, []);

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
    if (!values.publishedAt || !Number.isFinite(Date.parse(values.publishedAt))) errors.publishedAt = ["Choose a valid publication date."];
    if (values.status === "scheduled" && (!values.scheduledAt || !Number.isFinite(Date.parse(values.scheduledAt)))) errors.scheduledAt = ["Choose a schedule date and time."];
    sections.forEach((section, sectionIndex) => {
      if (!section.heading.trim()) errors[`sections.${sectionIndex}.heading`] = ["Section heading is required."];
      section.blocks.forEach((block, blockIndex) => {
        if (["paragraph", "text-image", "callout"].includes(block.type) && !String(block.text || "").replace(/<[^>]+>/g, "").trim()) errors[`sections.${sectionIndex}.blocks.${blockIndex}.text`] = ["Content cannot be empty."];
        if (["ordered-list", "unordered-list"].includes(block.type) && (!Array.isArray(block.items) || !block.items.some((item) => String(item).trim()))) errors[`sections.${sectionIndex}.blocks.${blockIndex}.items`] = ["Add at least one list item."];
      });
    });
    setFieldErrors(errors);
    return errors;
  }, [sections]);

  const save = useCallback(async (statusOverride?: FormValues["status"], automatic = false) => {
    if (savingRef.current || (automatic && !recordId)) return false;
    const values = getValues();
    const nextStatus = role === "editor" ? "draft" : statusOverride || values.status;
    const nextValues = { ...values, status: nextStatus,
      ...(customAuthor ? {} : { authorImage: "", authorImageAlt: "" }),
      ...(customSocialImage ? {} : { ogImage: "", ogImageAlt: "" }),
    };
    const errors = validateClient(nextValues);
    if (Object.keys(errors).length) { setSaveState("error"); if (!automatic) { revealErrors(errors); notify("Please correct the highlighted fields.", "error"); } return false; }
    const startedAtVersion = changeVersion.current;
    const payload: Record<string, unknown> = {
      title: values.title, slug: values.slug, excerpt: values.excerpt, content: values.content,
      featuredImage: values.featuredImage, imageAlt: values.imageAlt, featuredImageCaption: values.featuredImageCaption,
      featuredImageWidth: numberOrUndefined(values.featuredImageWidth), featuredImageHeight: numberOrUndefined(values.featuredImageHeight), featuredImageDecorative: values.featuredImageDecorative,
      category: values.category, tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean), status: nextStatus,
      publishedAt: new Date(values.publishedAt).toISOString(), scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
      isFeatured: values.isFeatured, seoTitle: values.seoTitle, seoDescription: values.seoDescription, ogImage: customSocialImage ? values.ogImage : "", ogImageAlt: customSocialImage ? values.ogImageAlt : "",
      ogImageCaption: customSocialImage ? values.ogImageCaption : "", ogImageWidth: customSocialImage ? numberOrUndefined(values.ogImageWidth) : undefined, ogImageHeight: customSocialImage ? numberOrUndefined(values.ogImageHeight) : undefined, ogImageDecorative: customSocialImage && values.ogImageDecorative,
      version,
    };
    if (collection === "posts" || collection === "places") Object.assign(payload, {
      sections, gallery, commentsEnabled: values.commentsEnabled, readingTime: values.readingTime ? Number(values.readingTime) : null, authorName: customAuthor ? values.authorName : "", authorTitle: customAuthor ? values.authorTitle : "",
      authorBio: customAuthor ? values.authorBio : "", authorImage: customAuthor ? values.authorImage : "", authorImageAlt: customAuthor ? values.authorImageAlt : "", authorImageCaption: customAuthor ? values.authorImageCaption : "",
      authorImageWidth: customAuthor ? numberOrUndefined(values.authorImageWidth) : undefined, authorImageHeight: customAuthor ? numberOrUndefined(values.authorImageHeight) : undefined, authorImageDecorative: customAuthor && values.authorImageDecorative,
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
      const serverErrors = normalizeEditorFieldErrors(error.fieldErrors || {});
      setFieldErrors(serverErrors);
      if (!automatic) revealErrors(serverErrors);
      setSaveState("error");
      notify(error.message, "error");
      return false;
    }
    const nextId = String(result.data._id || recordId || "");
    setVersion(Number(result.data.version || version + 1));
    silentChange.current = true;
    setValue("status", nextStatus, { shouldDirty: false });
    silentChange.current = false;
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
  }, [collection, customAuthor, customSocialImage, gallery, getValues, notify, recordId, revealErrors, role, router, sections, setValue, validateClient, version]);

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
  const isArticle = collection === "posts" || collection === "places";
  const tagCount = watch("tags").split(",").filter((tag) => tag.trim()).length;
  const panelErrorCount = (panel: EditorSettingsPanel) => Object.keys(fieldErrors).filter((field) => settingsPanelForField(field) === panel).length;
  const togglePanel = (panel: EditorSettingsPanel) => setOpenPanel((current) => current === panel ? null : panel);
  const publicUrl = status === "published" && recordId ? `${publicBases[collection]}/${slug}` : undefined;
  if (!loaded) return <div className="admin-panel"><p>Loading editor…</p></div>;

  return <>
    <div className="admin-top"><h1>{title}</h1><Link className="text-link" href={`/admin/${collection}`}>Back to list</Link></div>
    <form ref={formRef} className="admin-editor-form" noValidate onSubmit={(event) => { event.preventDefault(); void save(); }}>
      <PublishPanel role={role} status={status} saving={saving} saveState={saveState} lastSaved={lastSaved} canPreview={Boolean(recordId)} onSaveDraft={saveDraft} onPublish={publish} onPreview={preview} onSettings={() => setDrawerOpen(true)} settingsOpen={drawerOpen} settingsId={settingsId}/>
      <div className="editor-main-column">
        <section className="admin-panel form-section"><h2>Story details</h2><div className="field-grid"><Field label="Title" error={fieldErrors.title}><input {...register("title")} onChange={(event) => { setValue("title", event.target.value); if (!recordId) setValue("slug", slugify(event.target.value)); markDirty(); }}/></Field><Field label="Slug" error={fieldErrors.slug}><input {...register("slug")}/></Field></div><Field label="Excerpt" error={fieldErrors.excerpt}><textarea {...register("excerpt")} rows={4}/></Field><Field label={collection === "posts" || collection === "places" ? "Article introduction" : "Description"} error={fieldErrors.content}><RichTextEditor value={watch("content")} onChange={(value) => { setValue("content", value); markDirty(); }}/></Field>{collection === "places" && <div className="field-grid"><Field label="Country"><input {...register("country")}/></Field><Field label="Location"><input {...register("location")}/></Field></div>}{collection === "photography" && <Field label="Location"><input {...register("location")}/></Field>}{collection === "projects" && <><div className="field-grid"><Field label="Technologies, comma separated"><input {...register("technologies")}/></Field><Field label="Year"><input type="number" {...register("year")}/></Field></div><div className="field-grid"><Field label="Project URL"><input type="url" {...register("projectUrl")}/></Field><Field label="Repository URL"><input type="url" {...register("repositoryUrl")}/></Field></div></>}</section>
        {(collection === "posts" || collection === "places") && <ArticleBuilder sections={sections} onChange={onSections} errors={fieldErrors}/>}
        <GalleryEditor images={gallery} onChange={onGallery} label={collection === "posts" || collection === "places" ? "Article gallery" : "Image gallery"}/>
        {recordId && (collection === "posts" || collection === "places") && <RevisionHistory collection={collection} id={recordId} refreshKey={revisionRefreshKey} onRestored={load}/>}</div>
      <ArticleSettingsDrawer open={drawerOpen} onClose={closeDrawer} drawerId={settingsId}>
        <details className="publication-options" open={publicationOpen}>
          <summary onClick={(event) => { event.preventDefault(); setPublicationOpen((current) => !current); }}>Publication settings{(fieldErrors.status || fieldErrors.publishedAt || fieldErrors.scheduledAt) && <span className="settings-error-badge" aria-label="Publication validation error">!</span>}</summary>
          <Field label="Publication status" error={fieldErrors.status}><select {...register("status")} disabled={role !== "admin"}><option value="draft">Draft</option><option value="published">Published</option><option value="scheduled">Scheduled</option></select></Field>
          {role !== "admin" && <p className="builder-hint">Editors can save and preview drafts; an administrator publishes them.</p>}
          <Field label="Publication date" error={fieldErrors.publishedAt}><input type="date" {...register("publishedAt")}/></Field>
          {status === "scheduled" && <Field label="Schedule date and time" error={fieldErrors.scheduledAt}><input type="datetime-local" {...register("scheduledAt")} disabled={role !== "admin"}/></Field>}
          <label className="check-label"><input type="checkbox" checked={featured} onChange={(event) => { setValue("isFeatured", event.target.checked); markDirty(); }}/> Feature this item</label>
          {publicUrl && <a className="public-url" href={publicUrl} target="_blank" rel="noreferrer"><ExternalLink size={15}/> Open public URL</a>}
          <button type="button" className="trash-button" onClick={() => { setDrawerOpen(false); setTrashOpen(true); }} disabled={role !== "admin" || !recordId || saving}><Trash2 size={15}/> Move to Trash</button>
        </details>
        <SettingsAccordion title="Featured Image" summary={featureImage.url ? <><ImageThumbnail url={featureImage.url}/> Image selected</> : "Image missing"} open={openPanel === "featured"} onToggle={() => togglePanel("featured")} errorCount={panelErrorCount("featured")}>
          <ImageUrlField sidebar value={featureImage} onChange={setFeaturedImage} fieldNames={featuredFields} errors={fieldErrors}/>
        </SettingsAccordion>
        <SettingsAccordion title="Category & Tags" summary={`${watch("category") || "No category"} · ${tagCount} ${tagCount === 1 ? "tag" : "tags"}`} open={openPanel === "taxonomy"} onToggle={() => togglePanel("taxonomy")} errorCount={panelErrorCount("taxonomy")}>
          <Field label="Category" error={fieldErrors.category}><input {...register("category")}/></Field><Field label="Tags, comma separated" error={fieldErrors.tags}><input {...register("tags")}/></Field>
        </SettingsAccordion>
        <SettingsAccordion title="SEO" summary={watch("seoTitle") || watch("seoDescription") || (customSocialImage && ogImage.url) ? "Custom SEO" : "Default SEO"} open={openPanel === "seo"} onToggle={() => togglePanel("seo")} errorCount={panelErrorCount("seo")}>
          <Field label={`SEO title (${watch("seoTitle").length}/70)`} error={fieldErrors.seoTitle}><input {...register("seoTitle")}/></Field>
          <Field label={`SEO description (${watch("seoDescription").length}/170)`} error={fieldErrors.seoDescription}><textarea {...register("seoDescription")} rows={3}/></Field>
          <label className="check-label"><input type="checkbox" checked={customSocialImage} onChange={(event) => { setCustomSocialImage(event.target.checked); markDirty(); }}/> Use a different social image</label>
          {!customSocialImage && <div className="settings-fallback-preview"><ImageThumbnail url={featureImage.url}/><p>The featured image will be used for social sharing.</p></div>}
          <div hidden={!customSocialImage}><ImageUrlField sidebar value={ogImage} onChange={setOgImage} label="Open Graph image" fieldNames={socialFields} errors={fieldErrors}/></div>
        </SettingsAccordion>
        {isArticle && <SettingsAccordion title="Author" summary={customAuthor ? watch("authorName") || defaultAuthor.name : defaultAuthor.name} open={openPanel === "author"} onToggle={() => togglePanel("author")} errorCount={panelErrorCount("author")}>
          <div className="settings-default-author"><ImageThumbnail url={defaultAuthor.image}/><div><strong>{defaultAuthor.name}</strong><small>{defaultAuthor.title}</small></div></div>
          <label className="check-label"><input type="checkbox" checked={!customAuthor} onChange={(event) => { setCustomAuthor(!event.target.checked); markDirty(); }}/> Use default author</label>
          {!customAuthor && <><p className="builder-hint">Site settings provide the author name, title, biography and image when saved. Your custom values remain available during this editing session.</p><button type="button" className="settings-customize-button" onClick={() => { setCustomAuthor(true); markDirty(); }}>Customize author</button></>}
          <div hidden={!customAuthor}>
            <Field label="Author name" error={fieldErrors.authorName}><input {...register("authorName")}/></Field><Field label="Author title" error={fieldErrors.authorTitle}><input {...register("authorTitle")}/></Field><Field label="Author biography" error={fieldErrors.authorBio}><textarea {...register("authorBio")} rows={3}/></Field>
            <ImageUrlField sidebar value={authorImage} onChange={setAuthorImage} label="Author image" fieldNames={authorFields} errors={fieldErrors}/>
          </div>
          <section className="settings-reading-time"><h3>Reading time</h3><Field label="Manual override (minutes)" error={fieldErrors.readingTime}><input type="number" min="1" {...register("readingTime")}/></Field><p className="builder-hint">Leave blank to calculate from the article.</p></section>
        </SettingsAccordion>}
        {isArticle && <SettingsAccordion title="Discussion" summary={watch("commentsEnabled") ? "Comments enabled" : "Comments disabled"} open={openPanel === "discussion"} onToggle={() => togglePanel("discussion")} errorCount={panelErrorCount("discussion")}>
          <label className="check-label"><input type="checkbox" {...register("commentsEnabled")}/> Enable comments</label><p className="builder-hint">Approved comments remain visible when comments are closed; new submissions are disabled.</p>
        </SettingsAccordion>}
      </ArticleSettingsDrawer>
    </form>
    <ConfirmationDialog open={trashOpen} title="Move this content to Trash?" description="It will be removed from public queries immediately and can be restored by an administrator." confirmLabel="Move to Trash" busy={saving} onConfirm={trash} onClose={() => setTrashOpen(false)}/>
  </>;
}

function Field({ label, error, children }: { label: string; error?: string[]; children: React.ReactNode }) {
  const id = useId();
  const nativeField = isValidElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }>(children) && typeof children.type === "string";
  return <div className="field"><label htmlFor={nativeField ? id : undefined}>{label}</label>{nativeField ? cloneElement(children, { id, "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : undefined }) : children}{error && <span id={`${id}-error`} className="field-error">{error.join(" ")}</span>}</div>;
}

function GalleryEditor({ images, onChange, label }: { images: ArticleImage[]; onChange: (images: ArticleImage[]) => void; label: string }) {
  const move = (from: number, to: number) => { const next = [...images]; const [item] = next.splice(from, 1); next.splice(to, 0, item); onChange(next); };
  return <section className="admin-panel form-section"><div className="panel-heading"><div><h2>{label}</h2><p>No JSON required. Add existing HTTPS image URLs.</p></div><button type="button" className="button" onClick={() => onChange([...images, { url: "", alt: "", decorative: false }])}>Add image</button></div>{images.map((image, index) => <div className="gallery-entry" key={`${index}:${image.url}`}><div className="builder-controls"><button type="button" disabled={index === 0} onClick={() => move(index, index - 1)}>Move up</button><button type="button" disabled={index === images.length - 1} onClick={() => move(index, index + 1)}>Move down</button><button type="button" className="danger-link" onClick={() => onChange(images.filter((_, current) => current !== index))}>Remove</button></div><ImageUrlField compact label={`Image ${index + 1}`} value={image} onChange={(next) => onChange(images.map((entry, current) => current === index ? next : entry))}/></div>)}{!images.length && <p className="builder-hint">No gallery images yet.</p>}</section>;
}
