/**
 * Pure member-context builders (no DB / auth) — unit-testable and client-safe.
 * `AreaRef.id` is a `UserArea` id (P4); since P7 there is no enum fallback.
 */
import type { ModuleFlags } from "@/lib/modules";
import { templateKeyForGuess } from "./legacy";
import { areaTemplateMeta, hubForFromDb } from "./templates";

export type HubKind = "research" | "language";

export interface AreaRef {
  /** UserArea id. Treat as opaque. */
  id: string;
  nameFa: string;
  nameEn: string;
  nameIsDefault: boolean;
  /** life | work | study | research | language | health | custom (hints only). */
  templateKey: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  archived: boolean;
  isDefault: boolean;
  hubFor: HubKind | null;
  /** Personal inbox project backing this area ("" only if the row is broken). */
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
};

/** Pure: map persisted UserArea rows into AreaRefs. */
export function buildAreaRefsFromRows(rows: UserAreaRow[]): AreaRef[] {
  const refs = rows.map((row): AreaRef => {
    const meta = areaTemplateMeta(row.templateKey);
    const nameFa = row.nameIsDefault && meta ? meta.nameFa : row.name;
    const nameEn = row.nameIsDefault && meta ? meta.nameEn : row.name;
    return {
      id: row.id,
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
      bucketProjectId: row.bucketProjectId ?? "",
    };
  });
  return refs.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function buildMemberContextFromRows(
  userId: string,
  flags: ModuleFlags,
  rows: UserAreaRow[],
): MemberContext {
  return memberContextFromRefs(userId, flags, buildAreaRefsFromRows(rows));
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

/**
 * Resolve a Capture area guess to one of the member's areas (docs/AREAS.md §15.3):
 * hub guesses prefer the `hubFor` area, otherwise the matching `templateKey`;
 * everything else falls back to the default area. Archived areas are skipped.
 */
export function areaRefForGuess<
  T extends Pick<AreaRef, "templateKey" | "hubFor" | "archived" | "isDefault">,
>(areas: readonly T[], guess: string | null | undefined): T | null {
  const active = areas.filter(a => !a.archived);
  const key = templateKeyForGuess(guess);
  const found =
    (key === "research" || key === "language"
      ? active.find(a => a.hubFor === key)
      : undefined) ?? active.find(a => a.templateKey === key);
  if (found) return found;
  return active.find(a => a.isDefault) ?? active[0] ?? null;
}

/** Area by template key (hub areas are matched by `hubFor` first). */
export function areaRefForTemplate<
  T extends Pick<AreaRef, "templateKey" | "hubFor" | "archived">,
>(areas: readonly T[], key: string): T | null {
  const byHub =
    key === "research" || key === "language"
      ? areas.find(a => a.hubFor === key)
      : undefined;
  return byHub ?? areas.find(a => a.templateKey === key) ?? null;
}
