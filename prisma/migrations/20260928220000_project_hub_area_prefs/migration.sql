-- Path hub: pin/sort, PLANNED/COMPLETED statuses, per-user area preferences

ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'PLANNED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS "projects_area_pinned_sortOrder_idx" ON "projects"("area", "pinned", "sortOrder");

CREATE TABLE IF NOT EXISTS "user_area_preferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "area" "LifeArea" NOT NULL,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_area_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_area_preferences_userId_area_key" ON "user_area_preferences"("userId", "area");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_area_preferences_userId_fkey'
  ) THEN
    ALTER TABLE "user_area_preferences"
      ADD CONSTRAINT "user_area_preferences_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
