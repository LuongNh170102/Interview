-- AlterTable: Add externalId and approval fields to couriers table
ALTER TABLE "couriers" 
  ADD COLUMN "external_id" UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "approved_by" INTEGER,
  ADD COLUMN "rejected_at" TIMESTAMP(3),
  ADD COLUMN "rejected_by" INTEGER,
  ADD COLUMN "rejection_reason" TEXT,
  ADD COLUMN "operational_status" "OperationalStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "id_card_number" TEXT,
  ADD COLUMN "date_of_birth" TIMESTAMP(3),
  ADD COLUMN "vehicle_number" TEXT;

-- AddForeignKey for approved_by
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_approved_by_fkey" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey for rejected_by
ALTER TABLE "couriers" ADD CONSTRAINT "couriers_rejected_by_fkey" FOREIGN KEY ("rejected_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
