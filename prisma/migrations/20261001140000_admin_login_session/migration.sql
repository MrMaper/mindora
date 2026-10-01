-- AlterTable
ALTER TABLE "users" ADD COLUMN "sessionVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "user_login_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "user_login_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_login_events_userId_createdAt_idx" ON "user_login_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "user_login_events_createdAt_idx" ON "user_login_events"("createdAt");

-- AddForeignKey
ALTER TABLE "user_login_events" ADD CONSTRAINT "user_login_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
