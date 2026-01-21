-- Step 1: Rename status column to approval_status
ALTER TABLE "agencies" RENAME COLUMN "status" TO "approval_status";
ALTER TABLE "merchants" RENAME COLUMN "status" TO "approval_status";

-- Step 2: Create OperationalStatus enum
CREATE TYPE "OperationalStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED');

-- Step 3: Add new columns to agencies
ALTER TABLE "agencies"
ADD COLUMN "approved_at" TIMESTAMP(3),
ADD COLUMN "approved_by" INTEGER,
ADD COLUMN "rejected_at" TIMESTAMP(3),
ADD COLUMN "rejected_by" INTEGER,
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "operational_status" "OperationalStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "status_changed_at" TIMESTAMP(3),
ADD COLUMN "status_changed_by" INTEGER,
ADD COLUMN "status_reason" TEXT;

-- Step 4: Add new columns to merchants
ALTER TABLE "merchants"
ADD COLUMN "approved_at" TIMESTAMP(3),
ADD COLUMN "approved_by" INTEGER,
ADD COLUMN "rejected_at" TIMESTAMP(3),
ADD COLUMN "rejected_by" INTEGER,
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "operational_status" "OperationalStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN "status_changed_at" TIMESTAMP(3),
ADD COLUMN "status_changed_by" INTEGER,
ADD COLUMN "status_reason" TEXT;

-- Step 5: Migrate any SUSPENDED records to use operationalStatus instead
-- (This only affects records if they exist)
UPDATE "agencies" 
SET "operational_status" = 'SUSPENDED'::"OperationalStatus", 
    "approval_status" = 'APPROVED'::"ApprovalStatus"
WHERE "approval_status" = 'SUSPENDED'::"ApprovalStatus";

UPDATE "merchants" 
SET "operational_status" = 'SUSPENDED'::"OperationalStatus", 
    "approval_status" = 'APPROVED'::"ApprovalStatus"
WHERE "approval_status" = 'SUSPENDED'::"ApprovalStatus";

-- Step 6: Remove SUSPENDED from ApprovalStatus enum
-- Drop defaults before type change
ALTER TABLE "agencies" ALTER COLUMN "approval_status" DROP DEFAULT;
ALTER TABLE "merchants" ALTER COLUMN "approval_status" DROP DEFAULT;

-- Create new enum without SUSPENDED
CREATE TYPE "ApprovalStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- Update columns to use new enum
ALTER TABLE "agencies" 
ALTER COLUMN "approval_status" TYPE "ApprovalStatus_new" 
USING "approval_status"::text::"ApprovalStatus_new";

ALTER TABLE "merchants" 
ALTER COLUMN "approval_status" TYPE "ApprovalStatus_new" 
USING "approval_status"::text::"ApprovalStatus_new";

-- Drop old enum and rename new one
DROP TYPE "ApprovalStatus";
ALTER TYPE "ApprovalStatus_new" RENAME TO "ApprovalStatus";

-- Step 7: Restore defaults and set NOT NULL
ALTER TABLE "agencies" ALTER COLUMN "approval_status" SET DEFAULT 'PENDING'::"ApprovalStatus";
ALTER TABLE "merchants" ALTER COLUMN "approval_status" SET NOT NULL;
ALTER TABLE "merchants" ALTER COLUMN "approval_status" SET DEFAULT 'PENDING'::"ApprovalStatus";
