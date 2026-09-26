-- AlterTable user_preferences — today focus strip on dashboard
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "todayFocusDate" TEXT;
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "todayFocusIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
