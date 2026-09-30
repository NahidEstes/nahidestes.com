"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type Preview = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  trigger: HTMLButtonElement;
};

const LightboxContext = createContext<{ open: (preview: Preview) => void } | null>(null);

export function ImageLightboxProvider({ children }: { children: React.ReactNode }) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    const trigger = preview?.trigger;
    setPreview(null);
    requestAnimationFrame(() => trigger?.focus());
  }, [preview]);

  useEffect(() => {
    if (!preview) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [preview, close]);

  return <LightboxContext.Provider value={{ open: setPreview }}>
    {children}
    {preview && <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`Image preview: ${preview.alt}`} onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <button ref={closeButtonRef} type="button" className="image-lightbox-close" aria-label="Close image preview" onClick={close}><X size={25}/></button>
      <figure className="image-lightbox-figure" onMouseDown={(event) => event.stopPropagation()}>
        <Image src={preview.src} alt={preview.alt} width={preview.width} height={preview.height} sizes="92vw" priority/>
        {preview.caption && <figcaption>{preview.caption}</figcaption>}
      </figure>
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
  if (!lightbox) throw new Error("LightboxImage must be used inside ImageLightboxProvider");

  return <button type="button" className={`lightbox-trigger ${className}`.trim()} aria-label={`Enlarge image: ${alt}`} onClick={(event) => lightbox.open({ src, alt, caption, width, height, trigger:event.currentTarget })}>
    <Image src={src} alt={alt} fill sizes={sizes} priority={priority}/>
  </button>;
}
