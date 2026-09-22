-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "ListeningSource" AS ENUM ('YOUTUBE', 'AUDIO');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "lang_listening_clips" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "title" TEXT NOT NULL,
    "sourceType" "ListeningSource" NOT NULL,
    "sourceRef" TEXT NOT NULL,
    "level" TEXT,
    "transcript" TEXT,
    "notes" TEXT,
    "starterKey" TEXT,
    "lastPlayedAt" TIMESTAMP(3),
    "playCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "lang_listening_clips_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "lang_listening_clips_userId_updatedAt_idx" ON "lang_listening_clips"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "lang_listening_clips_userId_starterKey_idx" ON "lang_listening_clips"("userId", "starterKey");
CREATE INDEX IF NOT EXISTS "lang_listening_clips_projectId_idx" ON "lang_listening_clips"("projectId");

DO $$ BEGIN
  ALTER TABLE "lang_listening_clips"
    ADD CONSTRAINT "lang_listening_clips_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "lang_listening_clips"
    ADD CONSTRAINT "lang_listening_clips_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
