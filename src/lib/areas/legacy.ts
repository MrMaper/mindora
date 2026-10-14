/**
 * Legacy area *strings* (no longer a database enum since P7).
 *
 * This is the ONLY place outside Prisma migrations / retired backfill scripts
 * where the `PHD | WORK | LIFE | LANG` literals may appear. They survive as:
 *
 *   - `AreaGuess`: what Capture's text parser guesses (`parse.ts`). It is input
 *     only — it is resolved to a member's `areaId` through `templateKey` /
 *     `hubFor` (see `areaRefForGuess`, server `areaIdForGuess`) and never stored.
 *   - URL slugs for permanent redirects (`/projects/areas/phd|work|life|lang`,
 *     docs/AREAS.md §16) mapped to `templateKey` via `templateKeyForSlug`.
 *
 * See docs/AREAS.md §13.
 */
import type { AreaTemplateKey } from "./templates";

export type AreaGuess = "PHD" | "WORK" | "LIFE" | "LANG";

export const AREA_GUESSES: readonly AreaGuess[] = ["PHD", "WORK", "LIFE", "LANG"];

/** Named guesses for the capture parser. */
export const GUESS_RESEARCH = "PHD" as const satisfies AreaGuess;
export const GUESS_LANGUAGE = "LANG" as const satisfies AreaGuess;
export const GUESS_WORK = "WORK" as const satisfies AreaGuess;
export const GUESS_LIFE = "LIFE" as const satisfies AreaGuess;

const GUESS_TEMPLATE: Record<AreaGuess, AreaTemplateKey> = {
  PHD: "research",
  WORK: "work",
  LIFE: "life",
  LANG: "language",
};

export function isAreaGuess(value: string | null | undefined): value is AreaGuess {
  return !!value && (AREA_GUESSES as readonly string[]).includes(value);
}

/** Template key a capture guess maps to (junk falls back to `life`). */
export function templateKeyForGuess(
  guess: string | null | undefined,
): AreaTemplateKey {
  return isAreaGuess(guess) ? GUESS_TEMPLATE[guess] : "life";
}

/**
 * Legacy URL slug (`phd|work|life|lang`, also `research|language`, any case)
 * to a template key; `null` when it is not a legacy slug.
 */
export function templateKeyForSlug(
  slug: string | null | undefined,
): AreaTemplateKey | null {
  switch ((slug ?? "").trim().toLowerCase()) {
    case "life":
      return "life";
    case "work":
      return "work";
    case "phd":
    case "research":
      return "research";
    case "lang":
    case "language":
      return "language";
    default:
      return null;
  }
}
