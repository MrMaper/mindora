/**
 * Starter / Full UI profile (docs/AREAS.md §6.5, §6.6, §15.2).
 * Pure helpers: no DB, safe for client and server.
 */
import {
  DEFAULT_AREA,
  LANGUAGE_AREA,
  RESEARCH_AREA,
  WORK_AREA,
} from "@/lib/areas";
import type { LifeArea } from "@/types/db";
import {
  hasModule,
  type AppModule,
  type ModuleFlags,
  type ModuleMemberPrefs,
  type PrimaryModule,
} from "@/lib/modules";

export const UI_PROFILES = ["starter", "full"] as const;
export type UiProfile = (typeof UI_PROFILES)[number];

export function isUiProfile(v: unknown): v is UiProfile {
  return v === "starter" || v === "full";
}

/** Unknown values fall back to `full` so nobody's existing UI shrinks by accident. */
export function parseUiProfile(v: unknown, fallback: UiProfile = "full"): UiProfile {
  return isUiProfile(v) ? v : fallback;
}

/** Completed tasks before Today offers the switch to Full (§23). */
export const SUGGEST_FULL_AFTER_DONE = 3;

export function shouldSuggestFull(input: {
  profile: UiProfile;
  doneCount: number;
  dismissedAt: Date | string | null | undefined;
}): boolean {
  return (
    input.profile === "starter" &&
    input.doneCount >= SUGGEST_FULL_AFTER_DONE &&
    !input.dismissedAt
  );
}

export type NavKey =
  | "dashboard"
  | "kanban"
  | "tasks"
  | "calendar"
  | "projects"
  | "docs"
  | "research"
  | "language"
  | "review"
  | "workLogs"
  | "reporting";

/** Modules that own a sidebar entry and can be explicitly enabled on their own. */
const EXPLICIT_NAV_MODULES: PrimaryModule[] = [
  "projects",
  "docs",
  "research",
  "language",
  "workLogs",
  "reporting",
];

/**
 * Modules the member turned on themselves in Capabilities (only possible for
 * `member_choice` modules) and that are effectively available.
 */
export function explicitNavModules(
  prefs: ModuleMemberPrefs,
  flags: ModuleFlags,
): PrimaryModule[] {
  return EXPLICIT_NAV_MODULES.filter(m => prefs[m] === true && flags[m]);
}

export interface NavVisibilityInput {
  profile: UiProfile;
  flags: ModuleFlags;
  explicit: readonly PrimaryModule[];
  /** True once the member has any task with a due date. */
  hasDatedTask: boolean;
}

/**
 * Which sidebar entries to show.
 * Full: everything the effective modules allow.
 * Starter: Today, Tasks, Calendar (after the first dated task), plus modules the
 * member explicitly enabled. Settings is rendered by the shell either way.
 */
export function navVisibility(input: NavVisibilityInput): Record<NavKey, boolean> {
  const { profile, flags, explicit, hasDatedTask } = input;
  const allowed = (m: AppModule) => hasModule(flags, m);

  if (profile === "full") {
    return {
      dashboard: true,
      kanban: allowed("kanban"),
      tasks: allowed("tasks"),
      calendar: allowed("calendar"),
      projects: allowed("projects"),
      docs: allowed("docs"),
      research: allowed("research"),
      language: allowed("language"),
      review: allowed("review"),
      workLogs: allowed("workLogs"),
      reporting: allowed("reporting"),
    };
  }

  const picked = (m: PrimaryModule) => allowed(m) && explicit.includes(m);
  return {
    dashboard: true,
    kanban: false,
    tasks: allowed("tasks"),
    calendar: allowed("calendar") && hasDatedTask,
    projects: picked("projects"),
    docs: picked("docs"),
    research: picked("research"),
    language: picked("language"),
    review: false,
    workLogs: picked("workLogs"),
    reporting: picked("reporting"),
  };
}

/** «چیکار داری؟» chips: chip id → what we do with it (docs/AREAS.md §14.1 S-6). */
export const LIFE_PART_CHIPS = [
  "work",
  "home",
  "study",
  "language",
  "health",
  "other",
] as const;
export type LifePartChip = (typeof LIFE_PART_CHIPS)[number];

export function isLifePartChip(v: unknown): v is LifePartChip {
  return (LIFE_PART_CHIPS as readonly string[]).includes(v as string);
}

export const LIFE_PART_LABEL: Record<LifePartChip, { fa: string; en: string }> = {
  work: { fa: "کار", en: "Work" },
  home: { fa: "خانه و زندگی", en: "Home & life" },
  study: { fa: "درس یا پژوهش", en: "Study or research" },
  language: { fa: "زبان", en: "Language" },
  health: { fa: "سلامت", en: "Health" },
  other: { fa: "سایر…", en: "Other…" },
};

/**
 * Which of the four fixed areas a Starter chip maps to (P2 runs on the existing
 * enum; P4 replaces this with real per-member areas). Study/Language only land
 * in their hub when that module is on, otherwise the task would vanish from
 * Today. Choosing a chip never enables a module.
 */
export function areaForLifePart(
  chip: LifePartChip,
  flags: { research: boolean; language: boolean },
): LifeArea {
  switch (chip) {
    case "work":
      return WORK_AREA;
    case "study":
      return flags.research ? RESEARCH_AREA : DEFAULT_AREA;
    case "language":
      return flags.language ? LANGUAGE_AREA : DEFAULT_AREA;
    default:
      return DEFAULT_AREA;
  }
}
