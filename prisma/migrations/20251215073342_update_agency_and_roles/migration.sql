/*
  Warnings:

  - You are about to drop the `merchant_users` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[user_id,role_id,merchant_id,agency_id,brand_id]` on the table `user_roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "merchant_users" DROP CONSTRAINT "merchant_users_merchant_id_fkey";

-- DropForeignKey
ALTER TABLE "merchant_users" DROP CONSTRAINT "merchant_users_user_id_fkey";

-- DropIndex
DROP INDEX "user_roles_user_id_role_id_merchant_id_key";

-- AlterTable
ALTER TABLE "agencies" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "owner_id" INTEGER,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "agency_id" INTEGER,
ADD COLUMN     "brand_id" INTEGER;

-- DropTable
DROP TABLE "merchant_users";

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_user_id_role_id_merchant_id_agency_id_brand_id_key" ON "user_roles"("user_id", "role_id", "merchant_id", "agency_id", "brand_id");

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_agency_id_fkey" FOREIGN KEY ("agency_id") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
