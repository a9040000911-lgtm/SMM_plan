/*
  Warnings:

  - A unique constraint covering the columns `[numericId]` on the table `InternalService` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ServiceType" AS ENUM ('REGULAR', 'BUNDLE');

-- AlterTable
ALTER TABLE "InternalService" ADD COLUMN     "isDripFeedDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketPrice" DECIMAL(20,2),
ADD COLUMN     "markup" DECIMAL(10,2),
ADD COLUMN     "numericId" SERIAL NOT NULL,
ADD COLUMN     "providerCurrencyOriginal" TEXT,
ADD COLUMN     "providerPriceOriginal" DECIMAL(20,6),
ADD COLUMN     "type" "ServiceType" NOT NULL DEFAULT 'REGULAR';

-- AlterTable
ALTER TABLE "ProjectServiceOverride" ADD COLUMN     "customDescription" TEXT,
ADD COLUMN     "customMaxQty" INTEGER,
ADD COLUMN     "customMinQty" INTEGER,
ADD COLUMN     "customName" TEXT,
ADD COLUMN     "customRequirements" TEXT,
ADD COLUMN     "markup" DECIMAL(10,2);

-- CreateIndex
CREATE UNIQUE INDEX "InternalService_numericId_key" ON "InternalService"("numericId");
