-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_teamId_fkey";

-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "teamId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
