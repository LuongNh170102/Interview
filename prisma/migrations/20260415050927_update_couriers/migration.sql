/*
  Warnings:

  - You are about to drop the column `status` on the `couriers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[external_id]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - The required column `external_id` was added to the `couriers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `vehicle_plate` to the `couriers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle_type` to the `couriers` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CourierActiveStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'MOTORBIKE', 'CAR');

-- AlterTable
ALTER TABLE "couriers" DROP COLUMN "status",
ADD COLUMN     "active_status" "CourierActiveStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "external_id" UUID NOT NULL,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" INTEGER,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "status_changed_at" TIMESTAMP(3),
ADD COLUMN     "vehicle_plate" TEXT NOT NULL,
DROP COLUMN "vehicle_type",
ADD COLUMN     "vehicle_type" "VehicleType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "couriers_external_id_key" ON "couriers"("external_id");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_phone_key" ON "couriers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_email_key" ON "couriers"("email");

-- CreateIndex
CREATE INDEX "couriers_external_id_idx" ON "couriers"("external_id");

-- CreateIndex
CREATE INDEX "couriers_created_at_idx" ON "couriers"("created_at");

-- CreateIndex
CREATE INDEX "couriers_active_status_idx" ON "couriers"("active_status");

-- CreateIndex
CREATE INDEX "couriers_approval_status_active_status_created_at_idx" ON "couriers"("approval_status", "active_status", "created_at");
