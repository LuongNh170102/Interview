/*
  Warnings:

  - A unique constraint covering the columns `[external_id]` on the table `couriers` will be added. If there are existing duplicate values, this will fail.
  - The required column `external_id` was added to the `couriers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "couriers" ADD COLUMN     "external_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "couriers_external_id_key" ON "couriers"("external_id");
