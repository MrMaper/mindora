-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ExamKind" AS ENUM ('MSRT', 'IELTS', 'TOEFL', 'TOLIMO', 'EPT', 'CUSTOM');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "MockStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "exam_tracks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "kind" "ExamKind" NOT NULL DEFAULT 'MSRT',
    "name" TEXT NOT NULL,
    "targetScore" TEXT,
    "examDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "exam_tracks_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "exam_tracks_userId_kind_idx" ON "exam_tracks"("userId", "kind");
CREATE INDEX IF NOT EXISTS "exam_tracks_userId_projectId_idx" ON "exam_tracks"("userId", "projectId");

CREATE TABLE IF NOT EXISTS "mock_attempts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "trackId" TEXT NOT NULL,
    "projectId" TEXT,
    "kind" "ExamKind" NOT NULL,
    "status" "MockStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "totalCorrect" INTEGER,
    "totalQuestions" INTEGER,
    "percent" DOUBLE PRECISION,
    "sections" JSONB NOT NULL DEFAULT '[]',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "mock_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "mock_attempts_userId_startedAt_idx" ON "mock_attempts"("userId", "startedAt");
CREATE INDEX IF NOT EXISTS "mock_attempts_trackId_startedAt_idx" ON "mock_attempts"("trackId", "startedAt");

DO $$ BEGIN
  ALTER TABLE "exam_tracks" ADD CONSTRAINT "exam_tracks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "exam_tracks" ADD CONSTRAINT "exam_tracks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "mock_attempts" ADD CONSTRAINT "mock_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "mock_attempts" ADD CONSTRAINT "mock_attempts_trackId_fkey" FOREIGN KEY ("trackId") REFERENCES "exam_tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  ALTER TABLE "mock_attempts" ADD CONSTRAINT "mock_attempts_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
