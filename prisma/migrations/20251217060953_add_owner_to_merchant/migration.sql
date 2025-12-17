-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "owner_id" INTEGER;

-- AddForeignKey
ALTER TABLE "merchants" ADD CONSTRAINT "merchants_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
