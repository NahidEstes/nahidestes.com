"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { BookOpen, Camera, FolderKanban, LayoutDashboard, LogOut, Mail, Map, Settings, Tags, Trash2, Users } from "lucide-react";
import type { AdminRole } from "./admin-types";

const contentNavigation = [
  ["Dashboard", "/admin", "dashboard", LayoutDashboard],
  ["Posts", "/admin/posts", "posts", BookOpen],
  ["Projects", "/admin/projects", "projects", FolderKanban],
  ["Photography", "/admin/photography", "photography", Camera],
  ["Places & Culture", "/admin/places", "places", Map],
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
  return <aside className="admin-sidebar"><Link className="brand" href="/">NAHID ESTES</Link><nav className="admin-nav" aria-label="Admin navigation">{navigation.map(([label, href, key, Icon]) => <Link key={href} href={href} className={section === key ? "active" : ""}><Icon size={17}/>{label}</Link>)}</nav><div className="admin-nav logout"><button type="button" onClick={() => signOut({ callbackUrl: "/admin/login" })}><LogOut size={17}/>Logout</button></div></aside>;
}
