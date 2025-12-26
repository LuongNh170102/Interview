-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "business_category" TEXT;

-- CreateTable
CREATE TABLE "merchant_categories" (
    "merchant_id" INTEGER NOT NULL,
    "category_id" INTEGER NOT NULL,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "merchant_categories_pkey" PRIMARY KEY ("merchant_id","category_id")
);

-- AddForeignKey
ALTER TABLE "merchant_categories" ADD CONSTRAINT "merchant_categories_merchant_id_fkey" FOREIGN KEY ("merchant_id") REFERENCES "merchants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "merchant_categories" ADD CONSTRAINT "merchant_categories_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
