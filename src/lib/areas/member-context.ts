/**
 * Pure member-context builders (no DB / auth) — unit-testable and client-safe.
 * P1: backed by the legacy enum; P4 swaps the store.
 */
import type { LifeArea } from "@/types/db";
import type { ModuleFlags } from "@/lib/modules";
import { personalAreaProjectId } from "./buckets";
import {
  AREA_META,
  DEFAULT_AREA,
  LANGUAGE_AREA,
  LIFE_AREAS,
  RESEARCH_AREA,
} from "./legacy";

export type HubKind = "research" | "language";

export interface AreaRef {
  /** Enum value today; becomes a UserArea id after P4. Treat as opaque. */
  id: LifeArea;
  nameFa: string;
  nameEn: string;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  archived: boolean;
  isDefault: boolean;
  hubFor: HubKind | null;
  /** Personal inbox project backing this area. */
  bucketProjectId: string;
}

export interface MemberContext {
  userId: string;
  flags: ModuleFlags;
  /** Active + archived, in display order. */
  areas: AreaRef[];
  defaultArea: AreaRef;
  hubAreas: Record<HubKind, AreaRef | null>;
}

export type PrefRow = {
  area: LifeArea;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  archived: boolean;
};

function hubKindOf(area: LifeArea): HubKind | null {
  if (area === RESEARCH_AREA) return "research";
  if (area === LANGUAGE_AREA) return "language";
  return null;
}

/** Pure: merge enum defaults with stored preferences. */
export function buildAreaRefs(userId: string, prefs: PrefRow[]): AreaRef[] {
  const byArea = new Map(prefs.map(p => [p.area, p]));
  const refs = LIFE_AREAS.map((area, index): AreaRef => {
    const pref = byArea.get(area);
    const meta = AREA_META[area];
    return {
      id: area,
      nameFa: meta.nameFa,
      nameEn: meta.nameEn,
      color: pref?.color ?? null,
      icon: pref?.icon ?? null,
      sortOrder: pref?.sortOrder ?? index,
      archived: pref?.archived ?? false,
      isDefault: area === DEFAULT_AREA,
      hubFor: hubKindOf(area),
      bucketProjectId: personalAreaProjectId(userId, area),
    };
  });
  // Stable: sortOrder, then enum order (Array#sort is stable).
  return refs.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function buildMemberContext(
  userId: string,
  flags: ModuleFlags,
  prefs: PrefRow[],
): MemberContext {
  const areas = buildAreaRefs(userId, prefs);
  const defaultArea = areas.find(a => a.isDefault) ?? areas[0]!;
  return {
    userId,
    flags,
    areas,
    defaultArea,
    hubAreas: {
      research: areas.find(a => a.hubFor === "research") ?? null,
      language: areas.find(a => a.hubFor === "language") ?? null,
    },
  };
}
