/*
  Warnings:

  - You are about to drop the column `providerServiceId` on the `InternalService` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'BOOSTS';
ALTER TYPE "Category" ADD VALUE 'POLLS';
ALTER TYPE "Category" ADD VALUE 'STORIES';
ALTER TYPE "Category" ADD VALUE 'BOTS';

-- AlterTable
ALTER TABLE "InternalService" DROP COLUMN "providerServiceId";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "inviteLink" TEXT;

-- CreateTable
CREATE TABLE "InternalServiceMapping" (
    "id" TEXT NOT NULL,
    "internalServiceId" TEXT NOT NULL,
    "providerServiceId" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "reliability" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "speedRating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "InternalServiceMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InternalServiceMapping_internalServiceId_providerServiceId_key" ON "InternalServiceMapping"("internalServiceId", "providerServiceId");

-- AddForeignKey
ALTER TABLE "InternalServiceMapping" ADD CONSTRAINT "InternalServiceMapping_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES "InternalService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalServiceMapping" ADD CONSTRAINT "InternalServiceMapping_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "ProviderService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
