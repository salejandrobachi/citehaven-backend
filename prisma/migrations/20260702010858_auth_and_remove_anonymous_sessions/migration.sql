/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `organizations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `organizations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password_hash` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "password_hash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");
