-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "products" ADD COLUMN "publish_status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

UPDATE "products" SET "publish_status" = 'PUBLISHED' WHERE "is_active" = true;
UPDATE "products" SET "publish_status" = 'ARCHIVED' WHERE "is_active" = false;

CREATE INDEX "products_publish_status_idx" ON "products"("publish_status");
