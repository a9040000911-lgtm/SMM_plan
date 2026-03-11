/*
  Warnings:

  - You are about to drop the column `type` on the `Provider` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectId,internalServiceId,providerServiceId,providerId]` on the table `InternalServiceMapping` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,name]` on the table `Provider` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "InternalServiceMapping_internalServiceId_providerServiceId__key";

-- AlterTable
ALTER TABLE "InternalService" ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "socialPlatformId" TEXT;

-- AlterTable
ALTER TABLE "InternalServiceMapping" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "managedChannelId" TEXT;

-- AlterTable
ALTER TABLE "Provider" DROP COLUMN "type",
ADD COLUMN     "isDripFeedDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pricesCurrency" "Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "ProviderService" ADD COLUMN     "socialPlatformId" TEXT;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "platform" "Platform" NOT NULL,
    "categoryType" "Category" NOT NULL DEFAULT 'OTHER',
    "targetType" TEXT NOT NULL DEFAULT 'POST',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "socialPlatformId" TEXT,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPlatform" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameRu" TEXT,
    "keywords" TEXT[],
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagedChannel" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "chatId" BIGINT NOT NULL,
    "username" TEXT,
    "title" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB DEFAULT '{}',
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagedChannel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceCategory_projectId_idx" ON "ServiceCategory"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_projectId_platform_name_key" ON "ServiceCategory"("projectId", "platform", "name");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPlatform_slug_key" ON "SocialPlatform"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedChannel_chatId_key" ON "ManagedChannel"("chatId");

-- CreateIndex
CREATE INDEX "ManagedChannel_chatId_idx" ON "ManagedChannel"("chatId");

-- CreateIndex
CREATE INDEX "ManagedChannel_userId_idx" ON "ManagedChannel"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ManagedChannel_projectId_chatId_key" ON "ManagedChannel"("projectId", "chatId");

-- CreateIndex
CREATE UNIQUE INDEX "InternalServiceMapping_projectId_internalServiceId_provider_key" ON "InternalServiceMapping"("projectId", "internalServiceId", "providerServiceId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "Provider_projectId_name_key" ON "Provider"("projectId", "name");

-- CreateIndex
CREATE INDEX "Transaction_projectId_idx" ON "Transaction"("projectId");

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES "SocialPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedChannel" ADD CONSTRAINT "ManagedChannel_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedChannel" ADD CONSTRAINT "ManagedChannel_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagedChannel" ADD CONSTRAINT "ManagedChannel_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "InternalService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_managedChannelId_fkey" FOREIGN KEY ("managedChannelId") REFERENCES "ManagedChannel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalService" ADD CONSTRAINT "InternalService_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES "SocialPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalService" ADD CONSTRAINT "InternalService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalServiceMapping" ADD CONSTRAINT "InternalServiceMapping_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_socialPlatformId_fkey" FOREIGN KEY ("socialPlatformId") REFERENCES "SocialPlatform"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Provider" ADD CONSTRAINT "Provider_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
