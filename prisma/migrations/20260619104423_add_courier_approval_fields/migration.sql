-- AlterTable
ALTER TABLE "couriers" ADD COLUMN     "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "approved_at" TIMESTAMP(3),
ADD COLUMN     "approved_by" INTEGER,
ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "rejected_at" TIMESTAMP(3),
ADD COLUMN     "rejected_by" INTEGER,
ADD COLUMN     "rejection_reason" TEXT,
ALTER COLUMN "status" SET DEFAULT 'offline';

-- CreateIndex
CREATE INDEX "couriers_approval_status_idx" ON "couriers"("approval_status");

-- CreateIndex
CREATE INDEX "couriers_status_idx" ON "couriers"("status");
