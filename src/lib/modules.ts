/**
 * Product modules for MEMBER accounts.
 * ADMIN is management-only and does not use these flags.
 *
 * Stored (primary) toggles vs derived access:
 * - Primary: tasks, docs, research, language, habits, projects, workLogs, reporting
 * - Derived: calendar, kanban, review require `tasks`
 * - research requires `docs` (cannot enable research alone)
 */

export const PRIMARY_MODULES = [
  "tasks",
  "docs",
  "research",
  "language",
  "habits",
  "projects",
  "workLogs",
  "reporting",
] as const;

export type PrimaryModule = (typeof PRIMARY_MODULES)[number];

/** Surfaces that can be gated (includes derived). */
export type AppModule = PrimaryModule | "calendar" | "kanban" | "review" | "dashboard";

export type ModuleFlags = Record<PrimaryModule, boolean>;

export const DEFAULT_MODULE_FLAGS: ModuleFlags = {
  tasks: true,
  docs: true,
  research: true,
  language: true,
  habits: true,
  projects: true,
  workLogs: true,
  reporting: true,
};

/** UI / path → required module(s). */
const PATH_MODULE: Array<{ prefix: string; module: AppModule }> = [
  { prefix: "/kanban", module: "kanban" },
  { prefix: "/tasks", module: "tasks" },
  { prefix: "/calendar", module: "calendar" },
  { prefix: "/docs", module: "docs" },
  { prefix: "/research", module: "research" },
  { prefix: "/language", module: "language" },
  { prefix: "/review", module: "review" },
  { prefix: "/work-logs", module: "workLogs" },
  { prefix: "/reporting", module: "reporting" },
  { prefix: "/projects", module: "projects" },
];

export function parseModuleFlags(raw: unknown): ModuleFlags {
  const base = { ...DEFAULT_MODULE_FLAGS };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const obj = raw as Record<string, unknown>;
  for (const key of PRIMARY_MODULES) {
    if (typeof obj[key] === "boolean") base[key] = obj[key];
  }
  return normalizeModuleFlags(base);
}

/** Enforce dependency rules after any edit. */
export function normalizeModuleFlags(input: Partial<ModuleFlags>): ModuleFlags {
  const flags: ModuleFlags = { ...DEFAULT_MODULE_FLAGS, ...input };

  // research needs docs
  if (flags.research && !flags.docs) flags.research = false;

  // reporting / workLogs make little sense without tasks — soft-couple
  if (!flags.tasks) {
    flags.reporting = false;
    flags.workLogs = false;
  }

  return flags;
}

/** Apply a primary toggle and cascade dependents for admin UI. */
export function applyModuleToggle(
  current: ModuleFlags,
  key: PrimaryModule,
  enabled: boolean,
): ModuleFlags {
  const next = { ...current, [key]: enabled };

  if (key === "docs" && !enabled) {
    next.research = false;
  }
  if (key === "research" && enabled) {
    next.docs = true;
  }
  if (key === "tasks" && !enabled) {
    next.reporting = false;
    next.workLogs = false;
  }
  if ((key === "reporting" || key === "workLogs") && enabled) {
    next.tasks = true;
  }

  return normalizeModuleFlags(next);
}

export function hasModule(flags: ModuleFlags, module: AppModule): boolean {
  switch (module) {
    case "calendar":
    case "kanban":
    case "review":
      return flags.tasks;
    case "dashboard":
      return true;
    default:
      return flags[module];
  }
}

export function moduleForPath(pathname: string): AppModule | null {
  for (const { prefix, module } of PATH_MODULE) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return module;
  }
  return null;
}

export function isPathAllowed(flags: ModuleFlags, pathname: string): boolean {
  const mod = moduleForPath(pathname);
  if (!mod) return true;
  return hasModule(flags, mod);
}

/** First allowed member home. */
export function memberHomePath(flags: ModuleFlags): string {
  if (hasModule(flags, "dashboard")) return "/dashboard";
  if (flags.tasks) return "/tasks";
  if (flags.projects) return "/projects";
  if (flags.docs) return "/docs";
  if (flags.language) return "/language";
  return "/settings";
}

export const MODULE_META: Record<
  PrimaryModule,
  { fa: string; en: string; dependsOn?: PrimaryModule[] }
> = {
  tasks: { fa: "کارها / تقویم / بورد / بازبینی", en: "Tasks / calendar / board / review" },
  docs: { fa: "نوشته‌ها", en: "Docs" },
  research: { fa: "پژوهش", en: "Research", dependsOn: ["docs"] },
  language: { fa: "زبان", en: "Language" },
  habits: { fa: "عادت‌ها", en: "Habits" },
  projects: { fa: "حوزه‌ها و مسیرها", en: "Areas & paths" },
  workLogs: { fa: "ساعت‌ها", en: "Work logs", dependsOn: ["tasks"] },
  reporting: { fa: "گزارش‌گیری", en: "Reporting", dependsOn: ["tasks"] },
};
