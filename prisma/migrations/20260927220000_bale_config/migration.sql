-- Admin-managed Bale bot settings. One row, id "default".
CREATE TABLE "bale_config" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "botToken" TEXT NOT NULL DEFAULT '',
    "baseUrl" TEXT NOT NULL DEFAULT 'https://tapi.bale.ai/bot',
    "adminChatId" TEXT NOT NULL DEFAULT '',
    "tasksChannelId" TEXT NOT NULL DEFAULT '',
    "notifyChannel" BOOLEAN NOT NULL DEFAULT true,
    "notifyCreated" BOOLEAN NOT NULL DEFAULT true,
    "notifyUpdated" BOOLEAN NOT NULL DEFAULT true,
    "notifyStatus" BOOLEAN NOT NULL DEFAULT true,
    "notifyAssigned" BOOLEAN NOT NULL DEFAULT true,
    "notifyComment" BOOLEAN NOT NULL DEFAULT true,
    "notifyWorkLog" BOOLEAN NOT NULL DEFAULT true,
    "notifyDeadline" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bale_config_pkey" PRIMARY KEY ("id")
);
