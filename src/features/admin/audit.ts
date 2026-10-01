import { prisma as db } from "@/lib/db";

export const ADMIN_AUDIT_ACTIONS = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "USER_DELETED",
  "MODULES_UPDATED",
  "PASSWORD_RESET",
  "FORCE_LOGOUT",
  "BROADCAST_SENT",
  "PLAN_UPDATED",
  "LOGIN_UNLOCKED",
] as const;

export type AdminAuditAction = (typeof ADMIN_AUDIT_ACTIONS)[number];

export async function writeAdminAudit(input: {
  actorId: string;
  action: AdminAuditAction;
  summary: string;
  targetUserId?: string | null;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await db.adminAuditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      summary: input.summary.slice(0, 500),
      targetUserId: input.targetUserId ?? null,
      meta: input.meta
        ? (JSON.parse(JSON.stringify(input.meta)) as object)
        : undefined,
    },
  });
}

export async function listAdminAuditLogs(limit = 40) {
  const rows = await db.adminAuditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(100, Math.max(1, limit)),
    select: {
      id: true,
      action: true,
      summary: true,
      meta: true,
      createdAt: true,
      actor: { select: { id: true, name: true, email: true } },
      targetUser: { select: { id: true, name: true, email: true } },
    },
  });
  return rows;
}
