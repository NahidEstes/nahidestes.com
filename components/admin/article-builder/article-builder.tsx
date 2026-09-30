"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Plus, Trash2 } from "lucide-react";
import type { ArticleImage } from "@/types/content";
import { ConfirmationDialog } from "../confirmation-dialog";
import { ImageUrlField } from "../image-url-field";
import { RichTextEditor } from "../rich-text-editor";

export type BuilderBlock = Record<string, unknown> & { id: string; type: string };
export type BuilderSection = { id: string; number?: string; heading: string; blocks: BuilderBlock[] };

const blockLabels = {
  paragraph: "Paragraph", heading: "Heading", subheading: "Subheading", image: "Image", "text-image": "Text + image",
  gallery: "Image gallery", blockquote: "Blockquote", pullquote: "Pull quote", "ordered-list": "Ordered list",
  "unordered-list": "Unordered list", divider: "Divider", video: "Video embed", callout: "Callout box",
} as const;
type KnownBlockType = keyof typeof blockLabels;
const knownTypes = Object.keys(blockLabels) as KnownBlockType[];
const blankImage = (): ArticleImage => ({ url: "", alt: "", caption: "", decorative: false });
const uid = () => typeof globalThis.crypto?.randomUUID === "function"
  ? globalThis.crypto.randomUUID()
  : `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

function createBlock(type: KnownBlockType): BuilderBlock {
  const base = { id: uid(), type };
  if (type === "paragraph") return { ...base, text: "<p>Write your paragraph…</p>" };
  if (type === "heading" || type === "subheading") return { ...base, text: "New heading" };
  if (type === "image") return { ...base, image: blankImage(), fullWidth: false };
  if (type === "text-image") return { ...base, text: "<p>Write your text…</p>", image: blankImage(), imagePosition: "right", emphasis: "balanced" };
  if (type === "gallery") return { ...base, images: [blankImage()], layout: "grid" };
  if (type === "blockquote" || type === "pullquote") return { ...base, text: "Quote text", source: "", variant: "inline" };
  if (type === "ordered-list" || type === "unordered-list") return { ...base, items: ["List item"] };
  if (type === "video") return { ...base, url: "", title: "" };
  if (type === "callout") return { ...base, title: "", text: "<p>Callout text…</p>" };
  return base;
}

export function normalizeBuilderSections(value: unknown): BuilderSection[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object")).map((section, sectionIndex) => ({
    id: typeof section.id === "string" && section.id ? section.id : uid(),
    number: typeof section.number === "string" ? section.number : String(sectionIndex + 1).padStart(2, "0"),
    heading: typeof section.heading === "string" ? section.heading : "Untitled section",
    blocks: Array.isArray(section.blocks) ? section.blocks.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object")).map((block) => ({ ...block, id: typeof block.id === "string" && block.id ? block.id : uid(), type: typeof block.type === "string" ? block.type : "unsupported" })) : [],
  }));
}

function cloneSection(section: BuilderSection): BuilderSection {
  return { ...structuredClone(section), id: uid(), heading: `${section.heading} (copy)`, blocks: section.blocks.map((block) => ({ ...structuredClone(block), id: uid() })) };
}

function move<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ArticleBuilder({ sections, onChange, errors = {} }: { sections: BuilderSection[]; onChange: (sections: BuilderSection[]) => void; errors?: Record<string, string[]> }) {
  const [pendingDelete, setPendingDelete] = useState<{ sectionIndex: number; blockIndex?: number } | null>(null);
  const addSection = () => onChange([...sections, { id: uid(), number: String(sections.length + 1).padStart(2, "0"), heading: "New section", blocks: [createBlock("paragraph")] }]);
  const updateSection = (index: number, section: BuilderSection) => onChange(sections.map((entry, current) => current === index ? section : entry));
  const confirmDelete = () => {
    if (!pendingDelete) return;
    if (pendingDelete.blockIndex === undefined) onChange(sections.filter((_, index) => index !== pendingDelete.sectionIndex));
    else updateSection(pendingDelete.sectionIndex, { ...sections[pendingDelete.sectionIndex], blocks: sections[pendingDelete.sectionIndex].blocks.filter((_, index) => index !== pendingDelete.blockIndex) });
    setPendingDelete(null);
  };
  return <section className="article-builder" aria-labelledby="article-builder-title"><div className="builder-heading"><div><h2 id="article-builder-title">Article sections</h2><p>Build the article visually. Existing unsupported blocks are preserved until you explicitly remove them.</p></div><button type="button" className="button" onClick={addSection}><Plus size={16}/> Add section</button></div>{errors.sections && <p className="field-error">{errors.sections.join(" ")}</p>}{sections.length ? sections.map((section, index) => <SectionEditor key={section.id} section={section} index={index} total={sections.length} errors={errors} onChange={(next) => updateSection(index, next)} onMove={(direction) => onChange(move(sections, index, index + direction))} onDuplicate={() => onChange([...sections.slice(0, index + 1), cloneSection(section), ...sections.slice(index + 1)])} onDelete={() => setPendingDelete({ sectionIndex: index })} onDeleteBlock={(blockIndex) => setPendingDelete({ sectionIndex: index, blockIndex })}/>) : <div className="builder-empty"><p>No structured sections yet. The introduction remains intact.</p><button type="button" className="button" onClick={addSection}>Create the first section</button></div>}<ConfirmationDialog open={Boolean(pendingDelete)} title={pendingDelete?.blockIndex === undefined ? "Delete this section?" : "Delete this block?"} description="This removes it from the current draft. The change is not permanent until you save." confirmLabel="Delete" onConfirm={confirmDelete} onClose={() => setPendingDelete(null)}/></section>;
}

function SectionEditor({ section, index, total, errors, onChange, onMove, onDuplicate, onDelete, onDeleteBlock }: { section: BuilderSection; index: number; total: number; errors: Record<string, string[]>; onChange: (section: BuilderSection) => void; onMove: (direction: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void; onDeleteBlock: (index: number) => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const updateBlock = (blockIndex: number, block: BuilderBlock) => onChange({ ...section, blocks: section.blocks.map((entry, current) => current === blockIndex ? block : entry) });
  return <article className="builder-section"><header className="builder-section-header"><button type="button" className="collapse-button" aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronDown size={17}/> : <ChevronUp size={17}/>}<span>Section {section.number || index + 1}</span></button><div className="builder-controls"><button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move section ${index + 1} up`}><ChevronUp size={16}/> Up</button><button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move section ${index + 1} down`}><ChevronDown size={16}/> Down</button><button type="button" onClick={onDuplicate}><Copy size={15}/> Duplicate</button><button type="button" className="danger-link" onClick={onDelete}><Trash2 size={15}/> Delete</button></div></header>{!collapsed && <div className="builder-section-body"><div className="field-grid"><div className="field"><label>Section number (optional)</label><input value={section.number || ""} onChange={(event) => onChange({ ...section, number: event.target.value })}/></div><div className="field"><label>Section heading</label><input value={section.heading} onChange={(event) => onChange({ ...section, heading: event.target.value })} aria-invalid={Boolean(errors[`sections.${index}.heading`])}/>{errors[`sections.${index}.heading`] && <span className="field-error">{errors[`sections.${index}.heading`].join(" ")}</span>}</div></div><div className="builder-block-list">{section.blocks.map((block, blockIndex) => <BlockEditor key={block.id} block={block} index={blockIndex} total={section.blocks.length} onChange={(next) => updateBlock(blockIndex, next)} onMove={(direction) => onChange({ ...section, blocks: move(section.blocks, blockIndex, blockIndex + direction) })} onDuplicate={() => onChange({ ...section, blocks: [...section.blocks.slice(0, blockIndex + 1), { ...structuredClone(block), id: uid() }, ...section.blocks.slice(blockIndex + 1)] })} onDelete={() => onDeleteBlock(blockIndex)}/>)}</div><AddBlock onAdd={(type) => onChange({ ...section, blocks: [...section.blocks, createBlock(type)] })}/></div>}</article>;
}

function AddBlock({ onAdd }: { onAdd: (type: KnownBlockType) => void }) {
  const [type, setType] = useState<KnownBlockType>("paragraph");
  return <div className="add-block"><select value={type} onChange={(event) => setType(event.target.value as KnownBlockType)} aria-label="Block type">{knownTypes.map((value) => <option key={value} value={value}>{blockLabels[value]}</option>)}</select><button type="button" className="button" onClick={() => onAdd(type)}><Plus size={16}/> Add block</button></div>;
}

function BlockEditor({ block, index, total, onChange, onMove, onDuplicate, onDelete }: { block: BuilderBlock; index: number; total: number; onChange: (block: BuilderBlock) => void; onMove: (direction: -1 | 1) => void; onDuplicate: () => void; onDelete: () => void }) {
  const [collapsed, setCollapsed] = useState(false);
  const known = knownTypes.includes(block.type as KnownBlockType);
  const type = block.type as KnownBlockType;
  const image = useMemo(() => (block.image && typeof block.image === "object" ? block.image : blankImage()) as ArticleImage, [block.image]);
  const changeType = (next: KnownBlockType) => {
    if ((type === "heading" && next === "subheading") || (type === "subheading" && next === "heading") || (type === "ordered-list" && next === "unordered-list") || (type === "unordered-list" && next === "ordered-list") || (type === "blockquote" && next === "pullquote") || (type === "pullquote" && next === "blockquote")) onChange({ ...block, type: next });
    else onChange(createBlock(next));
  };
  return <article className={`builder-block ${!known ? "unsupported" : ""}`}><header className="builder-block-header"><button type="button" className="collapse-button" aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <ChevronDown size={16}/> : <ChevronUp size={16}/>}<span>{known ? blockLabels[type] : `Unsupported: ${block.type}`}</span></button><div className="builder-controls"><button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move block ${index + 1} up`}><ChevronUp size={15}/> Up</button><button type="button" onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move block ${index + 1} down`}><ChevronDown size={15}/> Down</button><button type="button" onClick={onDuplicate}><Copy size={14}/> Duplicate</button><button type="button" className="danger-link" onClick={onDelete}><Trash2 size={14}/> Delete</button></div></header>{!collapsed && <div className="builder-block-body">{known ? <><div className="field block-type-field"><label>Block type</label><select value={type} onChange={(event) => changeType(event.target.value as KnownBlockType)}>{knownTypes.map((value) => <option key={value} value={value}>{blockLabels[value]}</option>)}</select></div><KnownBlockFields block={block} type={type} image={image} onChange={onChange}/></> : <div className="unsupported-warning"><strong>This block type is not supported by the visual editor.</strong><p>Its original data will be preserved when you save. Delete it only if you intend to remove it.</p></div>}</div>}</article>;
}

function KnownBlockFields({ block, type, image, onChange }: { block: BuilderBlock; type: KnownBlockType; image: ArticleImage; onChange: (block: BuilderBlock) => void }) {
  const set = (key: string, value: unknown) => onChange({ ...block, [key]: value });
  if (type === "paragraph") return <RichTextEditor compact value={String(block.text || "")} onChange={(value) => set("text", value)} ariaLabel="Paragraph content"/>;
  if (type === "heading" || type === "subheading") return <div className="field"><label>Text</label><input value={String(block.text || "")} onChange={(event) => set("text", event.target.value)}/></div>;
  if (type === "image") return <><ImageUrlField value={image} onChange={(value) => set("image", value)}/><label className="check-label"><input type="checkbox" checked={Boolean(block.fullWidth)} onChange={(event) => set("fullWidth", event.target.checked)}/> Full-width presentation</label></>;
  if (type === "text-image") return <><RichTextEditor compact value={String(block.text || "")} onChange={(value) => set("text", value)} ariaLabel="Text and image block content"/><ImageUrlField value={image} onChange={(value) => set("image", value)}/><div className="field-grid"><div className="field"><label>Image position</label><select value={String(block.imagePosition || "right")} onChange={(event) => set("imagePosition", event.target.value)}><option value="left">Left</option><option value="right">Right</option></select></div><div className="field"><label>Layout emphasis</label><select value={String(block.emphasis || "balanced")} onChange={(event) => set("emphasis", event.target.value)}><option value="balanced">Balanced</option><option value="image">Image emphasis</option><option value="text">Text emphasis</option></select></div></div></>;
  if (type === "gallery") return <GalleryFields images={Array.isArray(block.images) ? block.images as ArticleImage[] : []} layout={String(block.layout || "grid")} onImages={(images) => set("images", images)} onLayout={(layout) => set("layout", layout)}/>;
  if (type === "blockquote" || type === "pullquote") return <><div className="field"><label>Quote text</label><textarea value={String(block.text || "")} onChange={(event) => set("text", event.target.value)}/></div><div className="field-grid"><div className="field"><label>Source (optional)</label><input value={String(block.source || "")} onChange={(event) => set("source", event.target.value)}/></div><div className="field"><label>Style</label><select value={String(block.variant || "inline")} onChange={(event) => set("variant", event.target.value)}><option value="inline">Inline</option><option value="card">Card</option><option value="overlay">Image overlay</option></select></div></div>{block.variant === "overlay" && <ImageUrlField value={image} onChange={(value) => set("image", value)} label="Overlay image"/>}</>;
  if (type === "ordered-list" || type === "unordered-list") return <div className="field"><label>List items, one per line</label><textarea value={(Array.isArray(block.items) ? block.items : []).join("\n")} onChange={(event) => set("items", event.target.value.split("\n").map((item) => item.trim()).filter(Boolean))}/></div>;
  if (type === "divider") return <p className="builder-hint">A decorative divider will appear in the article.</p>;
  if (type === "video") return <div className="field-grid"><div className="field"><label>YouTube or Vimeo URL</label><input type="url" value={String(block.url || "")} onChange={(event) => set("url", event.target.value)}/></div><div className="field"><label>Accessible title</label><input value={String(block.title || "")} onChange={(event) => set("title", event.target.value)}/></div></div>;
  if (type === "callout") return <><div className="field"><label>Callout title (optional)</label><input value={String(block.title || "")} onChange={(event) => set("title", event.target.value)}/></div><RichTextEditor compact value={String(block.text || "")} onChange={(value) => set("text", value)} ariaLabel="Callout text"/></>;
  return null;
}

function GalleryFields({ images, layout, onImages, onLayout }: { images: ArticleImage[]; layout: string; onImages: (images: ArticleImage[]) => void; onLayout: (layout: string) => void }) {
  return <div className="gallery-builder"><div className="field"><label>Gallery layout</label><select value={layout} onChange={(event) => onLayout(event.target.value)}><option value="grid">Grid</option><option value="two-columns">Two columns</option><option value="editorial-strip">Editorial strip</option><option value="full-width">Full-width sequence</option></select></div>{images.map((image, index) => <div className="gallery-entry" key={`${index}:${image.url}`}><div className="builder-controls"><button type="button" onClick={() => onImages(move(images, index, index - 1))} disabled={index === 0}>Move up</button><button type="button" onClick={() => onImages(move(images, index, index + 1))} disabled={index === images.length - 1}>Move down</button><button type="button" className="danger-link" onClick={() => onImages(images.filter((_, current) => current !== index))}>Remove</button></div><ImageUrlField compact label={`Gallery image ${index + 1}`} value={image} onChange={(next) => onImages(images.map((entry, current) => current === index ? next : entry))}/></div>)}<button type="button" className="button" onClick={() => onImages([...images, blankImage()])}><Plus size={16}/> Add gallery image</button></div>;
}
