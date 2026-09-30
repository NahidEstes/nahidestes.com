"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";

type Toast = { id: string; message: string; tone: "success" | "error" };
const ToastContext = createContext<{ notify: (message: string, tone?: Toast["tone"]) => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = typeof globalThis.crypto?.randomUUID === "function" ? globalThis.crypto.randomUUID() : `toast-${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => remove(id), 5000);
  }, [remove]);
  const value = useMemo(() => ({ notify }), [notify]);
  return <ToastContext.Provider value={value}>{children}<div className="toast-region" aria-live="polite" aria-atomic="false">{toasts.map((toast) => <div className={`admin-toast ${toast.tone}`} key={toast.id} role="status">{toast.tone === "success" ? <CheckCircle2 size={18}/> : <CircleAlert size={18}/>}<span>{toast.message}</span><button type="button" onClick={() => remove(toast.id)} aria-label="Dismiss notification"><X size={16}/></button></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context;
}
