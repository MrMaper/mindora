-- CreateEnum
CREATE TYPE "Theme" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN     "emailNotifs" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyDeadlineApproaching" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyMention" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySprintEnded" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifySprintStarted" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyStatusChanged" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyTaskAssigned" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyTaskCommented" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyTaskUpdated" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "soundNotifs" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "theme" "Theme" NOT NULL DEFAULT 'SYSTEM';
