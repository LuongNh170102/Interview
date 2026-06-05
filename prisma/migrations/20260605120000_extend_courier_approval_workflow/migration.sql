-- CreateEnum
CREATE TYPE "CourierAvailabilityStatus" AS ENUM ('ONLINE', 'OFFLINE', 'BUSY');

-- AlterTable: add new columns
ALTER TABLE "couriers"
ADD COLUMN "external_id" UUID,
ADD COLUMN "email" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "approved_at" TIMESTAMP(3),
ADD COLUMN "approved_by" INTEGER,
ADD COLUMN "rejected_at" TIMESTAMP(3),
ADD COLUMN "rejected_by" INTEGER,
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "operational_status" "OperationalStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "availability_status" "CourierAvailabilityStatus" NOT NULL DEFAULT 'OFFLINE';

-- Backfill external_id for existing rows
UPDATE "couriers" SET "external_id" = gen_random_uuid() WHERE "external_id" IS NULL;

-- Migrate legacy status string to availability_status
UPDATE "couriers"
SET "availability_status" = CASE
  WHEN "status" = 'available' THEN 'ONLINE'::"CourierAvailabilityStatus"
  WHEN "status" = 'busy' THEN 'BUSY'::"CourierAvailabilityStatus"
  ELSE 'OFFLINE'::"CourierAvailabilityStatus"
END;

-- Drop legacy status column
ALTER TABLE "couriers" DROP COLUMN "status";

-- Enforce external_id NOT NULL and default for new rows
ALTER TABLE "couriers"
ALTER COLUMN "external_id" SET NOT NULL,
ALTER COLUMN "external_id" SET DEFAULT gen_random_uuid();

-- CreateIndex
CREATE UNIQUE INDEX "couriers_external_id_key" ON "couriers"("external_id");

-- CreateIndex (phone unique — PostgreSQL allows multiple NULLs)
CREATE UNIQUE INDEX "couriers_phone_key" ON "couriers"("phone");

-- CreateIndex
CREATE INDEX "couriers_approval_status_idx" ON "couriers"("approval_status");

-- CreateIndex
CREATE INDEX "couriers_availability_status_idx" ON "couriers"("availability_status");
