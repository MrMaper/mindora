/**
 * Server helpers that resolve "which area?" to a `UserArea.id` for writes.
 * Replaces the P4–P6 dual-write layer (docs/AREAS.md §18.3).
 */
import { prisma as db } from "@/lib/db";
import { areaRefForGuess, areaRefForTemplate } from "./member-context";

type AreaLookupRow = {
  id: string;
  templateKey: string | null;
  hubFor: "RESEARCH" | "LANGUAGE" | null;
  archived: boolean;
  isDefault: boolean;
};

async function loadAreaRows(userId: string): Promise<AreaLookupRow[]> {
  const rows = await db.userArea.findMany({
    where: { userId },
    select: {
      id: true,
      templateKey: true,
      hubFor: true,
      archived: true,
      isDefault: true,
    },
    orderBy: { sortOrder: "asc" },
  });
  if (rows.length > 0) return rows;
  const { ensurePersonalWorkspace } = await import("./ensure");
  await ensurePersonalWorkspace(userId);
  return db.userArea.findMany({
    where: { userId },
    select: {
      id: true,
      templateKey: true,
      hubFor: true,
      archived: true,
      isDefault: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

function asRefLike(rows: AreaLookupRow[]) {
  return rows.map(r => ({
    id: r.id,
    templateKey: r.templateKey,
    hubFor:
      r.hubFor === "RESEARCH"
        ? ("research" as const)
        : r.hubFor === "LANGUAGE"
          ? ("language" as const)
          : null,
    archived: r.archived,
    isDefault: r.isDefault,
  }));
}

/** The member's default (active) area id. */
export async function defaultAreaId(userId: string): Promise<string> {
  const rows = await loadAreaRows(userId);
  const def = rows.find(r => r.isDefault && !r.archived) ?? rows.find(r => !r.archived) ?? rows[0];
  if (!def) throw new Error(`member ${userId} has no areas`);
  return def.id;
}

/** Resolve a Capture guess (`PHD|WORK|LIFE|LANG`) to the member's area id. */
export async function areaIdForGuess(
  userId: string,
  guess: string | null | undefined,
): Promise<string> {
  const refs = asRefLike(await loadAreaRows(userId));
  const found = areaRefForGuess(refs, guess);
  if (found) return found.id;
  return defaultAreaId(userId);
}

/** Resolve a template key to the member's area id (hub areas by `hubFor`), or null. */
export async function areaIdForTemplate(
  userId: string,
  templateKey: string,
): Promise<string | null> {
  const refs = asRefLike(await loadAreaRows(userId));
  return areaRefForTemplate(refs, templateKey)?.id ?? null;
}

/** True when `areaId` is one of this member's areas. */
export async function isMemberArea(
  userId: string,
  areaId: string | null | undefined,
): Promise<boolean> {
  if (!areaId) return false;
  const n = await db.userArea.count({ where: { id: areaId, userId } });
  return n > 0;
}

/**
 * Pick the area id for a write: an explicit `areaId` the member owns, else a
 * Capture/legacy `guess`, else the default area.
 */
export async function resolveMemberAreaId(
  userId: string,
  opts: { areaId?: string | null; guess?: string | null } = {},
): Promise<string> {
  if (opts.areaId && (await isMemberArea(userId, opts.areaId))) return opts.areaId;
  if (opts.guess) return areaIdForGuess(userId, opts.guess);
  return defaultAreaId(userId);
}
