/*
  Warnings:

  - The `status` column on the `couriers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[external_id]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - The required column `external_id` was added to the `couriers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourierAvailabilityStatus" AS ENUM ('OFFLINE', 'ONLINE', 'BUSY');

-- AlterTable
ALTER TABLE "couriers" ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "external_id" UUID NOT NULL,
ADD COLUMN     "operational_status" "OperationalStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" INTEGER,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status_changed_at" TIMESTAMP(3),
ADD COLUMN     "status_changed_by" INTEGER,
ADD COLUMN     "status_reason" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "CourierAvailabilityStatus" NOT NULL DEFAULT 'OFFLINE';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category_id" INTEGER,
ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

-- CreateIndex
CREATE UNIQUE INDEX "couriers_external_id_key" ON "couriers"("external_id");

-- CreateIndex
CREATE INDEX "couriers_approval_status_status_idx" ON "couriers"("approval_status", "status");

-- CreateIndex
CREATE INDEX "couriers_operational_status_idx" ON "couriers"("operational_status");

-- CreateIndex
CREATE INDEX "products_merchant_id_status_is_active_idx" ON "products"("merchant_id", "status", "is_active");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
