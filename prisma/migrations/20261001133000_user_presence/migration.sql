-- AlterTable
ALTER TABLE "users" ADD COLUMN "lastLoginAt" TIMESTAMP(3),
ADD COLUMN "lastSeenAt" TIMESTAMP(3),
ADD COLUMN "totalOnlineSeconds" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "users_lastSeenAt_idx" ON "users"("lastSeenAt");

-- CreateIndex
CREATE INDEX "users_lastLoginAt_idx" ON "users"("lastLoginAt");
