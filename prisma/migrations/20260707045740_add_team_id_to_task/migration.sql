/*
  Warnings:

  - Added the required column `teamId` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- Create default organization
INSERT INTO "organizations" ("id", "name", "ownerId")
SELECT gen_random_uuid(), 'Default Organization', id
FROM "users"
WHERE "role" = 'ADMIN'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Create default team
INSERT INTO "teams" ("id", "organizationId", "name", "description")
SELECT gen_random_uuid(), id, 'Default Team', 'Default team for existing tasks'
FROM "organizations"
WHERE "name" = 'Default Organization'
ON CONFLICT DO NOTHING;

-- Add teamId column as nullable first
ALTER TABLE "tasks" ADD COLUMN "teamId" TEXT;

-- Backfill existing tasks with default team ID
UPDATE "tasks"
SET "teamId" = (SELECT "id" FROM "teams" WHERE "name" = 'Default Team' LIMIT 1);

-- Make teamId NOT NULL
ALTER TABLE "tasks" ALTER COLUMN "teamId" SET NOT NULL;

-- Add foreign key
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE;