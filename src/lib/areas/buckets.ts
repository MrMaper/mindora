/**
 * Bucket-project id helpers. Seeded areas keep their historical ids
 * (`area-{phd|work|life|lang}-{userId}`); areas created later use
 * `area-inbox-{userAreaId}`. Both are recognised as buckets.
 */
import type { AreaTemplateKey } from "./templates";

/** The four seeded areas (identified by their template key). */
export type SeedAreaKey = Extract<
  AreaTemplateKey,
  "life" | "work" | "research" | "language"
>;

export const SEED_AREA_KEYS: readonly SeedAreaKey[] = [
  "research",
  "work",
  "life",
  "language",
];

/** Historical id slug per seeded area (persisted in project ids; do not change). */
const SEED_SLUG: Record<SeedAreaKey, string> = {
  research: "phd",
  work: "work",
  life: "life",
  language: "lang",
};

/** Pre multi-tenant shared bucket ids, kept for detection only. */
export const LEGACY_AREA_PROJECT_IDS: Record<SeedAreaKey, string> = {
  research: "area-phd",
  work: "area-work",
  life: "area-life",
  language: "area-lang",
};

const LEGACY_SET = new Set<string>(Object.values(LEGACY_AREA_PROJECT_IDS));

const BUCKET_RE = /^area-(phd|work|life|lang)-(.+)$/i;
const CUSTOM_BUCKET_RE = /^area-inbox-(.+)$/;

export function isSeedAreaKey(value: string | null | undefined): value is SeedAreaKey {
  return !!value && (SEED_AREA_KEYS as readonly string[]).includes(value);
}

export function personalAreaProjectId(userId: string, key: SeedAreaKey): string {
  return `area-${SEED_SLUG[key]}-${userId}`;
}

export function areaProjectIdsForUser(
  userId: string,
): Record<SeedAreaKey, string> {
  const out = {} as Record<SeedAreaKey, string>;
  for (const key of SEED_AREA_KEYS) out[key] = personalAreaProjectId(userId, key);
  return out;
}

export function isAreaBucketId(id: string | null | undefined): boolean {
  if (!id) return false;
  if (LEGACY_SET.has(id)) return true;
  return BUCKET_RE.test(id) || CUSTOM_BUCKET_RE.test(id);
}

/** Seeded-area key encoded in a (legacy or personal) bucket id, if any. */
export function seedKeyFromBucketId(id: string): SeedAreaKey | null {
  const legacy = (Object.entries(LEGACY_AREA_PROJECT_IDS) as [SeedAreaKey, string][])
    .find(([, v]) => v === id);
  if (legacy) return legacy[0];
  const m = BUCKET_RE.exec(id);
  if (!m) return null;
  const slug = m[1]!.toLowerCase();
  return SEED_AREA_KEYS.find(key => SEED_SLUG[key] === slug) ?? null;
}

export function allLegacyBucketIds(): string[] {
  return [...LEGACY_SET];
}

/** True when `id` is the area's own inbox bucket (or a legacy shared id for a seeded key). */
export function isAreaBucketOf(
  id: string | null | undefined,
  area: { bucketProjectId: string | null | undefined; templateKey?: string | null },
): boolean {
  if (!id) return false;
  if (area.bucketProjectId && id === area.bucketProjectId) return true;
  return isSeedAreaKey(area.templateKey) && id === LEGACY_AREA_PROJECT_IDS[area.templateKey];
}

/** Bucket ids to exclude when listing named paths under an area. */
export function areaBucketIdsToExclude(area: {
  bucketProjectId: string | null | undefined;
  templateKey?: string | null;
}): string[] {
  const ids: string[] = [];
  if (area.bucketProjectId) ids.push(area.bucketProjectId);
  if (isSeedAreaKey(area.templateKey)) ids.push(LEGACY_AREA_PROJECT_IDS[area.templateKey]);
  return ids;
}
