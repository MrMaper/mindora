-- Missing baseline for Docs hub + life-area columns (was in schema but never migrated)

CREATE TYPE "LifeArea" AS ENUM ('PHD', 'WORK', 'LIFE');

CREATE TYPE "DocStatus" AS ENUM ('IDEA', 'DRAFTING', 'REVIEW', 'READY');

CREATE TYPE "RecurrenceInterval" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "area" "LifeArea" NOT NULL DEFAULT 'LIFE';

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "area" "LifeArea";
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "recurrence" "RecurrenceInterval" NOT NULL DEFAULT 'NONE';

CREATE TABLE IF NOT EXISTS "doc_folders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "area" "LifeArea",
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "doc_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "docs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'بدون عنوان',
    "content" TEXT NOT NULL DEFAULT '',
    "contentText" TEXT NOT NULL DEFAULT '',
    "area" "LifeArea" NOT NULL DEFAULT 'LIFE',
    "status" "DocStatus" NOT NULL DEFAULT 'DRAFTING',
    "wordGoal" INTEGER,
    "templateKey" TEXT,
    "systemKey" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "folderId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "docs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doc_tags" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT NOT NULL DEFAULT '#636e87',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doc_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doc_tags_on_docs" (
    "docId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "doc_tags_on_docs_pkey" PRIMARY KEY ("docId","tagId")
);

CREATE TABLE IF NOT EXISTS "doc_tasks" (
    "docId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    CONSTRAINT "doc_tasks_pkey" PRIMARY KEY ("docId","taskId")
);

CREATE TABLE IF NOT EXISTS "doc_versions" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doc_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doc_sources" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "authors" TEXT,
    "url" TEXT,
    "year" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "doc_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "doc_quotes" (
    "id" TEXT NOT NULL,
    "docId" TEXT NOT NULL,
    "sourceId" TEXT,
    "text" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "doc_quotes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "doc_folders_userId_idx" ON "doc_folders"("userId");
CREATE INDEX IF NOT EXISTS "docs_userId_updatedAt_idx" ON "docs"("userId", "updatedAt");
CREATE INDEX IF NOT EXISTS "docs_userId_area_idx" ON "docs"("userId", "area");
CREATE INDEX IF NOT EXISTS "docs_userId_deletedAt_idx" ON "docs"("userId", "deletedAt");
CREATE INDEX IF NOT EXISTS "docs_folderId_idx" ON "docs"("folderId");
CREATE UNIQUE INDEX IF NOT EXISTS "docs_userId_systemKey_key" ON "docs"("userId", "systemKey");
CREATE INDEX IF NOT EXISTS "doc_tags_userId_idx" ON "doc_tags"("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "doc_tags_userId_name_key" ON "doc_tags"("userId", "name");
CREATE INDEX IF NOT EXISTS "doc_tasks_taskId_idx" ON "doc_tasks"("taskId");
CREATE INDEX IF NOT EXISTS "doc_versions_docId_createdAt_idx" ON "doc_versions"("docId", "createdAt");
CREATE INDEX IF NOT EXISTS "doc_sources_docId_idx" ON "doc_sources"("docId");
CREATE INDEX IF NOT EXISTS "doc_quotes_docId_idx" ON "doc_quotes"("docId");

DO $$ BEGIN
  ALTER TABLE "doc_folders" ADD CONSTRAINT "doc_folders_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_folders" ADD CONSTRAINT "doc_folders_parentId_fkey"
    FOREIGN KEY ("parentId") REFERENCES "doc_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "docs" ADD CONSTRAINT "docs_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "docs" ADD CONSTRAINT "docs_folderId_fkey"
    FOREIGN KEY ("folderId") REFERENCES "doc_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_tags" ADD CONSTRAINT "doc_tags_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_tags_on_docs" ADD CONSTRAINT "doc_tags_on_docs_docId_fkey"
    FOREIGN KEY ("docId") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_tags_on_docs" ADD CONSTRAINT "doc_tags_on_docs_tagId_fkey"
    FOREIGN KEY ("tagId") REFERENCES "doc_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_tasks" ADD CONSTRAINT "doc_tasks_docId_fkey"
    FOREIGN KEY ("docId") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_tasks" ADD CONSTRAINT "doc_tasks_taskId_fkey"
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_versions" ADD CONSTRAINT "doc_versions_docId_fkey"
    FOREIGN KEY ("docId") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_sources" ADD CONSTRAINT "doc_sources_docId_fkey"
    FOREIGN KEY ("docId") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_quotes" ADD CONSTRAINT "doc_quotes_docId_fkey"
    FOREIGN KEY ("docId") REFERENCES "docs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "doc_quotes" ADD CONSTRAINT "doc_quotes_sourceId_fkey"
    FOREIGN KEY ("sourceId") REFERENCES "doc_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
