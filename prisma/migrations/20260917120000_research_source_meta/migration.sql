-- CreateEnum
CREATE TYPE "SourceReadingStatus" AS ENUM ('TO_READ', 'READING', 'DONE');

-- AlterTable
ALTER TABLE "doc_sources" ADD COLUMN "doi" TEXT;
ALTER TABLE "doc_sources" ADD COLUMN "readingStatus" "SourceReadingStatus" NOT NULL DEFAULT 'TO_READ';

-- CreateIndex
CREATE INDEX "doc_sources_readingStatus_idx" ON "doc_sources"("readingStatus");
