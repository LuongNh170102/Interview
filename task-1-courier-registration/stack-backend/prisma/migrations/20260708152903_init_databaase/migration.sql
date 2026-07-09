-- CreateTable
CREATE TABLE "status" (
    "id" SERIAL NOT NULL,
    "tag_name" TEXT NOT NULL,

    CONSTRAINT "status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_tag_name_key" ON "status"("tag_name");
