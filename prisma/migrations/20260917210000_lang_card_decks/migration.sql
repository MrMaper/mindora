-- AlterTable
ALTER TABLE "lang_cards" ADD COLUMN IF NOT EXISTS "deckKey" TEXT;
ALTER TABLE "lang_cards" ADD COLUMN IF NOT EXISTS "lesson" INTEGER;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "lang_cards_userId_deckKey_lesson_idx" ON "lang_cards"("userId", "deckKey", "lesson");
