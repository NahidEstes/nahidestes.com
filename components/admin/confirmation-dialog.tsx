"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export function ConfirmationDialog({ open, title, description, confirmLabel, confirmationText, busy = false, onConfirm, onClose }: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmationText?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const [typed, setTyped] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => { setTyped(""); onClose(); }, [onClose]);
  const confirm = () => { setTyped(""); onConfirm(); };
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => cancelRef.current?.focus(), 0);
    const keydown = (event: KeyboardEvent) => { if (event.key === "Escape" && !busy) close(); };
    document.addEventListener("keydown", keydown);
    return () => { document.removeEventListener("keydown", keydown); document.body.style.overflow = priorOverflow; previous?.focus(); };
  }, [open, busy, close]);
  if (!open) return null;
  const disabled = busy || Boolean(confirmationText && typed !== confirmationText);
  return <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) close(); }}><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" aria-describedby="confirmation-description"><button className="dialog-close" type="button" onClick={close} disabled={busy} aria-label="Close dialog"><X size={18}/></button><h2 id="confirmation-title">{title}</h2><p id="confirmation-description">{description}</p>{confirmationText && <div className="field"><label htmlFor="confirmation-text">Type “{confirmationText}” to confirm</label><input id="confirmation-text" value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off"/></div>}<div className="dialog-actions"><button ref={cancelRef} type="button" className="button" onClick={close} disabled={busy}>Cancel</button><button type="button" className="button danger" onClick={confirm} disabled={disabled}>{busy ? "Working…" : confirmLabel}</button></div></section></div>;
}
