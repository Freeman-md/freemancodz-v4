"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "@/app/_config/theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  function syncPreference(event: StorageEvent) {
    if (event.key === THEME_STORAGE_KEY || event.key === null) {
      document.documentElement.dataset.theme = event.newValue === "dark" ? "dark" : "light";
    }
  }

  window.addEventListener("storage", syncPreference);

  return () => {
    observer.disconnect();
    window.removeEventListener("storage", syncPreference);
  };
}

function getSnapshot() {
  return document.documentElement.dataset.theme === "dark";
}

function getServerSnapshot() {
  return false;
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggleTheme() {
    const theme = isDark ? "light" : "dark";

    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Switching still works when a browser blocks preference storage.
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-label="Dark mode"
      aria-checked={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="site-theme-toggle"
      onClick={toggleTheme}
    >
      <Moon aria-hidden="true" size={18} strokeWidth={1.5} className="theme-moon" />
      <Sun aria-hidden="true" size={18} strokeWidth={1.5} className="theme-sun" />
    </button>
  );
}
