-- P7 cleanup (docs/AREAS.md §20). DESTRUCTIVE: drops the legacy LifeArea enum
-- columns, UserAreaPreference, User.enabledModules and UserArea.legacyEnum.
--
-- Preconditions (verified by scripts/areas/verify-areas.ts before running):
--   * fresh pg_dump taken (backups/ is gitignored)
--   * every task/project/doc/habit has a non-null "areaId"
--   * backfill-areas / backfill-modules were run, so nothing reads the dropped data
-- The guard below aborts the whole migration if a required "areaId" is still NULL.

DO $$
DECLARE
  n bigint;
BEGIN
  SELECT
    (SELECT COUNT(*) FROM "tasks"    WHERE "areaId" IS NULL) +
    (SELECT COUNT(*) FROM "projects" WHERE "areaId" IS NULL) +
    (SELECT COUNT(*) FROM "docs"     WHERE "areaId" IS NULL) +
    (SELECT COUNT(*) FROM "habits"   WHERE "areaId" IS NULL)
  INTO n;
  IF n > 0 THEN
    RAISE EXCEPTION 'P7 aborted: % rows still have NULL areaId (run backfill-areas first)', n;
  END IF;
END $$;

-- DropForeignKey (re-created below as required / NO ACTION)
ALTER TABLE "docs" DROP CONSTRAINT "docs_areaId_fkey";
ALTER TABLE "habits" DROP CONSTRAINT "habits_areaId_fkey";
ALTER TABLE "projects" DROP CONSTRAINT "projects_areaId_fkey";
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_areaId_fkey";
ALTER TABLE "user_area_preferences" DROP CONSTRAINT "user_area_preferences_userId_fkey";

-- DropIndex
DROP INDEX "docs_userId_area_idx";
DROP INDEX "projects_areaId_idx";
DROP INDEX "projects_area_pinned_sortOrder_idx";
DROP INDEX "user_areas_userId_legacyEnum_key";

-- Drop legacy enum columns
ALTER TABLE "doc_folders" DROP COLUMN "area";
ALTER TABLE "docs" DROP COLUMN "area", ALTER COLUMN "areaId" SET NOT NULL;
ALTER TABLE "habits" DROP COLUMN "area", ALTER COLUMN "areaId" SET NOT NULL;
ALTER TABLE "projects" DROP COLUMN "area", ALTER COLUMN "areaId" SET NOT NULL;
ALTER TABLE "tasks" DROP COLUMN "area", ALTER COLUMN "areaId" SET NOT NULL;
ALTER TABLE "user_areas" DROP COLUMN "legacyEnum";
ALTER TABLE "users" DROP COLUMN "enabledModules";

-- DropTable
DROP TABLE "user_area_preferences";

-- DropEnum (nothing references it any more)
DROP TYPE "LifeArea";

-- CreateIndex
CREATE INDEX "docs_userId_areaId_idx" ON "docs"("userId", "areaId");
CREATE INDEX "projects_areaId_pinned_sortOrder_idx" ON "projects"("areaId", "pinned", "sortOrder");

-- AddForeignKey (NO ACTION is checked at statement end, so deleting a user still
-- cascades through user_areas and its rows in one statement)
ALTER TABLE "projects" ADD CONSTRAINT "projects_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "habits" ADD CONSTRAINT "habits_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
ALTER TABLE "docs" ADD CONSTRAINT "docs_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "user_areas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- Partial unique indexes (user_areas_one_default_per_user, user_areas_one_hub_per_kind)
-- do not involve dropped columns and are left untouched.
