-- AlterTable
ALTER TABLE "lang_cards" ADD COLUMN IF NOT EXISTS "learningStep" INTEGER DEFAULT 0;

-- Backfill: graduated cards (box > 0) leave learning; box 0 stay at step 0
UPDATE "lang_cards" SET "learningStep" = NULL WHERE "box" > 0;
UPDATE "lang_cards" SET "learningStep" = 0 WHERE "box" = 0 AND "learningStep" IS NULL;
