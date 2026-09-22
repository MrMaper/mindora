-- CreateTable
CREATE TABLE IF NOT EXISTS "lang_vocab_days" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "reviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lang_vocab_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "lang_vocab_days_userId_day_key" ON "lang_vocab_days"("userId", "day");
CREATE INDEX IF NOT EXISTS "lang_vocab_days_userId_day_idx" ON "lang_vocab_days"("userId", "day");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "lang_vocab_days"
    ADD CONSTRAINT "lang_vocab_days_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
