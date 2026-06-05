-- AlterTable: courier soft delete + email unique
ALTER TABLE "couriers" ADD COLUMN "deleted_at" TIMESTAMP(3);
CREATE UNIQUE INDEX "couriers_email_key" ON "couriers"("email");
CREATE INDEX "couriers_created_at_idx" ON "couriers"("created_at");

-- AlterTable: OTP failed attempts + index
ALTER TABLE "otp_verifications" ADD COLUMN "failed_attempts" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX "otp_verifications_phone_created_at_idx" ON "otp_verifications"("phone", "created_at");

-- CreateTable: courier approval audit log
CREATE TABLE "courier_approval_audits" (
    "id" SERIAL NOT NULL,
    "courier_id" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "performed_by" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "courier_approval_audits_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "courier_approval_audits_courier_id_idx" ON "courier_approval_audits"("courier_id");
CREATE INDEX "courier_approval_audits_created_at_idx" ON "courier_approval_audits"("created_at");

ALTER TABLE "courier_approval_audits" ADD CONSTRAINT "courier_approval_audits_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "couriers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
