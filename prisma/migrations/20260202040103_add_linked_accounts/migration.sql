-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK', 'APPLE', 'KAKAO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "avatar_url" TEXT,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "linked_accounts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_id" TEXT NOT NULL,
    "email" TEXT,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "linked_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_provider_provider_id_key" ON "linked_accounts"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "linked_accounts_user_id_provider_key" ON "linked_accounts"("user_id", "provider");

-- AddForeignKey
ALTER TABLE "linked_accounts" ADD CONSTRAINT "linked_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
