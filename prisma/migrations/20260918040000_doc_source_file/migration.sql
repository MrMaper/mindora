-- AlterTable
ALTER TABLE "doc_sources" ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
ALTER TABLE "doc_sources" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
