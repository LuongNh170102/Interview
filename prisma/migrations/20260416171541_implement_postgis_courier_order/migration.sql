/*
  Warnings:

  - You are about to drop the column `current_location` on the `couriers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "couriers" DROP COLUMN "current_location",
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_lat" DOUBLE PRECISION,
ADD COLUMN     "delivery_lng" DOUBLE PRECISION;
