"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from "react";

type Preview = {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  trigger: HTMLButtonElement;
};
type ActivePreview = Preview & { index: number; total: number };

type LightboxContextValue = {
  open: (preview: Preview) => void;
  register: (preview: Preview) => void;
  unregister: (id: string) => void;
};

const LightboxContext = createContext<LightboxContextValue | null>(null);

export function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<ActivePreview | null>(null);
  const previewsRef = useRef(new Map<string, Preview>());
  const originalTriggerRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const register = useCallback((item: Preview) => { previewsRef.current.set(item.id, item); }, []);
  const unregister = useCallback((id: string) => { previewsRef.current.delete(id); }, []);
  const orderedIds = useCallback(() => Array.from(document.querySelectorAll<HTMLElement>("[data-lightbox-id]"))
    .map((element) => element.dataset.lightboxId)
    .filter((id): id is string => Boolean(id && previewsRef.current.has(id))), []);
  const open = useCallback((item: Preview) => {
    originalTriggerRef.current = item.trigger;
    const ids = orderedIds();
    setPreview({ ...item, index: Math.max(0, ids.indexOf(item.id)), total: Math.max(1, ids.length) });
  }, [orderedIds]);
  const close = useCallback(() => {
    const trigger = originalTriggerRef.current;
    setPreview(null);
    originalTriggerRef.current = null;
    requestAnimationFrame(() => trigger?.focus());
  }, []);
  const navigate = useCallback((direction: -1 | 1) => {
    setPreview((current) => {
      if (!current) return current;
      const ids = orderedIds();
      if (ids.length < 2) return current;
      const currentIndex = Math.max(0, ids.indexOf(current.id));
      const nextIndex = (currentIndex + direction + ids.length) % ids.length;
      const next = previewsRef.current.get(ids[nextIndex]);
      return next ? { ...next, index: nextIndex, total: ids.length } : current;
    });
  }, [orderedIds]);
  const isOpen = Boolean(preview);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
      if (event.key === "Tab") {
        const controls = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") || []);
        if (!controls.length) return;
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close, navigate]);

  useEffect(() => {
    if (!preview) return;
    const ids = orderedIds();
    const currentIndex = ids.indexOf(preview.id);
    for (const offset of [-1, 1]) {
      const adjacent = previewsRef.current.get(ids[(currentIndex + offset + ids.length) % ids.length]);
      if (adjacent && adjacent.src !== preview.src) new window.Image().src = adjacent.src;
    }
  }, [preview, orderedIds]);

  const value = useMemo(() => ({ open, register, unregister }), [open, register, unregister]);

  return <LightboxContext.Provider value={value}>
    {children}
    {preview && <div ref={dialogRef} className="image-lightbox" role="dialog" aria-modal="true" aria-label={`Image preview: ${preview.alt}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }} onTouchStart={(event) => { touchStartRef.current = event.changedTouches[0]?.clientX ?? null; }} onTouchEnd={(event) => { const start = touchStartRef.current; const end = event.changedTouches[0]?.clientX; touchStartRef.current = null; if (start == null || end == null || Math.abs(start - end) < 50) return; navigate(start > end ? 1 : -1); }}>
      <button ref={closeButtonRef} type="button" className="image-lightbox-close" aria-label="Close image preview" onClick={close}><X size={25}/></button>
      {preview.total > 1 && <button type="button" className="image-lightbox-nav previous" aria-label="View previous image" onClick={() => navigate(-1)}><ChevronLeft size={30}/></button>}
      <figure className="image-lightbox-figure" onMouseDown={(event) => event.stopPropagation()}>
        <Image src={preview.src} alt={preview.alt} width={preview.width} height={preview.height} sizes="92vw" priority/>
        {preview.caption && <figcaption>{preview.caption}</figcaption>}
      </figure>
      {preview.total > 1 && <><span className="image-lightbox-count" aria-live="polite">{preview.index + 1} / {preview.total}</span><button type="button" className="image-lightbox-nav next" aria-label="View next image" onClick={() => navigate(1)}><ChevronRight size={30}/></button></>}
    </div>}
  </LightboxContext.Provider>;
}

export function LightboxImage({ src, alt, caption, width = 1600, height = 1000, sizes, priority = false, className = "" }: {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const lightbox = useContext(LightboxContext);
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!lightbox) return;
    const trigger = triggerRef.current;
    if (!trigger) return;
    lightbox.register({ id, src, alt, caption, width, height, trigger });
    return () => lightbox.unregister(id);
  }, [lightbox, id, src, alt, caption, width, height]);
  if (!lightbox) throw new Error("LightboxImage must be used inside ImageLightboxProvider");

  return <button ref={triggerRef} type="button" data-lightbox-id={id} className={`lightbox-trigger ${className}`.trim()} aria-label={`Enlarge image: ${alt}`} onClick={(event) => lightbox.open({ id, src, alt, caption, width, height, trigger:event.currentTarget })}>
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority}/>
  </button>;
}
