"use client";

import * as React from "react";
import { Icon } from "@/components/ui-kit/foundation/icon";
import styles from "./auth-stage.module.css";

const STORAGE_KEY = "mindora-auth-theme";

function readDocumentTheme(): "light" | "dark" {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AuthThemeSwitch() {
  const [theme, setTheme] = React.useState<"light" | "dark">("dark");

  React.useEffect(() => {
    function applyStored() {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        document.documentElement.setAttribute("data-theme", stored);
        setTheme(stored);
        return true;
      }
      setTheme(readDocumentTheme());
      return false;
    }

    applyStored();
    // ThemeBoot may apply SYSTEM after us — re-assert guest auth preference.
    const t = window.setTimeout(applyStored, 0);
    return () => window.clearTimeout(t);
  }, []);

  const toggle = React.useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem(STORAGE_KEY, next);
    setTheme(next);
  }, [theme]);

  return (
    <button
      type="button"
      className={styles.dockBtn}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Light" : "Dark"}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    </button>
  );
}
