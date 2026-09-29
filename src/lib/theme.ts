import type { Theme } from "@/types/db";

/** Resolve DB theme preference to a concrete `data-theme` value. */
export function resolveThemeAttr(
  theme: Theme | null | undefined,
  prefersDark = false,
): "light" | "dark" {
  if (theme === "DARK") return "dark";
  if (theme === "LIGHT") return "light";
  return prefersDark ? "dark" : "light";
}

/**
 * Blocking boot script: applies saved theme before paint so SYSTEM / DARK
 * users do not flash light, and visiting Settings never "suddenly" flips theme.
 */
export function themeBootScript(theme: Theme | null | undefined): string {
  const pref = theme ?? "SYSTEM";
  return `(function(){try{var p=${JSON.stringify(pref)};var d=p==="DARK"?"dark":p==="LIGHT"?"light":(window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",d);}catch(e){}})();`;
}

export function applyThemeToDocument(theme: Theme): void {
  if (typeof window === "undefined") return;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute(
    "data-theme",
    resolveThemeAttr(theme, prefersDark),
  );
}
