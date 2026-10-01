import { promises as fs } from "fs";
import path from "path";
import { prisma as db } from "@/lib/db";

import { formatBytes } from "@/lib/format-bytes";
export { formatBytes };

export const CRON_JOB_DEADLINES = "deadline-reminders";

export async function touchCronHeartbeat(
  id: string,
  ok: boolean,
  detail?: Record<string, unknown>,
): Promise<void> {
  const now = new Date();
  await db.cronHeartbeat.upsert({
    where: { id },
    create: {
      id,
      lastRunAt: now,
      ok,
      detail: detail
        ? (JSON.parse(JSON.stringify(detail)) as object)
        : undefined,
    },
    update: {
      lastRunAt: now,
      ok,
      detail: detail
        ? (JSON.parse(JSON.stringify(detail)) as object)
        : undefined,
    },
  });
}

export type PlanCode = "personal" | "team" | "custom";

export const PLAN_PRESETS: Record<
  Exclude<PlanCode, "custom">,
  { label: string; storageQuotaBytes: bigint; maxActiveMembers: number }
> = {
  personal: {
    label: "Personal",
    storageQuotaBytes: BigInt(5) * BigInt(1024) * BigInt(1024) * BigInt(1024),
    maxActiveMembers: 10,
  },
  team: {
    label: "Team",
    storageQuotaBytes: BigInt(25) * BigInt(1024) * BigInt(1024) * BigInt(1024),
    maxActiveMembers: 50,
  },
};

export async function getSystemSettings() {
  const row = await db.systemSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      planCode: "personal",
      planLabel: "Personal",
      storageQuotaBytes: PLAN_PRESETS.personal.storageQuotaBytes,
      maxActiveMembers: PLAN_PRESETS.personal.maxActiveMembers,
    },
    update: {},
  });
  return row;
}

export async function updateSystemPlan(input: {
  planCode: PlanCode;
  planLabel?: string;
  storageQuotaBytes?: bigint;
  maxActiveMembers?: number;
}) {
  if (input.planCode === "personal" || input.planCode === "team") {
    const preset = PLAN_PRESETS[input.planCode];
    return db.systemSettings.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        planCode: input.planCode,
        planLabel: preset.label,
        storageQuotaBytes: preset.storageQuotaBytes,
        maxActiveMembers: preset.maxActiveMembers,
      },
      update: {
        planCode: input.planCode,
        planLabel: preset.label,
        storageQuotaBytes: preset.storageQuotaBytes,
        maxActiveMembers: preset.maxActiveMembers,
      },
    });
  }

  const current = await getSystemSettings();
  return db.systemSettings.update({
    where: { id: "default" },
    data: {
      planCode: "custom",
      planLabel: (input.planLabel ?? current.planLabel).slice(0, 60),
      storageQuotaBytes:
        input.storageQuotaBytes ?? current.storageQuotaBytes,
      maxActiveMembers:
        input.maxActiveMembers ?? current.maxActiveMembers,
    },
  });
}

export async function recordStorageUsage(input: {
  key: string;
  kind: string;
  bytes: number;
  userId?: string | null;
}): Promise<void> {
  const bytes = Math.max(0, Math.floor(input.bytes));
  await db.storageLedgerEntry.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      kind: input.kind,
      bytes,
      userId: input.userId ?? null,
    },
    update: {
      bytes,
      kind: input.kind,
      userId: input.userId ?? null,
    },
  });
}

export async function sumStorageBytes(): Promise<number> {
  const agg = await db.storageLedgerEntry.aggregate({
    _sum: { bytes: true },
  });
  return agg._sum.bytes ?? 0;
}

export async function getMigrationHealth(): Promise<{
  latestName: string | null;
  appliedCount: number;
  pendingCount: number;
  ok: boolean;
}> {
  type Row = { migration_name: string; finished_at: Date | null };
  let applied: Row[] = [];
  try {
    applied = await db.$queryRawUnsafe<Row[]>(
      `SELECT migration_name, finished_at FROM "_prisma_migrations" WHERE finished_at IS NOT NULL ORDER BY finished_at DESC`,
    );
  } catch {
    return { latestName: null, appliedCount: 0, pendingCount: -1, ok: false };
  }

  let diskCount = 0;
  try {
    const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
    const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
    diskCount = entries.filter(
      e => e.isDirectory() && e.name !== "migration_lock.toml",
    ).length;
  } catch {
    diskCount = applied.length;
  }

  const pendingCount = Math.max(0, diskCount - applied.length);
  return {
    latestName: applied[0]?.migration_name ?? null,
    appliedCount: applied.length,
    pendingCount,
    ok: pendingCount === 0 && applied.length > 0,
  };
}

export async function getDiskHealth(): Promise<{
  ok: boolean;
  freeBytes: number | null;
  totalBytes: number | null;
  path: string;
}> {
  try {
    // Node 18.15+ / 19+
    const statfs = (
      await import("fs")
    ).statfsSync as undefined | ((p: string) => { bavail: number; blocks: number; bsize: number });
    if (typeof statfs !== "function") {
      return { ok: true, freeBytes: null, totalBytes: null, path: process.cwd() };
    }
    const s = statfs(process.cwd());
    const freeBytes = Number(s.bavail) * Number(s.bsize);
    const totalBytes = Number(s.blocks) * Number(s.bsize);
    const ok = freeBytes > 512 * 1024 * 1024; // > 512MB free
    return { ok, freeBytes, totalBytes, path: process.cwd() };
  } catch {
    return { ok: true, freeBytes: null, totalBytes: null, path: process.cwd() };
  }
}

export function storageConfigured(): boolean {
  return !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY
  );
}

export function smtpConfigured(): boolean {
  return !!process.env.SMTP_HOST;
}
