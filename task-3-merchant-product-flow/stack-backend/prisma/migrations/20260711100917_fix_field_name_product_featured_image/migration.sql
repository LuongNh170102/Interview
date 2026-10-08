/*
  Warnings:

  - You are about to drop the column `producFeatureImage` on the `ordersDetail` table. All the data in the column will be lost.
  - Added the required column `productFeaturedImage` to the `ordersDetail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ordersDetail" DROP COLUMN "producFeatureImage",
ADD COLUMN     "productFeaturedImage" TEXT NOT NULL;
