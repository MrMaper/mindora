/** Persist research project scope so the server can render the right board (no flicker). */

export const RESEARCH_SCOPE_COOKIE = "research-project-scope";
export const RESEARCH_SCOPE_STORAGE = "research-project-scope";

export function researchHrefForScope(scope: string | null | undefined): string {
  if (!scope || scope === "all") return "/research";
  return `/research?project=${encodeURIComponent(scope)}`;
}

/** Client-only: keep cookie in sync with the switcher (readable by RSC). */
export function writeResearchScopeCookie(scope: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${RESEARCH_SCOPE_COOKIE}=${encodeURIComponent(scope)}; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}
