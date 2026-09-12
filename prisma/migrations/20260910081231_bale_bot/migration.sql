/*
  Warnings:

  - A unique constraint covering the columns `[baleUserId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "baleUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_baleUserId_key" ON "users"("baleUserId");
