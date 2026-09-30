"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "nahid-theme";
const CHANGE_EVENT = "nahid-theme-change";

function getTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(CHANGE_EVENT, onStoreChange);
}

function applyTheme(theme: Theme, persist = false) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (persist) localStorage.setItem(STORAGE_KEY, theme);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function ThemeController() {
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = (event: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) applyTheme(event.matches ? "dark" : "light");
    };
    const syncAcrossTabs = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const stored = event.newValue;
      applyTheme(stored === "dark" || stored === "light" ? stored : media.matches ? "dark" : "light");
    };
    media.addEventListener("change", followSystem);
    window.addEventListener("storage", syncAcrossTabs);
    return () => {
      media.removeEventListener("change", followSystem);
      window.removeEventListener("storage", syncAcrossTabs);
    };
  }, []);
  return null;
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, getTheme, () => "light");
  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  return <button
    type="button"
    className={`theme-toggle ${className}`.trim()}
    aria-label={`Switch to ${nextTheme} mode`}
    title={`Switch to ${nextTheme} mode`}
    onClick={() => applyTheme(nextTheme, true)}
  >
    <Moon className="theme-icon theme-icon-moon" size={18}/>
    <Sun className="theme-icon theme-icon-sun" size={18}/>
  </button>;
}
