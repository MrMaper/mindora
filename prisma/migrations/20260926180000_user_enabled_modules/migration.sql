-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "enabledModules" JSONB NOT NULL DEFAULT '{}';
