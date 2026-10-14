-- Additive only (see docs/AREAS.md §18): new enums, columns with defaults. No backfill.
-- Existing users keep working: missing modulePolicy keys fall back to the legacy
-- enabledModules flag at read time; scripts/areas/backfill-modules.ts materializes them.

-- CreateEnum
CREATE TYPE "UserCreatedVia" AS ENUM ('ADMIN_INVITE', 'SELF_SIGNUP');

-- CreateEnum
CREATE TYPE "PasswordTokenPurpose" AS ENUM ('RESET', 'INVITE');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "modulePolicy" JSONB NOT NULL DEFAULT '{}';
ALTER TABLE "users" ADD COLUMN "createdVia" "UserCreatedVia" NOT NULL DEFAULT 'ADMIN_INVITE';
ALTER TABLE "users" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "user_preferences" ADD COLUMN "moduleMemberPrefs" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "password_reset_tokens" ADD COLUMN "purpose" "PasswordTokenPurpose" NOT NULL DEFAULT 'RESET';

-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN "defaultModulePresetAdmin" TEXT NOT NULL DEFAULT 'starter';
ALTER TABLE "system_settings" ADD COLUMN "defaultModulePresetSignup" TEXT NOT NULL DEFAULT 'starter';
ALTER TABLE "system_settings" ADD COLUMN "signupEnabled" BOOLEAN NOT NULL DEFAULT false;
