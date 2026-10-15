-- Per-tab / per-surface product tours (in addition to overview).
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "completedTourIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill overview completion into the array for members who already finished the map tour.
UPDATE "user_preferences"
SET "completedTourIds" = array_append("completedTourIds", 'overview')
WHERE "productTourCompletedAt" IS NOT NULL
  AND NOT ('overview' = ANY ("completedTourIds"));
