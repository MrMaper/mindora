"use client";

import { useLayoutEffect } from "react";
import { applyThemeToDocument } from "@/lib/theme";
import type { Theme } from "@/types/db";

/** Apply saved theme after mount (SYSTEM needs matchMedia; no inline script). */
export function ThemeBoot({ theme }: { theme: Theme }) {
  useLayoutEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);
  return null;
}
