"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { BookOpen, CalendarClock, Camera, FolderKanban, LayoutDashboard, LogOut, Mail, Map, MessageSquare, Settings, Tags, Trash2, Users } from "lucide-react";
import { apiRequest } from "./admin-types";
import type { AdminRole } from "./admin-types";

const contentNavigation = [
  ["Dashboard", "/admin", "dashboard", LayoutDashboard],
  ["Posts", "/admin/posts", "posts", BookOpen],
  ["Projects", "/admin/projects", "projects", FolderKanban],
  ["Photography", "/admin/photography", "photography", Camera],
  ["Places & Culture", "/admin/places", "places", Map],
  ["Comments", "/admin/comments", "comments", MessageSquare],
  ["Scheduled", "/admin/scheduled", "scheduled", CalendarClock],
] as const;
const adminNavigation = [
  ["Categories", "/admin/categories", "categories", Tags],
  ["Subscribers", "/admin/subscribers", "subscribers", Users],
  ["Messages", "/admin/messages", "messages", Mail],
  ["Trash", "/admin/trash", "trash", Trash2],
  ["Settings", "/admin/settings", "settings", Settings],
] as const;

export function AdminSidebar({ section, role }: { section: string; role: AdminRole }) {
  const navigation = role === "admin" ? [...contentNavigation, ...adminNavigation] : contentNavigation;
  const [pendingComments, setPendingComments] = useState(0);
  useEffect(() => { void apiRequest<{ statusCounts: { pending: number } }>("/api/admin/comments?status=pending&limit=1").then((result) => { if (result.ok) setPendingComments(result.data.statusCounts.pending); }); }, []);
  return <aside className="admin-sidebar"><Link className="brand" href="/">NAHID ESTES</Link><nav className="admin-nav" aria-label="Admin navigation">{navigation.map(([label, href, key, Icon]) => <Link key={href} href={href} className={section === key ? "active" : ""}><Icon size={17}/>{label}{key === "comments" && pendingComments > 0 && <span className="admin-nav-count" aria-label={`${pendingComments} pending comments`}>{pendingComments > 99 ? "99+" : pendingComments}</span>}</Link>)}</nav><div className="admin-nav logout"><button type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}><LogOut size={17}/>Logout</button></div></aside>;
}
