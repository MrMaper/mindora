import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma as db } from "@/lib/db";
import {
  hasModule,
  isPathAllowed,
  memberHomePath,
  parseModuleFlags,
  type AppModule,
  type ModuleFlags,
} from "@/lib/modules";

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/dashboard");
  return session;
}

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function getUserModuleFlags(userId: string): Promise<ModuleFlags> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { enabledModules: true, role: true },
  });
  if (!user) return parseModuleFlags({});
  // Admin does not use member modules
  if (user.role === "ADMIN") return parseModuleFlags({});
  return parseModuleFlags(user.enabledModules);
}

export async function requireModule(module: AppModule) {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") {
    redirect("/users");
  }
  const flags = await getUserModuleFlags(session.user.id);
  if (!hasModule(flags, module)) {
    redirect(memberHomePath(flags));
  }
  return { session, flags };
}

export async function requireMemberPath(pathname: string) {
  const session = await requireAuth();
  if (session.user.role === "ADMIN") {
    if (
      pathname.startsWith("/users") ||
      pathname.startsWith("/settings") ||
      pathname.startsWith("/profile") ||
      pathname.startsWith("/notifications")
    ) {
      return { session, flags: parseModuleFlags({}) };
    }
    redirect("/users");
  }
  const flags = await getUserModuleFlags(session.user.id);
  if (!isPathAllowed(flags, pathname)) {
    redirect(memberHomePath(flags));
  }
  return { session, flags };
}

/** Count of ADMIN users (for single-admin enforcement). */
export async function countAdmins(): Promise<number> {
  return db.user.count({ where: { role: "ADMIN" } });
}
