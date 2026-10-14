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

// ─── Two-layer access: admin policy ∧ member preference (docs/AREAS.md §7) ───

export const MODULE_POLICY_STATES = ["off", "on", "member_choice"] as const;
export type ModulePolicyState = (typeof MODULE_POLICY_STATES)[number];
export type ModulePolicy = Record<PrimaryModule, ModulePolicyState>;
export type ModuleMemberPrefs = Partial<Record<PrimaryModule, boolean>>;

/** What a member gets for a `member_choice` module they never touched. */
export const DEFAULT_MEMBER_CHOICE: ModuleFlags = {
  tasks: true,
  docs: true,
  projects: true,
  habits: true,
  research: false,
  language: false,
  workLogs: false,
  reporting: false,
};

export const MODULE_PRESET_IDS = ["starter", "full"] as const;
export type ModulePresetId = (typeof MODULE_PRESET_IDS)[number];

export const MODULE_PRESETS: Record<ModulePresetId, ModulePolicy> = {
  starter: {
    tasks: "on",
    docs: "on",
    projects: "on",
    habits: "member_choice",
    workLogs: "member_choice",
    reporting: "member_choice",
    research: "member_choice",
    language: "member_choice",
  },
  full: {
    tasks: "on",
    docs: "on",
    projects: "on",
    habits: "on",
    workLogs: "on",
    reporting: "on",
    research: "on",
    language: "on",
  },
};

export function isModulePresetId(v: unknown): v is ModulePresetId {
  return v === "starter" || v === "full";
}

function isPolicyState(v: unknown): v is ModulePolicyState {
  return v === "off" || v === "on" || v === "member_choice";
}

function asRecord(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as Record<string, unknown>;
}

/**
 * Normalize stored policy. A key that is missing (user created before the
 * policy column existed and not backfilled yet) falls back to the legacy
 * `enabledModules` flag: true → member_choice, false → off.
 */
export function parseModulePolicy(
  rawPolicy: unknown,
  rawLegacy: unknown,
): ModulePolicy {
  const policy = asRecord(rawPolicy);
  const legacy = parseModuleFlags(rawLegacy);
  const out = {} as ModulePolicy;
  for (const key of PRIMARY_MODULES) {
    const v = policy[key];
    out[key] = isPolicyState(v) ? v : legacy[key] ? "member_choice" : "off";
  }
  return out;
}

export function parseMemberPrefs(raw: unknown): ModuleMemberPrefs {
  const obj = asRecord(raw);
  const out: ModuleMemberPrefs = {};
  for (const key of PRIMARY_MODULES) {
    if (typeof obj[key] === "boolean") out[key] = obj[key] as boolean;
  }
  return out;
}

/**
 * Effective flags for a member.
 * raw(m): off → false, on → true, member_choice → pref ?? default
 * Policy keys missing from storage use the legacy flag directly (so existing
 * members keep exactly what they had). Dependencies are applied last.
 */
export function resolveEffectiveFlags(input: {
  policy: unknown;
  prefs: unknown;
  legacy: unknown;
}): ModuleFlags {
  const policy = asRecord(input.policy);
  const prefs = parseMemberPrefs(input.prefs);
  const legacy = parseModuleFlags(input.legacy);
  const raw = {} as ModuleFlags;
  for (const key of PRIMARY_MODULES) {
    const state = policy[key];
    if (!isPolicyState(state)) {
      raw[key] = legacy[key];
    } else if (state === "off") {
      raw[key] = false;
    } else if (state === "on") {
      raw[key] = true;
    } else {
      raw[key] = prefs[key] ?? DEFAULT_MEMBER_CHOICE[key];
    }
  }
  return normalizeModuleFlags(raw);
}

/** Legacy mirror written on every policy change so an older build still reads it. */
export function policyToLegacyFlags(policy: ModulePolicy): ModuleFlags {
  const flags = {} as ModuleFlags;
  for (const key of PRIMARY_MODULES) flags[key] = policy[key] !== "off";
  return normalizeModuleFlags(flags);
}

/**
 * Materialize an explicit policy for a user whose stored policy is incomplete.
 * old flag true → member_choice + pref true; false → off (docs/AREAS.md §7.6).
 */
export function backfillPolicyFromLegacy(
  rawPolicy: unknown,
  rawPrefs: unknown,
  rawLegacy: unknown,
): { policy: ModulePolicy; prefs: ModuleMemberPrefs; changed: boolean } {
  const storedPolicy = asRecord(rawPolicy);
  const prefs = parseMemberPrefs(rawPrefs);
  const legacy = parseModuleFlags(rawLegacy);
  const policy = parseModulePolicy(rawPolicy, rawLegacy);
  let changed = false;
  for (const key of PRIMARY_MODULES) {
    if (!isPolicyState(storedPolicy[key])) {
      changed = true;
      if (legacy[key]) prefs[key] = true;
    }
  }
  return { policy, prefs, changed };
}

export type MemberToggleResult =
  | { ok: true; prefs: ModuleMemberPrefs }
  | { ok: false; reason: "locked_on" | "admin_off" | "dependency_off"; module: PrimaryModule };

/**
 * Member flips one module. Only `member_choice` modules are editable.
 * Enabling auto-enables dependencies that are also member_choice; if a
 * dependency is admin-off the toggle is rejected.
 */
export function applyMemberToggle(
  policy: ModulePolicy,
  prefs: ModuleMemberPrefs,
  key: PrimaryModule,
  enabled: boolean,
): MemberToggleResult {
  if (policy[key] === "off") return { ok: false, reason: "admin_off", module: key };
  if (policy[key] === "on") return { ok: false, reason: "locked_on", module: key };
  const next: ModuleMemberPrefs = { ...prefs, [key]: enabled };
  if (enabled) {
    for (const dep of MODULE_META[key].dependsOn ?? []) {
      if (policy[dep] === "off") {
        return { ok: false, reason: "dependency_off", module: dep };
      }
      if (policy[dep] === "member_choice") next[dep] = true;
    }
  }
  return { ok: true, prefs: next };
}

/** Modules that will switch off (effective) if `key` is turned off. */
export function dependentsOf(key: PrimaryModule): PrimaryModule[] {
  return PRIMARY_MODULES.filter(m => MODULE_META[m].dependsOn?.includes(key));
}

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
