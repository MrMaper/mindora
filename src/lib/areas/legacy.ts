/**
 * Legacy area identity (enum-backed). This is the ONLY place outside Prisma
 * migrations / backfill scripts where the `PHD | WORK | LIFE | LANG` literals
 * may appear. See docs/AREAS.md §13.
 *
 * P4 replaces the enum with per-user `UserArea` rows; callers must go through
 * `@/lib/areas` so that swap stays local to this directory.
 */
import type { LifeArea } from "@/types/db";

export const LIFE_AREAS: LifeArea[] = ["PHD", "WORK", "LIFE", "LANG"];

/** Area used when a task/project has none. */
export const DEFAULT_AREA = "LIFE" as const satisfies LifeArea;

/** Hub identities: Research and Language are bound to these areas today. */
export const RESEARCH_AREA = "PHD" as const satisfies LifeArea;
export const LANGUAGE_AREA = "LANG" as const satisfies LifeArea;

export const WORK_AREA = "WORK" as const satisfies LifeArea;

/** Canonical display order (index per area). */
export const AREA_ORDER: Record<LifeArea, number> = Object.fromEntries(
  LIFE_AREAS.map((a, i) => [a, i]),
) as Record<LifeArea, number>;

/** A zeroed counter per area, e.g. for open-task tallies. */
export function emptyAreaCounts(): Record<LifeArea, number> {
  return Object.fromEntries(LIFE_AREAS.map(a => [a, 0])) as Record<LifeArea, number>;
}

export const HUB_AREAS: LifeArea[] = [RESEARCH_AREA, LANGUAGE_AREA];
export const WORKSPACE_AREAS: LifeArea[] = ["WORK", "LIFE"];

export function isLifeAreaValue(
  value: string | null | undefined,
): value is LifeArea {
  return !!value && (LIFE_AREAS as string[]).includes(value);
}

export function coerceLifeArea(area: string | null | undefined): LifeArea {
  return isLifeAreaValue(area) ? area : DEFAULT_AREA;
}

export const AREA_META: Record<
  LifeArea,
  { nameFa: string; nameEn: string; descriptionFa: string; descriptionEn: string }
> = {
  PHD: {
    nameFa: "دکتری",
    nameEn: "PhD",
    descriptionFa: "تحصیل، پژوهش و نوشتن",
    descriptionEn: "Study, research and writing",
  },
  WORK: {
    nameFa: "کار",
    nameEn: "Work",
    descriptionFa: "شغل و کارهای حرفه‌ای",
    descriptionEn: "Job and professional projects",
  },
  LIFE: {
    nameFa: "زندگی",
    nameEn: "Life",
    descriptionFa: "خانه، سلامت و امور شخصی",
    descriptionEn: "Home, health and personal matters",
  },
  LANG: {
    nameFa: "زبان",
    nameEn: "Language",
    descriptionFa: "مهارت‌ها، واژگان و آمادگی آزمون",
    descriptionEn: "Skills, vocab and exam prep",
  },
};

/** Legacy shared bucket IDs (pre multi-tenant workspace). */
export const LEGACY_AREA_PROJECT_IDS = {
  PHD: "area-phd",
  WORK: "area-work",
  LIFE: "area-life",
  LANG: "area-lang",
} as const satisfies Record<LifeArea, string>;
