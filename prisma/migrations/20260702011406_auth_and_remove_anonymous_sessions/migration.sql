/*
  Warnings:

  - You are about to drop the column `anonymous_session_id` on the `vaults` table. All the data in the column will be lost.
  - Made the column `owner_user_id` on table `vaults` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "vaults" DROP CONSTRAINT "vaults_owner_user_id_fkey";

-- AlterTable
ALTER TABLE "vaults" DROP COLUMN "anonymous_session_id",
ALTER COLUMN "owner_user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "vaults" ADD CONSTRAINT "vaults_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
