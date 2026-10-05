"use client";
/* eslint-disable @next/next/no-img-element */

import { useId, useState } from "react";
import type { ArticleImage } from "@/types/content";

export function ImageThumbnail({ url, alt = "" }: { url: string; alt?: string }) {
  const [failedUrl, setFailedUrl] = useState<string>();
  return url && failedUrl !== url ? <img className="settings-thumbnail" src={url} alt={alt} referrerPolicy="no-referrer" onError={() => setFailedUrl(url)}/> : <span className="settings-thumbnail-placeholder" aria-hidden="true">—</span>;
}

export function ImageUrlField({ value, onChange, label = "Image", error, compact = false, sidebar = false, fieldNames, errors = {} }: {
  value: ArticleImage;
  onChange: (value: ArticleImage) => void;
  label?: string;
  error?: string;
  compact?: boolean;
  sidebar?: boolean;
  fieldNames?: Partial<Record<keyof ArticleImage, string>>;
  errors?: Record<string, string[]>;
}) {
  const id = useId();
  const [brokenUrl, setBrokenUrl] = useState<string>();
  const [loadedUrl, setLoadedUrl] = useState<string>();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const valid = /^https:\/\/[^\s]+$/i.test(value.url);
  const broken = brokenUrl === value.url;
  const update = <K extends keyof ArticleImage>(key: K, next: ArticleImage[K]) => onChange({ ...value, [key]: next });
  const message = (key: keyof ArticleImage) => errors[fieldNames?.[key] || ""]?.join(" ") || (key === "url" ? error : undefined);
  const invalidAdvanced = ["caption", "width", "height", "decorative"].some((key) => Boolean(message(key as keyof ArticleImage)));
  const controlProps = (key: keyof ArticleImage) => ({ id: `${id}-${key}`, "data-error-field": fieldNames?.[key], "aria-invalid": Boolean(message(key)), "aria-describedby": message(key) ? `${id}-${key}-error` : undefined });
  const feedback = (key: keyof ArticleImage) => message(key) ? <span id={`${id}-${key}-error`} className="field-error">{message(key)}</span> : null;
  const advanced = <>
    <div className="field"><label htmlFor={`${id}-caption`}>Caption (optional)</label><input {...controlProps("caption")} value={value.caption || ""} onChange={(event) => update("caption", event.target.value)}/>{feedback("caption")}</div>
    <div className="field-grid"><div className="field"><label htmlFor={`${id}-width`}>Width (optional)</label><input {...controlProps("width")} type="number" min="1" value={value.width || ""} onChange={(event) => update("width", event.target.value ? Number(event.target.value) : undefined)}/>{feedback("width")}</div><div className="field"><label htmlFor={`${id}-height`}>Height (optional)</label><input {...controlProps("height")} type="number" min="1" value={value.height || ""} onChange={(event) => update("height", event.target.value ? Number(event.target.value) : undefined)}/>{feedback("height")}</div></div>
    <label className="check-label"><input {...controlProps("decorative")} type="checkbox" checked={Boolean(value.decorative)} onChange={(event) => update("decorative", event.target.checked)}/> Decorative image</label>{feedback("decorative")}
  </>;
  return <fieldset className={`image-url-field ${compact ? "compact" : ""} ${sidebar ? "sidebar-image-field" : ""}`}>
    <legend>{label}</legend>
    <div className="field"><label htmlFor={`${id}-url`}>HTTPS image URL</label><input {...controlProps("url")} type="url" value={value.url} onChange={(event) => update("url", event.target.value)} placeholder="https://i.ibb.co/.../image.jpg"/>{feedback("url")}<small>Use a direct HTTPS image link. For ImgBB, copy “Direct link” starting with https://i.ibb.co/.</small></div>
    {value.url && <div className={`image-url-preview ${!valid || broken ? "invalid" : ""}`}>
      {valid && !broken ? <><img key={value.url} src={value.url} alt={value.decorative ? "" : value.alt || "Preview"} referrerPolicy="no-referrer" onLoad={() => setLoadedUrl(value.url)} onError={() => setBrokenUrl(value.url)}/>{loadedUrl !== value.url && <span role="status" className="image-preview-status">Loading image…</span>}</> : <div><p role="status">{broken ? "The image could not be loaded. Check the direct image URL." : "Enter a valid HTTPS image URL."}</p>{broken && <button type="button" className="settings-customize-button" onClick={() => { setBrokenUrl(undefined); setLoadedUrl(undefined); }}>Retry preview</button>}</div>}
    </div>}
    <div className="field"><label htmlFor={`${id}-alt`}>Alt text</label><input {...controlProps("alt")} value={value.alt} onChange={(event) => update("alt", event.target.value)} disabled={Boolean(value.decorative)} placeholder="Describe the image"/>{feedback("alt")}{value.decorative && <small>This image is decorative; alt text is not required.</small>}</div>
    {sidebar ? <details className="image-advanced-options" open={advancedOpen || invalidAdvanced}><summary onClick={(event) => { event.preventDefault(); setAdvancedOpen((current) => !current); }}>Advanced image options</summary>{advanced}</details> : advanced}
  </fieldset>;
}
