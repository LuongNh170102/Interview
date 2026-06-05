ALTER TABLE "couriers"
  ADD COLUMN IF NOT EXISTS "external_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS "email" TEXT,
  ADD COLUMN IF NOT EXISTS "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "approved_by" INTEGER,
  ADD COLUMN IF NOT EXISTS "rejected_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "rejected_by" INTEGER,
  ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
  ADD COLUMN IF NOT EXISTS "operational_status" "OperationalStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "status_changed_at" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "status_changed_by" INTEGER,
  ADD COLUMN IF NOT EXISTS "status_reason" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "couriers_external_id_key"
  ON "couriers"("external_id");

CREATE INDEX IF NOT EXISTS "couriers_approval_status_idx"
  ON "couriers"("approval_status");

CREATE INDEX IF NOT EXISTS "couriers_operational_status_idx"
  ON "couriers"("operational_status");

CREATE INDEX IF NOT EXISTS "couriers_status_idx"
  ON "couriers"("status");
