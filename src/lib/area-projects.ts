import type { LifeArea } from "@/types/db";
import { LIFE_AREAS } from "@/lib/life";

/** Legacy shared bucket IDs (pre multi-tenant workspace). */
export const LEGACY_AREA_PROJECT_IDS = {
  PHD: "area-phd",
  WORK: "area-work",
  LIFE: "area-life",
  LANG: "area-lang",
} as const;

/** @deprecated Use personalAreaProjectId(userId, area) — kept for legacy ID detection. */
export const AREA_PROJECT_IDS = LEGACY_AREA_PROJECT_IDS;

const LEGACY_SET = new Set<string>(Object.values(LEGACY_AREA_PROJECT_IDS));

const BUCKET_RE = /^area-(phd|work|life|lang)-(.+)$/i;

export function personalAreaProjectId(userId: string, area: LifeArea): string {
  return `area-${area.toLowerCase()}-${userId}`;
}

export function areaProjectIdsForUser(
  userId: string,
): Record<LifeArea, string> {
  return {
    PHD: personalAreaProjectId(userId, "PHD"),
    WORK: personalAreaProjectId(userId, "WORK"),
    LIFE: personalAreaProjectId(userId, "LIFE"),
    LANG: personalAreaProjectId(userId, "LANG"),
  };
}

export function isAreaBucketId(id: string | null | undefined): boolean {
  if (!id) return false;
  if (LEGACY_SET.has(id)) return true;
  return BUCKET_RE.test(id);
}

export function lifeAreaFromBucketId(id: string): LifeArea | null {
  const legacy = (Object.entries(LEGACY_AREA_PROJECT_IDS) as [LifeArea, string][])
    .find(([, v]) => v === id);
  if (legacy) return legacy[0];
  const m = BUCKET_RE.exec(id);
  if (!m) return null;
  const area = m[1]!.toUpperCase() as LifeArea;
  return LIFE_AREAS.includes(area) ? area : null;
}

export function allLegacyBucketIds(): string[] {
  return [...LEGACY_SET];
}

/** True when `id` is this user's personal area inbox (or the legacy shared id). */
export function isUserAreaBucket(
  id: string | null | undefined,
  userId: string,
  area: LifeArea,
): boolean {
  if (!id) return false;
  return (
    id === personalAreaProjectId(userId, area) ||
    id === LEGACY_AREA_PROJECT_IDS[area]
  );
}

/** Exclude area-inbox buckets when listing named paths under an area. */
export function areaBucketIdsToExclude(userId: string, area: LifeArea): string[] {
  return [personalAreaProjectId(userId, area), LEGACY_AREA_PROJECT_IDS[area]];
}
