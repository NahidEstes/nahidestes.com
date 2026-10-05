"use client";

import { AdminDashboard } from "./admin-dashboard";
import { AdminShell } from "./admin-shell";
import { AuxiliaryList } from "./auxiliary-list";
import { CategoryPanel } from "./category-panel";
import { ContentForm, type DefaultAuthor } from "./content-form";
import { ContentList } from "./content-list";
import { CommentsManager } from "./comments-manager";
import { SettingsPanel } from "./settings-panel";
import { ScheduledContent } from "./scheduled-content";
import { TrashView } from "./trash-view";
import { editableCollections, type AdminRole } from "./admin-types";
import type { ContentCollection } from "@/types/content";

export function AdminApp({ segments, role, defaultAuthor }: { segments: string[]; role: AdminRole; defaultAuthor: DefaultAuthor }) {
  const section = segments[0] || "dashboard";
  const detail = segments[1];
  const mode = detail === "new" ? "new" : segments[2] === "edit" ? "edit" : "list";
  let content: React.ReactNode;
  if (section === "dashboard") content = <AdminDashboard role={role}/>;
  else if (section === "scheduled") content = <ScheduledContent/>;
  else if (section === "comments") content = <CommentsManager role={role}/>;
  else if (section === "trash" && role === "admin") content = <TrashView/>;
  else if (section === "settings" && role === "admin") content = <SettingsPanel/>;
  else if (section === "categories" && role === "admin") content = <CategoryPanel/>;
  else if ((section === "subscribers" || section === "messages") && role === "admin") content = <AuxiliaryList section={section}/>;
  else if (editableCollections.includes(section as ContentCollection)) content = mode === "list" ? <ContentList collection={section as ContentCollection} role={role}/> : <ContentForm key={`${section}:${detail}`} collection={section as ContentCollection} id={mode === "edit" ? detail : undefined} role={role} defaultAuthor={defaultAuthor}/>;
  else content = <div className="admin-panel"><h1>Not available</h1><p>This section does not exist or your role cannot access it.</p></div>;
  return <AdminShell section={section} role={role}>{content}</AdminShell>;
}
