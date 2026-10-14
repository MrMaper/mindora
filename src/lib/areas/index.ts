/**
 * Area seam — pure (client-safe) exports.
 * Server-only pieces (DB / auth) live in `@/lib/areas/server`.
 *
 * Do not write `"PHD" | "WORK" | "LIFE" | "LANG"` outside this directory;
 * an ESLint rule enforces it (see eslint.config.mjs, docs/AREAS.md §13).
 */
export * from "./legacy";
export * from "./buckets";
export * from "./hub";
export * from "./member-context";
