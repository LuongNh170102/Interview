/*
  Warnings:

  - The `status` column on the `couriers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `vehicle_type` column on the `couriers` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[phone]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[email]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "CourierStatus" AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE', 'ONLINE');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('BIKE', 'MOTORBIKE', 'CAR');

-- AlterTable
ALTER TABLE "couriers" ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" INTEGER,
ADD COLUMN     "rejection_reason" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "CourierStatus" NOT NULL DEFAULT 'OFFLINE',
DROP COLUMN "vehicle_type",
ADD COLUMN     "vehicle_type" "VehicleType";

-- CreateIndex
CREATE UNIQUE INDEX "couriers_phone_key" ON "couriers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "couriers_email_key" ON "couriers"("email");
