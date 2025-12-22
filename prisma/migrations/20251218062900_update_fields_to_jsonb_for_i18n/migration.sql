/*
  Warnings:

  - The `description` column on the `brands` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `name` column on the `categories` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `name` column on the `menus` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `menus` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `merchant_tags` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `permissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `name` column on the `product_variants` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `products` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `promotions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `role_permissions` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `description` column on the `roles` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `name` on the `menu_sections` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `products` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `name` on the `tags` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "brands" DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "name",
ADD COLUMN     "name" JSONB;

-- AlterTable
ALTER TABLE "menu_sections" DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL;

-- AlterTable
ALTER TABLE "menus" DROP COLUMN "name",
ADD COLUMN     "name" JSONB,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "merchant_tags" DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "permissions" DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "product_variants" DROP COLUMN "name",
ADD COLUMN     "name" JSONB;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL,
DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "promotions" DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "role_permissions" DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "roles" DROP COLUMN "description",
ADD COLUMN     "description" JSONB;

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "name",
ADD COLUMN     "name" JSONB NOT NULL;
