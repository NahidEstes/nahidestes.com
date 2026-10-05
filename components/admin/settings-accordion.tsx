"use client";

import { useId, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function SettingsAccordion({ title, summary, open, onToggle, errorCount = 0, children }: {
  title: string;
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  errorCount?: number;
  children: ReactNode;
}) {
  const id = useId();
  return <section className={`settings-accordion ${open ? "is-open" : ""}`}>
    <h2><button type="button" id={`${id}-heading`} aria-expanded={open} aria-controls={`${id}-body`} onClick={onToggle}>
      <span className="settings-accordion-label"><span>{title}</span><span className="settings-summary">{summary}</span></span>
      {errorCount > 0 && <span className="settings-error-badge" aria-label={`${errorCount} validation errors`}>{errorCount}</span>}
      <ChevronDown size={17} aria-hidden="true"/>
    </button></h2>
    <div id={`${id}-body`} role="region" aria-labelledby={`${id}-heading`} hidden={!open} className="settings-accordion-body">{children}</div>
  </section>;
}
