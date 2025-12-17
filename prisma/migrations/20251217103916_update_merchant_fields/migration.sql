-- AlterTable
ALTER TABLE "merchants" ADD COLUMN     "business_category" TEXT,
ADD COLUMN     "business_type" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "contact_name" TEXT,
ADD COLUMN     "has_business_license" BOOLEAN DEFAULT false,
ADD COLUMN     "referral_source" TEXT,
ADD COLUMN     "social_links" JSONB;
