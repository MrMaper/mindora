-- AlterTable user_preferences
ALTER TABLE "user_preferences" ADD COLUMN IF NOT EXISTS "onboardingCompletedAt" TIMESTAMP(3);

-- AlterTable tasks
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrenceSeriesId" TEXT;
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrenceEndsAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "tasks_recurrenceSeriesId_idx" ON "tasks"("recurrenceSeriesId");

-- CreateTable habits
CREATE TABLE IF NOT EXISTS "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "area" "LifeArea",
    "cadence" "RecurrenceInterval" NOT NULL DEFAULT 'DAILY',
    "streak" INTEGER NOT NULL DEFAULT 0,
    "bestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastDoneDate" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "habit_logs" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "habits_userId_archivedAt_idx" ON "habits"("userId", "archivedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "habit_logs_habitId_dateKey_key" ON "habit_logs"("habitId", "dateKey");
CREATE INDEX IF NOT EXISTS "habit_logs_habitId_idx" ON "habit_logs"("habitId");

DO $$ BEGIN
  ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habitId_fkey"
    FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
