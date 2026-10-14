/**
 * Dual-write helpers for the P4–P7 window (docs/AREAS.md §18.3).
 * Writes set both the legacy enum column and `areaId`.
 */
import { prisma as db } from "@/lib/db";
import type { LifeArea } from "@/types/db";
import { coerceLifeArea, isLifeAreaValue } from "./legacy";

type Cache = Map<LifeArea, string>;
const areaIdCache = new Map<string, Cache>();

/** Drop cached ids for a member (after ensure / backfill). */
export function clearAreaIdCache(userId?: string) {
  if (userId) areaIdCache.delete(userId);
  else areaIdCache.clear();
}

/** Resolve the UserArea id for a member's legacy enum area. */
export async function areaIdForLegacy(
  userId: string,
  area: LifeArea,
): Promise<string | null> {
  let cache = areaIdCache.get(userId);
  if (!cache) {
    const rows = await db.userArea.findMany({
      where: { userId, legacyEnum: { not: null } },
      select: { id: true, legacyEnum: true },
    });
    cache = new Map();
    for (const row of rows) {
      if (row.legacyEnum) cache.set(row.legacyEnum, row.id);
    }
    areaIdCache.set(userId, cache);
  }
  return cache.get(area) ?? null;
}

/**
 * Fields to spread into a create/update that still writes the enum.
 * Returns `{}` when area is absent so callers can spread safely.
 */
export async function dualAreaFields(
  userId: string,
  area: LifeArea | string | null | undefined,
): Promise<{ area: LifeArea; areaId: string | null } | { area: null; areaId: null } | Record<string, never>> {
  if (area == null || area === "") {
    return { area: null, areaId: null };
  }
  const legacy = isLifeAreaValue(area) ? area : coerceLifeArea(area);
  const areaId = await areaIdForLegacy(userId, legacy);
  return { area: legacy, areaId };
}

/** Like dualAreaFields but only when we know a non-null area is required. */
export async function dualAreaRequired(
  userId: string,
  area: LifeArea | string | null | undefined,
): Promise<{ area: LifeArea; areaId: string | null }> {
  const legacy = coerceLifeArea(area);
  return {
    area: legacy,
    areaId: await areaIdForLegacy(userId, legacy),
  };
}
