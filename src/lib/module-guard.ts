import { cache } from "react";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import {
  DEFAULT_MEMBER_CHOICE,
  MODULE_META,
  hasModule,
  parseMemberPrefs,
  parseModuleFlags,
  parseModulePolicy,
  resolveEffectiveFlags,
  type AppModule,
  type ModuleFlags,
  type ModuleMemberPrefs,
  type ModulePolicy,
  type PrimaryModule,
} from "@/lib/modules";

/**
 * Single source for "may this member use module X" (docs/AREAS.md §7.7).
 * Used by pages, server actions, API routes, cron and bot handlers.
 */

export type ModuleDisabledReason = "admin_off" | "member_off";

export interface ModuleAccess {
  role: "ADMIN" | "MEMBER";
  flags: ModuleFlags;
  policy: ModulePolicy;
  prefs: ModuleMemberPrefs;
}

const ALL_ON: ModuleFlags = parseModuleFlags({});

export const MODULE_DISABLED_MESSAGE: Record<ModuleDisabledReason, string> = {
  admin_off:
    "این قابلیت برای حساب تو فعال نشده. اگر لازمش داری از مدیر بخواه.",
  member_off: "این قابلیت را خودت خاموش کرده‌ای.",
};

export class ModuleDisabledError extends Error {
  readonly module: AppModule;
  readonly reason: ModuleDisabledReason;
  constructor(module: AppModule, reason: ModuleDisabledReason) {
    super(MODULE_DISABLED_MESSAGE[reason]);
    this.name = "ModuleDisabledError";
    this.module = module;
    this.reason = reason;
  }
}

async function loadModuleAccess(userId: string): Promise<ModuleAccess | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      modulePolicy: true,
      preferences: { select: { moduleMemberPrefs: true } },
    },
  });
  if (!user) return null;
  if (user.role === "ADMIN") {
    return {
      role: "ADMIN",
      flags: ALL_ON,
      policy: parseModulePolicy({}),
      prefs: {},
    };
  }
  const prefsRaw = user.preferences?.moduleMemberPrefs ?? {};
  return {
    role: "MEMBER",
    flags: resolveEffectiveFlags({
      policy: user.modulePolicy,
      prefs: prefsRaw,
    }),
    policy: parseModulePolicy(user.modulePolicy),
    prefs: parseMemberPrefs(prefsRaw),
  };
}

/** Deduped within one RSC request. */
export const getModuleAccess = cache(loadModuleAccess);

/** For code with no request/session (cron, Bale webhook, digests). */
export async function getEffectiveFlagsForUser(
  userId: string,
): Promise<ModuleFlags> {
  const access = await loadModuleAccess(userId);
  return access?.flags ?? ALL_ON;
}

function primaryOf(module: AppModule): PrimaryModule | null {
  switch (module) {
    case "calendar":
    case "kanban":
    case "review":
      return "tasks";
    case "dashboard":
      return null;
    default:
      return module;
  }
}

/** Why a module is unavailable, or null when it is available. */
export function moduleDisabledReason(
  access: ModuleAccess,
  module: AppModule,
): ModuleDisabledReason | null {
  if (hasModule(access.flags, module)) return null;
  const primary = primaryOf(module);
  if (!primary) return null;

  const state = access.policy[primary];
  if (state === "off") return "admin_off";
  if (state === "member_choice") {
    const pref = access.prefs[primary] ?? DEFAULT_MEMBER_CHOICE[primary];
    if (!pref) return "member_off";
  }
  // Policy allows it, so a dependency is blocking it.
  for (const dep of MODULE_META[primary].dependsOn ?? []) {
    if (!access.flags[dep]) {
      return moduleDisabledReason(access, dep) ?? "admin_off";
    }
  }
  return "member_off";
}

/** Throws ModuleDisabledError when the member may not use `module`. */
export async function assertModule(
  userId: string,
  module: AppModule,
): Promise<void> {
  const access = await getModuleAccess(userId);
  if (!access) throw new ModuleDisabledError(module, "admin_off");
  const reason = moduleDisabledReason(access, module);
  if (reason) throw new ModuleDisabledError(module, reason);
}

/**
 * Drop-in for `await auth()` in module-specific server actions.
 * Returns null (so the existing "not signed in" branch runs) when there is
 * no session or the member may not use `module`.
 */
export async function authForModule(module: AppModule) {
  const session = await auth();
  if (!session?.user) return null;
  if (session.user.role === "ADMIN") return session;
  const err = await moduleGuardError(session.user.id, module);
  return err ? null : session;
}

/**
 * Action-friendly variant: returns an error message instead of throwing so
 * existing `{ success: false, error }` result shapes keep working.
 */
export async function moduleGuardError(
  userId: string,
  module: AppModule,
): Promise<string | null> {
  const access = await getModuleAccess(userId);
  if (!access) return MODULE_DISABLED_MESSAGE.admin_off;
  const reason = moduleDisabledReason(access, module);
  return reason ? MODULE_DISABLED_MESSAGE[reason] : null;
}
