/**
 * Area templates (docs/AREAS.md §9.1, §9.5). Pure / client-safe.
 *
 * Templates only suggest names; they never grant capabilities. P7 removed the
 * `LifeArea` enum, so these `templateKey`s (plus `UserArea.hubFor`) are the only
 * stable identity an area has besides its id.
 */
import type { HubKind } from "./member-context";

export type AreaTemplateKey =
  | "life"
  | "work"
  | "study"
  | "research"
  | "language"
  | "health"
  | "custom";

export type AreaTemplateMeta = {
  nameFa: string;
  nameEn: string;
  descriptionFa: string;
  descriptionEn: string;
};

/** Default names/descriptions for template-created areas (used while `nameIsDefault`). */
export const AREA_TEMPLATE_META: Partial<Record<AreaTemplateKey, AreaTemplateMeta>> = {
  research: {
    nameFa: "دکتری",
    nameEn: "PhD",
    descriptionFa: "تحصیل، پژوهش و نوشتن",
    descriptionEn: "Study, research and writing",
  },
  work: {
    nameFa: "کار",
    nameEn: "Work",
    descriptionFa: "شغل و کارهای حرفه‌ای",
    descriptionEn: "Job and professional projects",
  },
  life: {
    nameFa: "زندگی",
    nameEn: "Life",
    descriptionFa: "خانه، سلامت و امور شخصی",
    descriptionEn: "Home, health and personal matters",
  },
  language: {
    nameFa: "زبان",
    nameEn: "Language",
    descriptionFa: "مهارت‌ها، واژگان و آمادگی آزمون",
    descriptionEn: "Skills, vocab and exam prep",
  },
};

/** Meta for a template key (undefined for study/health/custom). */
export function areaTemplateMeta(
  key: string | null | undefined,
): AreaTemplateMeta | undefined {
  return key ? AREA_TEMPLATE_META[key as AreaTemplateKey] : undefined;
}

export type AreaTemplate = {
  templateKey: AreaTemplateKey;
  nameFa: string;
  nameEn: string;
  hubFor: HubKind | null;
  isDefault: boolean;
  sortOrder: number;
};

/** The four areas every member is seeded with, in display order. */
export const SEED_AREA_TEMPLATES: readonly AreaTemplate[] = [
  {
    templateKey: "life",
    nameFa: AREA_TEMPLATE_META.life!.nameFa,
    nameEn: AREA_TEMPLATE_META.life!.nameEn,
    hubFor: null,
    isDefault: true,
    sortOrder: 0,
  },
  {
    templateKey: "work",
    nameFa: AREA_TEMPLATE_META.work!.nameFa,
    nameEn: AREA_TEMPLATE_META.work!.nameEn,
    hubFor: null,
    isDefault: false,
    sortOrder: 1,
  },
  {
    templateKey: "research",
    nameFa: AREA_TEMPLATE_META.research!.nameFa,
    nameEn: AREA_TEMPLATE_META.research!.nameEn,
    hubFor: "research",
    isDefault: false,
    sortOrder: 2,
  },
  {
    templateKey: "language",
    nameFa: AREA_TEMPLATE_META.language!.nameFa,
    nameEn: AREA_TEMPLATE_META.language!.nameEn,
    hubFor: "language",
    isDefault: false,
    sortOrder: 3,
  },
] as const;

export function hubForToDb(
  hub: HubKind | null,
): "RESEARCH" | "LANGUAGE" | null {
  if (hub === "research") return "RESEARCH";
  if (hub === "language") return "LANGUAGE";
  return null;
}

export function hubForFromDb(
  hub: "RESEARCH" | "LANGUAGE" | null | undefined,
): HubKind | null {
  if (hub === "RESEARCH") return "research";
  if (hub === "LANGUAGE") return "language";
  return null;
}
