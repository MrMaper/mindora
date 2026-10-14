/**
 * Pure member-context builders (no DB / auth) — unit-testable and client-safe.
 * P4: AreaRef.id is a UserArea id when backed by rows; legacy fallback still
 * uses the enum string as id so pre-backfill members keep working.
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
import { hubForFromDb } from "./templates";

export type HubKind = "research" | "language";

export interface AreaRef {
  /** UserArea id after backfill; legacy enum string before. Treat as opaque. */
  id: string;
  /** Old PHD/WORK/LIFE/LANG when this row was seeded from the enum. */
  legacyEnum: LifeArea | null;
  nameFa: string;
  nameEn: string;
  nameIsDefault: boolean;
  templateKey: string | null;
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

/** Row shape loaded from `user_areas` (server). */
export type UserAreaRow = {
  id: string;
  name: string;
  nameIsDefault: boolean;
  templateKey: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  archived: boolean;
  isDefault: boolean;
  hubFor: "RESEARCH" | "LANGUAGE" | null;
  bucketProjectId: string | null;
  legacyEnum: LifeArea | null;
};

function hubKindOf(area: LifeArea): HubKind | null {
  if (area === RESEARCH_AREA) return "research";
  if (area === LANGUAGE_AREA) return "language";
  return null;
}

/** Pure: merge enum defaults with stored preferences (pre-backfill fallback). */
export function buildAreaRefs(userId: string, prefs: PrefRow[]): AreaRef[] {
  const byArea = new Map(prefs.map(p => [p.area, p]));
  const refs = LIFE_AREAS.map((area, index): AreaRef => {
    const pref = byArea.get(area);
    const meta = AREA_META[area];
    return {
      id: area,
      legacyEnum: area,
      nameFa: meta.nameFa,
      nameEn: meta.nameEn,
      nameIsDefault: true,
      templateKey: null,
      color: pref?.color ?? null,
      icon: pref?.icon ?? null,
      sortOrder: pref?.sortOrder ?? index,
      archived: pref?.archived ?? false,
      isDefault: area === DEFAULT_AREA,
      hubFor: hubKindOf(area),
      bucketProjectId: personalAreaProjectId(userId, area),
    };
  });
  return refs.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Pure: map persisted UserArea rows into AreaRefs. */
export function buildAreaRefsFromRows(
  userId: string,
  rows: UserAreaRow[],
): AreaRef[] {
  const refs = rows.map((row): AreaRef => {
    const legacy = row.legacyEnum;
    const meta = legacy ? AREA_META[legacy] : null;
    const nameFa = row.nameIsDefault && meta ? meta.nameFa : row.name;
    const nameEn = row.nameIsDefault && meta ? meta.nameEn : row.name;
    return {
      id: row.id,
      legacyEnum: legacy,
      nameFa,
      nameEn,
      nameIsDefault: row.nameIsDefault,
      templateKey: row.templateKey,
      color: row.color,
      icon: row.icon,
      sortOrder: row.sortOrder,
      archived: row.archived,
      isDefault: row.isDefault,
      hubFor: hubForFromDb(row.hubFor),
      bucketProjectId:
        row.bucketProjectId ??
        (legacy ? personalAreaProjectId(userId, legacy) : ""),
    };
  });
  return refs.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function buildMemberContext(
  userId: string,
  flags: ModuleFlags,
  prefs: PrefRow[],
): MemberContext {
  return memberContextFromRefs(userId, flags, buildAreaRefs(userId, prefs));
}

export function buildMemberContextFromRows(
  userId: string,
  flags: ModuleFlags,
  rows: UserAreaRow[],
): MemberContext {
  return memberContextFromRefs(
    userId,
    flags,
    buildAreaRefsFromRows(userId, rows),
  );
}

function memberContextFromRefs(
  userId: string,
  flags: ModuleFlags,
  areas: AreaRef[],
): MemberContext {
  const defaultArea =
    areas.find(a => a.isDefault && !a.archived) ??
    areas.find(a => !a.archived) ??
    areas[0]!;
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
