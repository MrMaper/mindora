/** Client helper: active language project from switcher storage/URL. */
export type ActiveLangProject =
  | { kind: "all" }
  | { kind: "inbox" }
  | { kind: "project"; id: string };

const STORAGE_KEY = "language-project-scope";

export function readActiveLangProject(): ActiveLangProject {
  if (typeof window === "undefined") return { kind: "all" };
  try {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("project");
    const raw = fromUrl || localStorage.getItem(STORAGE_KEY) || "all";
    if (raw === "all" || !raw) return { kind: "all" };
    if (raw === "inbox") return { kind: "inbox" };
    return { kind: "project", id: raw };
  } catch {
    return { kind: "all" };
  }
}

/** For createDoc / session log: undefined = omit, null = inbox, string = project id */
export function projectIdForLangCreate(
  active: ActiveLangProject = readActiveLangProject(),
): string | null | undefined {
  if (active.kind === "all") return undefined;
  if (active.kind === "inbox") return null;
  return active.id;
}
