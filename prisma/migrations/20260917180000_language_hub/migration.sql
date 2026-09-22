-- AlterEnum
ALTER TYPE "LifeArea" ADD VALUE IF NOT EXISTS 'LANG';

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "LangSkill" AS ENUM ('LISTENING', 'READING', 'WRITING', 'SPEAKING', 'GRAMMAR', 'VOCAB', 'PRONUNCIATION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "lang_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "targetExam" TEXT,
    "targetScore" TEXT,
    "examDate" TIMESTAMP(3),
    "weeklyGoalMin" INTEGER NOT NULL DEFAULT 210,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lang_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "lang_profiles_userId_key" ON "lang_profiles"("userId");

-- CreateTable
CREATE TABLE IF NOT EXISTS "lang_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "skill" "LangSkill" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "practicedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lang_sessions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lang_sessions_userId_practicedAt_idx" ON "lang_sessions"("userId", "practicedAt");
CREATE INDEX IF NOT EXISTS "lang_sessions_userId_skill_idx" ON "lang_sessions"("userId", "skill");
CREATE INDEX IF NOT EXISTS "lang_sessions_projectId_idx" ON "lang_sessions"("projectId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "lang_profiles" ADD CONSTRAINT "lang_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "lang_sessions" ADD CONSTRAINT "lang_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "lang_sessions" ADD CONSTRAINT "lang_sessions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
