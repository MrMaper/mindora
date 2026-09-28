-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "batchDeadlineReminders" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "waitingOn" BOOLEAN NOT NULL DEFAULT false;
