-- CreateEnum
CREATE TYPE "ProviderPaymentType" AS ENUM ('TOPUP', 'REFUND', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "ProviderPayment" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "type" "ProviderPaymentType" NOT NULL,
    "description" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProviderPayment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProviderPayment" ADD CONSTRAINT "ProviderPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;
