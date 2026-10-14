import type { LifeArea } from "@/types/db";
import { LEGACY_AREA_PROJECT_IDS, LIFE_AREAS } from "./legacy";

export { LEGACY_AREA_PROJECT_IDS };

/** @deprecated Use personalAreaProjectId(userId, area) — kept for legacy ID detection. */
export const AREA_PROJECT_IDS = LEGACY_AREA_PROJECT_IDS;

const LEGACY_SET = new Set<string>(Object.values(LEGACY_AREA_PROJECT_IDS));

const BUCKET_RE = /^area-(phd|work|life|lang)-(.+)$/i;
const CUSTOM_BUCKET_RE = /^area-inbox-(.+)$/;

export function personalAreaProjectId(userId: string, area: LifeArea): string {
  return `area-${area.toLowerCase()}-${userId}`;
}

export function areaProjectIdsForUser(
  userId: string,
): Record<LifeArea, string> {
  const out = {} as Record<LifeArea, string>;
  for (const area of LIFE_AREAS) out[area] = personalAreaProjectId(userId, area);
  return out;
}

export function isAreaBucketId(id: string | null | undefined): boolean {
  if (!id) return false;
  if (LEGACY_SET.has(id)) return true;
  return BUCKET_RE.test(id) || CUSTOM_BUCKET_RE.test(id);
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
