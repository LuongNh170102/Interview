-- Add unique constraint on courier phone
CREATE UNIQUE INDEX IF NOT EXISTS "couriers_phone_key" ON "couriers" ("phone");

-- Add indexes for common query patterns to improve performance
CREATE INDEX IF NOT EXISTS "couriers_approval_status_idx" ON "couriers" ("approval_status");
CREATE INDEX IF NOT EXISTS "couriers_operational_status_idx" ON "couriers" ("operational_status");
