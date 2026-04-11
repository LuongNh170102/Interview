-- Migration: Add full Courier model with approval flow (similar to Agency & Merchant)
-- Date: 2026-04-10
-- Author: Grok (for TASK 2)

-- Step 1: Create new enum if not exists (ApprovalStatus and OperationalStatus already exist)
-- No need to create again if they are already in schema

-- Step 2: Create Courier table with full approval & operational status
CREATE TABLE IF NOT EXISTS "couriers" (
    "id" SERIAL NOT NULL,
    "external_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    
    -- Personal Information
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "avatar_url" TEXT,
    "identity_card" TEXT,                    -- CCCD / CMND
    "address" TEXT,
    "city" TEXT,

    -- Vehicle Information
    "vehicle_type" TEXT,                     -- motorbike, car, bicycle
    "vehicle_plate" TEXT,
    "license_number" TEXT,

    -- Banking Information
    "bank_account" TEXT,
    "bank_name" TEXT,

    -- Approval Flow (One-time registration approval)
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approved_at" TIMESTAMP(3),
    "approved_by" INTEGER,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" INTEGER,
    "rejection_reason" TEXT,

    -- Operational Status (can change multiple times)
    "operational_status" "OperationalStatus" NOT NULL DEFAULT 'ACTIVE',
    "status_changed_at" TIMESTAMP(3),
    "status_changed_by" INTEGER,
    "status_reason" TEXT,

    -- Relationship with User (1 Courier = 1 User with COURIER role)
    "user_id" INTEGER NOT NULL,

    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "couriers_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add unique constraints
CREATE UNIQUE INDEX "couriers_external_id_key" ON "couriers"("external_id");
CREATE UNIQUE INDEX "couriers_phone_key" ON "couriers"("phone");
CREATE UNIQUE INDEX "couriers_email_key" ON "couriers"("email") WHERE email IS NOT NULL;
CREATE UNIQUE INDEX "couriers_user_id_key" ON "couriers"("user_id");

-- Step 4: Add indexes for performance
CREATE INDEX "couriers_approval_status_idx" ON "couriers"("approval_status");
CREATE INDEX "couriers_created_at_idx" ON "couriers"("created_at");
CREATE INDEX "couriers_phone_idx" ON "couriers"("phone");

-- Step 5: Add foreign keys
ALTER TABLE "couriers" 
ADD CONSTRAINT "couriers_user_id_fkey" 
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "couriers" 
ADD CONSTRAINT "couriers_approved_by_fkey" 
FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "couriers" 
ADD CONSTRAINT "couriers_rejected_by_fkey" 
FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "couriers" 
ADD CONSTRAINT "couriers_status_changed_by_fkey" 
FOREIGN KEY ("status_changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 6: Update existing orders table to ensure courier_id is valid
ALTER TABLE "orders" 
ADD CONSTRAINT "orders_courier_id_fkey" 
FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Optional: Add comment for documentation
COMMENT ON TABLE "couriers" IS 'Courier registration with full approval workflow similar to Agency and Merchant';
COMMENT ON COLUMN "couriers"."approval_status" IS 'One-time approval status for registration';
COMMENT ON COLUMN "couriers"."operational_status" IS 'Ongoing operational status (can change)';