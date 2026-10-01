-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "completedAt" TIMESTAMP(3);

-- Existing done tasks keep their last write as the completion time.
UPDATE "tasks" SET "completedAt" = "updatedAt" WHERE "status" = 'DONE' AND "completedAt" IS NULL;
