/*
  Warnings:

  - The `status` column on the `agencies` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `merchants` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- AlterTable
ALTER TABLE "agencies" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "merchants" DROP COLUMN "status",
ADD COLUMN     "status" "ApprovalStatus";
