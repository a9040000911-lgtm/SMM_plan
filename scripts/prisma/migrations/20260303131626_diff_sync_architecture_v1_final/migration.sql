/*
  Warnings:

  - The primary key for the `ProviderService` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `lastUpdated` on the `ProviderService` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,internalServiceId,providerId]` on the table `InternalServiceMapping` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[providerId,externalId]` on the table `ProviderService` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,socialPlatformId,slug]` on the table `ServiceCategory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dataHash` to the `ProviderService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `externalId` to the `ProviderService` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `ProviderService` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "InternalServiceMapping" DROP CONSTRAINT "InternalServiceMapping_providerServiceId_providerId_fkey";

-- DropIndex
DROP INDEX "InternalServiceMapping_projectId_internalServiceId_provider_key";

-- DropIndex
DROP INDEX "ProviderService_providerId_rawPrice_idx";

-- AlterTable
ALTER TABLE "InternalServiceMapping" ALTER COLUMN "providerServiceId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ProjectServiceOverride" ADD COLUMN     "categoryId" TEXT;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "syncLock" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "ProviderService" DROP CONSTRAINT "ProviderService_pkey",
DROP COLUMN "lastUpdated",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dataHash" VARCHAR(32) NOT NULL,
ADD COLUMN     "externalId" TEXT NOT NULL,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "InternalServiceMapping_projectId_internalServiceId_provider_key" ON "InternalServiceMapping"("projectId", "internalServiceId", "providerId");

-- CreateIndex
CREATE INDEX "ProviderService_providerId_idx" ON "ProviderService"("providerId");

-- CreateIndex
CREATE INDEX "ProviderService_dataHash_idx" ON "ProviderService"("dataHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderService_providerId_externalId_key" ON "ProviderService"("providerId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_projectId_socialPlatformId_slug_key" ON "ServiceCategory"("projectId", "socialPlatformId", "slug");

-- AddForeignKey
ALTER TABLE "ProjectServiceOverride" ADD CONSTRAINT "ProjectServiceOverride_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalServiceMapping" ADD CONSTRAINT "InternalServiceMapping_providerServiceId_fkey" FOREIGN KEY ("providerServiceId") REFERENCES "ProviderService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
