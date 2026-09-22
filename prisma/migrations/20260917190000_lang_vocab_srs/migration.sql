-- CreateTable
CREATE TABLE IF NOT EXISTS "lang_cards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "front" TEXT NOT NULL,
    "back" TEXT NOT NULL,
    "example" TEXT,
    "tags" TEXT,
    "box" INTEGER NOT NULL DEFAULT 0,
    "intervalDays" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReviewedAt" TIMESTAMP(3),
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "lapses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lang_cards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lang_cards_userId_nextReviewAt_idx" ON "lang_cards"("userId", "nextReviewAt");
CREATE INDEX IF NOT EXISTS "lang_cards_userId_projectId_idx" ON "lang_cards"("userId", "projectId");

DO $$ BEGIN
  ALTER TABLE "lang_cards" ADD CONSTRAINT "lang_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "lang_cards" ADD CONSTRAINT "lang_cards_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
