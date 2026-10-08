-- CreateTable
CREATE TABLE "customer" (
    "id" SERIAL NOT NULL,
    "fullname" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_mobile_key" ON "customer"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");
