/** Client helper: active research project from switcher storage/URL. */
import { RESEARCH_SCOPE_STORAGE } from "./scope-cookie";

export type ActiveResearchProject =
  | { kind: "all" }
  | { kind: "inbox" }
  | { kind: "project"; id: string };

export function readActiveResearchProject(): ActiveResearchProject {
  if (typeof window === "undefined") return { kind: "all" };
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("project");
    const raw = fromUrl || localStorage.getItem(RESEARCH_SCOPE_STORAGE) || "all";
    if (raw === "all" || !raw) return { kind: "all" };
    if (raw === "inbox") return { kind: "inbox" };
    return { kind: "project", id: raw };
  } catch {
    return { kind: "all" };
  }
}

/** For createDoc: undefined = omit, null = inbox, string = project id */
export function projectIdForCreate(
  active: ActiveResearchProject = readActiveResearchProject(),
): string | null | undefined {
  if (active.kind === "all") return undefined;
  if (active.kind === "inbox") return null;
  return active.id;
}
