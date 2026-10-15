/**
 * Display helpers for AreaRef (pure / client-safe).
 */
import type { AreaRef } from "./member-context";
import { areaTemplateMeta } from "./templates";

export function areaDisplayName(
  area: Pick<AreaRef, "nameFa" | "nameEn" | "nameIsDefault"> & {
    name?: string;
  },
  language: "FA" | "EN" = "FA",
): string {
  if (language === "EN") return area.nameEn || area.nameFa;
  return area.nameFa || area.nameEn;
}

/**
 * One-line slogan under the area title on hub cards / dashboards.
 * Prefer the member’s stored bucket description; fall back to localized
 * template meta for seeded defaults that still use `nameIsDefault`.
 */
export function areaTagline(
  area: {
    templateKey?: string | null;
    nameIsDefault?: boolean;
  },
  bucketDescription: string | null | undefined,
  language: "FA" | "EN" = "FA",
): string | null {
  const stored = bucketDescription?.trim() || null;
  if (stored) {
    if (area.nameIsDefault) {
      const meta = areaTemplateMeta(area.templateKey);
      if (
        meta &&
        (stored === meta.descriptionFa || stored === meta.descriptionEn)
      ) {
        return language === "EN" ? meta.descriptionEn : meta.descriptionFa;
      }
    }
    return stored;
  }
  if (area.nameIsDefault) {
    const meta = areaTemplateMeta(area.templateKey);
    if (meta) {
      return language === "EN" ? meta.descriptionEn : meta.descriptionFa;
    }
  }
  return null;
}

/** Href for an area dashboard. Prefers opaque UserArea id. */
export function areaDashboardHref(areaId: string): string {
  return `/projects/areas/${areaId}`;
}

/** Max active (non-archived) areas per member (docs/AREAS.md §9.1). */
export const MAX_ACTIVE_AREAS = 8;
