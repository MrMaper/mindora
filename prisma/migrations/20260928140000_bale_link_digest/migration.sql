-- Confirm-by-code linking, separate personal switches, delivery log, and reply-to-complete.
ALTER TABLE "users" ADD COLUMN "baleLinkCode" TEXT;
ALTER TABLE "users" ADD COLUMN "baleLinkChatId" TEXT;
ALTER TABLE "users" ADD COLUMN "baleLinkExpires" TIMESTAMP(3);

ALTER TABLE "user_preferences" ADD COLUMN "baleDigestHour" INTEGER NOT NULL DEFAULT 8;
ALTER TABLE "user_preferences" ADD COLUMN "baleHabitHour" INTEGER NOT NULL DEFAULT 21;
ALTER TABLE "user_preferences" ADD COLUMN "baleDigestSentOn" TEXT;
ALTER TABLE "user_preferences" ADD COLUMN "baleHabitSentOn" TEXT;

ALTER TABLE "bale_config" ADD COLUMN "notifyDmAssigned" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bale_config" ADD COLUMN "notifyDmStatus" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bale_config" ADD COLUMN "notifyDmComment" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bale_config" ADD COLUMN "notifyDueChange" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bale_config" ADD COLUMN "notifyDigest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "bale_config" ADD COLUMN "notifyHabits" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "bale_deliveries" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kind" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "preview" TEXT NOT NULL DEFAULT '',
    CONSTRAINT "bale_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bale_deliveries_createdAt_idx" ON "bale_deliveries"("createdAt");

CREATE TABLE "bale_outbound" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chatId" TEXT NOT NULL,
    "messageId" INTEGER NOT NULL,
    "taskId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    CONSTRAINT "bale_outbound_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bale_outbound_chatId_messageId_idx" ON "bale_outbound"("chatId", "messageId");
