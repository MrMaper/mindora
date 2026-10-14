-- P4 additive UserArea schema (docs/AREAS.md §9, §18).
-- No backfill here — run scripts/areas/backfill-areas.ts by hand after deploy.

-- CreateEnum
CREATE TYPE "AreaHubFor" AS ENUM ('RESEARCH', 'LANGUAGE');

-- CreateTable
CREATE TABLE "user_areas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameIsDefault" BOOLEAN NOT NULL DEFAULT true,
    "templateKey" TEXT,
    "color" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "hubFor" "AreaHubFor",
    "bucketProjectId" TEXT,
    "legacyEnum" "LifeArea",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_areas_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN "areaId" TEXT;
ALTER TABLE "tasks" ADD COLUMN "areaId" TEXT;
ALTER TABLE "habits" ADD COLUMN "areaId" TEXT;
ALTER TABLE "docs" ADD COLUMN "areaId" TEXT;
ALTER TABLE "doc_folders" ADD COLUMN "areaId" TEXT;

-- Indexes / uniques (Prisma-expressible)
CREATE UNIQUE INDEX "user_areas_bucketProjectId_key" ON "user_areas"("bucketProjectId");
CREATE INDEX "user_areas_userId_archived_sortOrder_idx" ON "user_areas"("userId", "archived", "sortOrder");
CREATE UNIQUE INDEX "user_areas_userId_legacyEnum_key" ON "user_areas"("userId", "legacyEnum");
CREATE INDEX "projects_areaId_idx" ON "projects"("areaId");
CREATE INDEX "tasks_areaId_idx" ON "tasks"("areaId");
CREATE INDEX "habits_areaId_idx" ON "habits"("areaId");
CREATE INDEX "docs_areaId_idx" ON "docs"("areaId");
CREATE INDEX "doc_folders_areaId_idx" ON "doc_folders"("areaId");

-- Partial unique indexes (Prisma cannot express these; docs/AREAS.md §18.2)
CREATE UNIQUE INDEX "user_areas_one_default_per_user"
  ON "user_areas" ("userId")
  WHERE "isDefault" = true AND "archived" = false;
CREATE UNIQUE INDEX "user_areas_one_hub_per_kind"
  ON "user_areas" ("userId", "hubFor")
  WHERE "hubFor" IS NOT NULL;

-- ForeignKeys
ALTER TABLE "user_areas" ADD CONSTRAINT "user_areas_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_areas" ADD CONSTRAINT "user_areas_bucketProjectId_fkey"
  FOREIGN KEY ("bucketProjectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_areaId_fkey"
  FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_areaId_fkey"
  FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "habits" ADD CONSTRAINT "habits_areaId_fkey"
  FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "docs" ADD CONSTRAINT "docs_areaId_fkey"
  FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "doc_folders" ADD CONSTRAINT "doc_folders_areaId_fkey"
  FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
