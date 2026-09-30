"use client";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AdminSidebar } from "./admin-sidebar";
import { ToastProvider } from "./toast-provider";
import type { AdminRole } from "./admin-types";

export function AdminShell({ section, role, children }: { section: string; role: AdminRole; children: React.ReactNode }) {
  return <ToastProvider><div className="admin-body"><div className="admin-shell"><AdminSidebar section={section} role={role}/><main className="admin-main"><div className="admin-utility-bar"><span className="role-badge">{role}</span><ThemeToggle/></div>{children}</main></div></div></ToastProvider>;
}
