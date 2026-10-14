/**
 * Seed templates for the four legacy areas (docs/AREAS.md §9.5).
 * Pure / client-safe.
 */
import type { LifeArea } from "@/types/db";
import {
  AREA_META,
  DEFAULT_AREA,
  LANGUAGE_AREA,
  RESEARCH_AREA,
  WORK_AREA,
} from "./legacy";
import type { HubKind } from "./member-context";

export type AreaTemplateKey =
  | "life"
  | "work"
  | "study"
  | "research"
  | "language"
  | "health"
  | "custom";

export type AreaTemplate = {
  legacyEnum: LifeArea;
  templateKey: AreaTemplateKey;
  nameFa: string;
  nameEn: string;
  hubFor: HubKind | null;
  isDefault: boolean;
  sortOrder: number;
};

/** One template per legacy enum, in display order. */
export const LEGACY_AREA_TEMPLATES: readonly AreaTemplate[] = [
  {
    legacyEnum: DEFAULT_AREA,
    templateKey: "life",
    nameFa: AREA_META.LIFE.nameFa,
    nameEn: AREA_META.LIFE.nameEn,
    hubFor: null,
    isDefault: true,
    sortOrder: 0,
  },
  {
    legacyEnum: WORK_AREA,
    templateKey: "work",
    nameFa: AREA_META.WORK.nameFa,
    nameEn: AREA_META.WORK.nameEn,
    hubFor: null,
    isDefault: false,
    sortOrder: 1,
  },
  {
    legacyEnum: RESEARCH_AREA,
    templateKey: "research",
    nameFa: AREA_META.PHD.nameFa,
    nameEn: AREA_META.PHD.nameEn,
    hubFor: "research",
    isDefault: false,
    sortOrder: 2,
  },
  {
    legacyEnum: LANGUAGE_AREA,
    templateKey: "language",
    nameFa: AREA_META.LANG.nameFa,
    nameEn: AREA_META.LANG.nameEn,
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
