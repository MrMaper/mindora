import { listAdminAuditLogs } from "@/features/admin/audit";
import {
  CRON_JOB_DEADLINES,
  getDiskHealth,
  getMigrationHealth,
  getSystemSettings,
  smtpConfigured,
  storageConfigured,
  sumStorageBytes,
} from "@/features/admin/system";
import { formatBytes } from "@/lib/format-bytes";
import { prisma as db } from "@/lib/db";
import { getAdminOverview } from "@/features/users/queries";
import type { AdminOverview } from "@/features/users/types";

export type AdminOpsPayload = {
  overview: AdminOverview;
  audits: Array<{
    id: string;
    action: string;
    summary: string;
    createdAt: Date;
    actorName: string;
    targetName: string | null;
  }>;
  health: {
    migrations: Awaited<ReturnType<typeof getMigrationHealth>>;
    disk: Awaited<ReturnType<typeof getDiskHealth>>;
    storageConfigured: boolean;
    smtpConfigured: boolean;
    storageUsedBytes: number;
    storageQuotaBytes: number;
    storageUsedLabel: string;
    storageQuotaLabel: string;
    cron: {
      id: string;
      lastRunAt: Date | null;
      ok: boolean;
      ageMinutes: number | null;
      stale: boolean;
    };
  };
  plan: {
    planCode: string;
    planLabel: string;
    storageQuotaBytes: number;
    maxActiveMembers: number;
    activeMembers: number;
    membersOverCap: boolean;
  };
  lockedUsers: Array<{
    id: string;
    name: string;
    email: string;
    lockedUntil: Date;
    failedLoginCount: number;
  }>;
};

export async function getAdminOpsPayload(
  language: "FA" | "EN" = "FA",
): Promise<AdminOpsPayload> {
  const [overview, audits, settings, migration, disk, storageUsed, cron, lockedUsers, activeMembers] =
    await Promise.all([
      getAdminOverview(),
      listAdminAuditLogs(30),
      getSystemSettings(),
      getMigrationHealth(),
      getDiskHealth(),
      sumStorageBytes(),
      db.cronHeartbeat.findUnique({ where: { id: CRON_JOB_DEADLINES } }),
      db.user.findMany({
        where: { lockedUntil: { gt: new Date() } },
        select: {
          id: true,
          name: true,
          email: true,
          lockedUntil: true,
          failedLoginCount: true,
        },
        orderBy: { lockedUntil: "asc" },
        take: 20,
      }),
      db.user.count({ where: { status: "ACTIVE", role: "MEMBER" } }),
    ]);

  const quota = Number(settings.storageQuotaBytes);
  const cronAgeMin = cron?.lastRunAt
    ? Math.floor((Date.now() - cron.lastRunAt.getTime()) / 60_000)
    : null;

  return {
    overview,
    audits: audits.map(a => ({
      id: a.id,
      action: a.action,
      summary: a.summary,
      createdAt: a.createdAt,
      actorName: a.actor.name,
      targetName: a.targetUser?.name ?? null,
    })),
    health: {
      migrations: migration,
      disk,
      storageConfigured: storageConfigured(),
      smtpConfigured: smtpConfigured(),
      storageUsedBytes: storageUsed,
      storageQuotaBytes: quota,
      storageUsedLabel: formatBytes(storageUsed, language),
      storageQuotaLabel: formatBytes(quota, language),
      cron: {
        id: CRON_JOB_DEADLINES,
        lastRunAt: cron?.lastRunAt ?? null,
        ok: cron?.ok ?? false,
        ageMinutes: cronAgeMin,
        stale: cronAgeMin == null || cronAgeMin > 30,
      },
    },
    plan: {
      planCode: settings.planCode,
      planLabel: settings.planLabel,
      storageQuotaBytes: quota,
      maxActiveMembers: settings.maxActiveMembers,
      activeMembers,
      membersOverCap: activeMembers > settings.maxActiveMembers,
    },
    lockedUsers: lockedUsers
      .filter(u => u.lockedUntil)
      .map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        lockedUntil: u.lockedUntil!,
        failedLoginCount: u.failedLoginCount,
      })),
  };
}
