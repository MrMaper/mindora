/**
 * Display helpers for AreaRef (pure / client-safe).
 */
import type { AreaRef } from "./member-context";

export function areaDisplayName(
  area: Pick<AreaRef, "nameFa" | "nameEn" | "nameIsDefault"> & {
    name?: string;
  },
  language: "FA" | "EN" = "FA",
): string {
  if (language === "EN") return area.nameEn || area.nameFa;
  return area.nameFa || area.nameEn;
}

/** Href for an area dashboard. Prefers opaque UserArea id. */
export function areaDashboardHref(areaId: string): string {
  return `/projects/areas/${areaId}`;
}

/** Max active (non-archived) areas per member (docs/AREAS.md §9.1). */
export const MAX_ACTIVE_AREAS = 8;
