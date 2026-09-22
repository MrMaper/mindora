-- AlterTable
ALTER TABLE "docs" ADD COLUMN "projectId" TEXT;

-- CreateIndex
CREATE INDEX "docs_userId_projectId_idx" ON "docs"("userId", "projectId");

-- AddForeignKey
ALTER TABLE "docs" ADD CONSTRAINT "docs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
