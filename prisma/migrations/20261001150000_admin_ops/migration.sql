-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'SYSTEM_BROADCAST';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "users_lockedUntil_idx" ON "users"("lockedUntil");

-- CreateTable
CREATE TABLE "admin_audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" TEXT,
    "summary" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_heartbeats" (
    "id" TEXT NOT NULL,
    "lastRunAt" TIMESTAMP(3) NOT NULL,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "detail" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cron_heartbeats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "planCode" TEXT NOT NULL DEFAULT 'personal',
    "planLabel" TEXT NOT NULL DEFAULT 'Personal',
    "storageQuotaBytes" BIGINT NOT NULL DEFAULT 5368709120,
    "maxActiveMembers" INTEGER NOT NULL DEFAULT 25,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storage_ledger" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "userId" TEXT,
    "bytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_audit_logs_createdAt_idx" ON "admin_audit_logs"("createdAt");
CREATE INDEX "admin_audit_logs_actorId_createdAt_idx" ON "admin_audit_logs"("actorId", "createdAt");
CREATE INDEX "admin_audit_logs_action_idx" ON "admin_audit_logs"("action");
CREATE UNIQUE INDEX "storage_ledger_key_key" ON "storage_ledger"("key");
CREATE INDEX "storage_ledger_userId_idx" ON "storage_ledger"("userId");
CREATE INDEX "storage_ledger_kind_idx" ON "storage_ledger"("kind");

-- AddForeignKey
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "admin_audit_logs" ADD CONSTRAINT "admin_audit_logs_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default system settings row
INSERT INTO "system_settings" ("id", "planCode", "planLabel", "storageQuotaBytes", "maxActiveMembers", "updatedAt")
VALUES ('default', 'personal', 'Personal', 5368709120, 25, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
