-- Additive only (see docs/AREAS.md §18): nullable columns and defaults. No backfill.
-- Existing members keep uiProfile = 'full' (column default); only newly provisioned
-- members get 'starter' (set by provisionMember).

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "uiProfile" TEXT NOT NULL DEFAULT 'full';
ALTER TABLE "user_preferences" ADD COLUMN "uiProfileChangedAt" TIMESTAMP(3);
ALTER TABLE "user_preferences" ADD COLUMN "uiSuggestionDismissedAt" TIMESTAMP(3);
ALTER TABLE "user_preferences" ADD COLUMN "firstAreaChosenAt" TIMESTAMP(3);
ALTER TABLE "user_preferences" ADD COLUMN "firstCaptureAt" TIMESTAMP(3);
ALTER TABLE "user_preferences" ADD COLUMN "firstDoneAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN "defaultUiProfileAdmin" TEXT NOT NULL DEFAULT 'starter';
ALTER TABLE "system_settings" ADD COLUMN "defaultUiProfileSignup" TEXT NOT NULL DEFAULT 'starter';
