"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function ArticleSettingsDrawer({ open, onClose, children, drawerId }: { open: boolean; onClose: () => void; children: ReactNode; drawerId: string }) {
  const root = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const inerted: Array<{ element: HTMLElement; previous: boolean }> = [];
    let branch: HTMLElement | null = root.current;
    while (branch?.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          inerted.push({ element: sibling, previous: sibling.inert });
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
      if (branch === document.body) break;
    }
    document.body.style.overflow = "hidden";
    const focusable = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], summary, [tabindex="0"]') || []).filter((element) => element.getClientRects().length > 0);
    panel.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key !== "Tab") return;
      const elements = focusable();
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); panel.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) { event.preventDefault(); first.focus(); }
    };
    const keepFocus = (event: FocusEvent) => { if (event.target instanceof Node && !panel.current?.contains(event.target)) panel.current?.focus(); };
    const media = window.matchMedia("(min-width: 851px)");
    const resize = () => { if (media.matches) onClose(); };
    document.addEventListener("keydown", keydown);
    document.addEventListener("focusin", keepFocus);
    media.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", keydown);
      document.removeEventListener("focusin", keepFocus);
      media.removeEventListener("change", resize);
      document.body.style.overflow = previousOverflow;
      for (const item of inerted) item.element.inert = item.previous;
      previousFocus?.focus();
    };
  }, [onClose, open]);
  return <div id={drawerId} ref={root} className={`editor-settings-drawer ${open ? "is-open" : ""}`}>
    <div className="editor-drawer-backdrop" onClick={onClose} aria-hidden="true"/>
    <div ref={panel} className="editor-side-column" role={open ? "dialog" : undefined} aria-modal={open ? true : undefined} aria-labelledby={open ? id : undefined} tabIndex={open ? -1 : undefined}>
      <div className="editor-drawer-heading"><h2 id={id}>Article settings</h2><button type="button" onClick={onClose} aria-label="Close article settings"><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}
