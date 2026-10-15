/** Built-in avatar art under `/public/avatars`. Paths are safe to store on User.avatar. */

/** Bump when SVG art changes so browsers don't keep stale presets. */
export const AVATAR_PRESET_CACHE = "v2";

export const AVATAR_PRESETS = [
  { id: "aurora", src: "/avatars/aurora.svg", labelFa: "شفق", labelEn: "Aurora" },
  { id: "tide", src: "/avatars/tide.svg", labelFa: "موج", labelEn: "Tide" },
  { id: "ember", src: "/avatars/ember.svg", labelFa: "اخگر", labelEn: "Ember" },
  { id: "moss", src: "/avatars/moss.svg", labelFa: "خزه", labelEn: "Moss" },
  { id: "dusk", src: "/avatars/dusk.svg", labelFa: "غروب", labelEn: "Dusk" },
  { id: "citrus", src: "/avatars/citrus.svg", labelFa: "مرکبات", labelEn: "Citrus" },
  { id: "ink", src: "/avatars/ink.svg", labelFa: "مرکب", labelEn: "Ink" },
  { id: "bloom", src: "/avatars/bloom.svg", labelFa: "شکوفه", labelEn: "Bloom" },
] as const;

export type AvatarPresetId = (typeof AVATAR_PRESETS)[number]["id"];

const PRESET_SRC = new Set<string>(AVATAR_PRESETS.map(p => p.src));

export function isAvatarPresetSrc(src: string): boolean {
  return PRESET_SRC.has(src);
}

export function avatarPresetById(id: string) {
  return AVATAR_PRESETS.find(p => p.id === id) ?? null;
}

/** Display URL with cache-bust; DB still stores the bare `/avatars/….svg` path. */
export function avatarPresetDisplaySrc(src: string): string {
  if (!isAvatarPresetSrc(src)) return src;
  return `${src}?v=${AVATAR_PRESET_CACHE}`;
}
