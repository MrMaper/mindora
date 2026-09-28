-- AlterTable
ALTER TABLE "doc_sources" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE INDEX "doc_sources_projectId_idx" ON "doc_sources"("projectId");

-- AddForeignKey
ALTER TABLE "doc_sources" ADD CONSTRAINT "doc_sources_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
