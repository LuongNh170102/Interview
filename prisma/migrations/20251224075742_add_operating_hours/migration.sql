-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "is_accepting_orders" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "operating_hours" (
    "id" SERIAL NOT NULL,
    "merchant_id" INTEGER NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "open_time" TEXT NOT NULL,
    "close_time" TEXT NOT NULL,

    CONSTRAINT "operating_hours_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
