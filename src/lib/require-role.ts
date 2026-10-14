import { redirect } from "next/navigation";
import { prisma as db } from "@/lib/db";
import {
  isPathAllowed,
  moduleForPath,
  parseModuleFlags,
  type AppModule,
  type ModuleFlags,
} from "@/lib/modules";
import { getModuleAccess, moduleDisabledReason } from "@/lib/module-guard";
import { getSessionCached } from "@/lib/request-cache";

export async function requireAdmin() {
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function requireAuth() {
  const session = await getSessionCached();
  if (!session?.user) redirect("/login");
  return session;
}

/** Effective flags (admin policy ∧ member prefs ∧ dependencies). Deduped per request. */
export async function getUserModuleFlags(userId: string): Promise<ModuleFlags> {
  const access = await getModuleAccess(userId);
  return access?.flags ?? parseModuleFlags({});
}

function disabledHref(module: AppModule, reason: string): string {
  return `/module-disabled?m=${encodeURIComponent(module)}&r=${reason}`;
}

export async function requireModule(module: AppModule) {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }
  const access = await getModuleAccess(session.user.id);
  const flags = access?.flags ?? parseModuleFlags({});
  if (access) {
    const reason = moduleDisabledReason(access, module);
    if (reason) redirect(disabledHref(module, reason));
  }
  return { session, flags };
}

export async function requireMemberPath(pathname: string) {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") {
    if (
      pathname.startsWith("/admin") ||
      pathname.startsWith("/users") ||
      pathname.startsWith("/bale-bot") ||
      pathname.startsWith("/guide") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/notifications")
    ) {
      return { session, flags: parseModuleFlags({}) };
    }
    redirect("/admin");
  }
  const access = await getModuleAccess(session.user.id);
  const flags = access?.flags ?? parseModuleFlags({});
  if (!isPathAllowed(flags, pathname)) {
    const mod = moduleForPath(pathname);
    const reason = access && mod ? moduleDisabledReason(access, mod) : null;
    redirect(mod && reason ? disabledHref(mod, reason) : "/settings");
  }
  return { session, flags };
}

/** Count of ADMIN users (for single-admin enforcement). */
export async function countAdmins(): Promise<number> {
  return db.user.count({ where: { role: "ADMIN" } });
}
