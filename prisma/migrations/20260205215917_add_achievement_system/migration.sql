/*
  Warnings:

  - You are about to drop the column `providerName` on the `InternalServiceMapping` table. All the data in the column will be lost.
  - The primary key for the `ProviderService` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `providerName` on the `ProviderService` table. All the data in the column will be lost.
  - The primary key for the `Settings` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[slug]` on the table `InternalService` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[internalServiceId,providerServiceId,providerId]` on the table `InternalServiceMapping` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,code]` on the table `PromoCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,userId]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,key]` on the table `Settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,tgId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,email]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,earlyBirdRank]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerId` to the `InternalServiceMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `ProviderService` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `Settings` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'REFUND', 'REFERRAL_BONUS', 'LOYALTY_BONUS', 'MANUAL_ADJUSTMENT');

-- CreateEnum
CREATE TYPE "BusinessExpenseType" AS ENUM ('ADVERTISING', 'SALARIES', 'INFRASTRUCTURE', 'SERVICES', 'OTHER');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SALARY', 'MARKETING', 'SEO', 'ADS', 'TAX', 'SERVER', 'OFFICE', 'OTHER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'PENDING', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('USER', 'STAFF', 'SYSTEM', 'INTERNAL');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('RUB', 'USD', 'EUR', 'KZT', 'UAH');

-- CreateEnum
CREATE TYPE "BugSeverity" AS ENUM ('MINOR', 'MAJOR', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('PENDING', 'REVIEWING', 'ACCEPTED', 'REJECTED', 'DUPLICATE');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('FIRST_BLOOD', 'HOT_STREAK', 'REFERRAL_KING', 'SPEED_DEMON', 'BULLSEYE', 'PIONEER_LEGEND', 'BIG_SPENDER', 'LOYAL_CUSTOMER', 'EARLY_ADOPTER', 'SOCIAL_BUTTERFLY');

-- CreateEnum
CREATE TYPE "ChallengeType" AS ENUM ('TRIPLE_THREAT', 'SOCIAL_SHARE', 'EARLY_BIRD', 'WEEKEND_WARRIOR', 'SPENDING_SPREE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'RECOVER';
ALTER TYPE "Category" ADD VALUE 'PREMIUM';
ALTER TYPE "Category" ADD VALUE 'TRAFFIC';
ALTER TYPE "Category" ADD VALUE 'DISLIKES';
ALTER TYPE "Category" ADD VALUE 'GROUPS';
ALTER TYPE "Category" ADD VALUE 'STREAMS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "OrderStatus" ADD VALUE 'AWAITING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE 'IN_PROGRESS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'RUTUBE';
ALTER TYPE "Platform" ADD VALUE 'DZEN';
ALTER TYPE "Platform" ADD VALUE 'MUSIC';
ALTER TYPE "Platform" ADD VALUE 'OK';
ALTER TYPE "Platform" ADD VALUE 'LIKEE';
ALTER TYPE "Platform" ADD VALUE 'WHATSAPP';
ALTER TYPE "Platform" ADD VALUE 'SPOTIFY';
ALTER TYPE "Platform" ADD VALUE 'SOUNDCLOUD';
ALTER TYPE "Platform" ADD VALUE 'LINKEDIN';
ALTER TYPE "Platform" ADD VALUE 'PINTEREST';
ALTER TYPE "Platform" ADD VALUE 'SNAPCHAT';
ALTER TYPE "Platform" ADD VALUE 'TROVO';
ALTER TYPE "Platform" ADD VALUE 'KWAI';
ALTER TYPE "Platform" ADD VALUE 'MESSENGER_MAX';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Role" ADD VALUE 'SUPPORT';
ALTER TYPE "Role" ADD VALUE 'SEO';

-- DropForeignKey
ALTER TABLE "InternalServiceMapping" DROP CONSTRAINT "InternalServiceMapping_providerServiceId_providerName_fkey";

-- DropIndex
DROP INDEX "InternalServiceMapping_internalServiceId_providerServiceId__key";

-- DropIndex
DROP INDEX "PromoCode_code_key";

-- DropIndex
DROP INDEX "Session_userId_key";

-- DropIndex
DROP INDEX "User_tgId_key";

-- AlterTable
ALTER TABLE "InternalService" ADD COLUMN     "avgDropRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "guaranteeDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "isCurated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "requirements" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "InternalServiceMapping" DROP COLUMN "providerName",
ADD COLUMN     "providerId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "News" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "batchOrderId" TEXT,
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "PromoCode" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "balanceThreshold" DECIMAL(20,2) NOT NULL DEFAULT 1000.00,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'universal';

-- AlterTable
ALTER TABLE "ProviderService" DROP CONSTRAINT "ProviderService_pkey",
DROP COLUMN "providerName",
ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "isIgnored" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "platform" "Platform" NOT NULL DEFAULT 'OTHER',
ADD COLUMN     "providerId" TEXT NOT NULL,
ADD CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id", "providerId");

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "Settings" DROP CONSTRAINT "Settings_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "projectId" TEXT,
ADD CONSTRAINT "Settings_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'RUB',
ADD COLUMN     "projectId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allowedTabs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "banExpiresAt" TIMESTAMP(3),
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'RUB',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "earlyBirdRank" INTEGER,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isEarlyBird" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isGlobalAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isPermanentlyBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastActionAt" TIMESTAMP(3),
ADD COLUMN     "lastNotificationAt" TIMESTAMP(3),
ADD COLUMN     "moderationNote" TEXT,
ADD COLUMN     "password" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "reviewRewardUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "supportNotes" TEXT,
ADD COLUMN     "twoFactorCode" TEXT,
ADD COLUMN     "twoFactorExpires" TIMESTAMP(3),
ADD COLUMN     "warningCount" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "tgId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "botToken" TEXT,
    "botUsername" TEXT,
    "config" JSONB,
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "brandColor" TEXT NOT NULL DEFAULT '#3b82f6',
    "pricingRules" JSONB,
    "safetySettings" JSONB,
    "paymentSettings" JSONB,
    "loyaltySettings" JSONB,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutoMonitoring" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "internalServiceId" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "postsLimit" INTEGER NOT NULL,
    "postsProcessed" INTEGER NOT NULL DEFAULT 0,
    "lastPostId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutoMonitoring_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectServiceOverride" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "internalServiceId" TEXT NOT NULL,
    "customPrice" DECIMAL(20,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ProjectServiceOverride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'RUB',
    "balanceBefore" DECIMAL(20,2) NOT NULL,
    "balanceAfter" DECIMAL(20,2) NOT NULL,
    "type" "LedgerEntryType" NOT NULL,
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "orderId" TEXT,
    "verifiedEmail" TEXT,
    "verifiedUserId" TEXT,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "imageUrl" TEXT,
    "voiceUrl" TEXT,
    "staffUsername" TEXT,
    "fileUrl" TEXT,
    "videoUrl" TEXT,

    CONSTRAINT "SupportMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportMacro" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "text" TEXT NOT NULL,
    "actions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportMacro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusinessExpense" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "amount" DECIMAL(20,2) NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchOrder" (
    "id" TEXT NOT NULL,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "totalAmount" DECIMAL(20,2) NOT NULL,
    "orderCount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "trigger" TEXT NOT NULL,
    "reward" TEXT NOT NULL,
    "value" DECIMAL(20,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CurrencyRate" (
    "code" "Currency" NOT NULL,
    "rate" DECIMAL(20,6) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CurrencyRate_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "BugSeverity" NOT NULL DEFAULT 'MINOR',
    "status" "BugStatus" NOT NULL DEFAULT 'PENDING',
    "screenshotUrl" TEXT,
    "stepsToReproduce" TEXT,
    "rewardAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rewardPaid" BOOLEAN NOT NULL DEFAULT false,
    "adminNotes" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "moderatedBy" TEXT,
    "moderatedAt" TIMESTAMP(3),
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "claimedAt" TIMESTAMP(3),

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Challenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "ChallengeType" NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "target" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StaffProjects" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StaffProjects_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_domain_key" ON "Project"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Project_botToken_key" ON "Project"("botToken");

-- CreateIndex
CREATE INDEX "AutoMonitoring_projectId_isActive_idx" ON "AutoMonitoring"("projectId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectServiceOverride_projectId_internalServiceId_key" ON "ProjectServiceOverride"("projectId", "internalServiceId");

-- CreateIndex
CREATE INDEX "LedgerEntry_projectId_idx" ON "LedgerEntry"("projectId");

-- CreateIndex
CREATE INDEX "LedgerEntry_userId_idx" ON "LedgerEntry"("userId");

-- CreateIndex
CREATE INDEX "LedgerEntry_createdAt_idx" ON "LedgerEntry"("createdAt");

-- CreateIndex
CREATE INDEX "SupportTicket_verifiedUserId_idx" ON "SupportTicket"("verifiedUserId");

-- CreateIndex
CREATE INDEX "SupportTicket_orderId_idx" ON "SupportTicket"("orderId");

-- CreateIndex
CREATE INDEX "SupportTicket_verifiedEmail_idx" ON "SupportTicket"("verifiedEmail");

-- CreateIndex
CREATE INDEX "BusinessExpense_projectId_idx" ON "BusinessExpense"("projectId");

-- CreateIndex
CREATE INDEX "LoyaltyLog_projectId_createdAt_idx" ON "LoyaltyLog"("projectId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyLog_userId_trigger_key" ON "LoyaltyLog"("userId", "trigger");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_projectId_slug_key" ON "LegalDocument"("projectId", "slug");

-- CreateIndex
CREATE INDEX "BugReport_userId_idx" ON "BugReport"("userId");

-- CreateIndex
CREATE INDEX "BugReport_projectId_idx" ON "BugReport"("projectId");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "Review"("userId");

-- CreateIndex
CREATE INDEX "Review_projectId_idx" ON "Review"("projectId");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "Review"("rating");

-- CreateIndex
CREATE INDEX "Achievement_userId_idx" ON "Achievement"("userId");

-- CreateIndex
CREATE INDEX "Achievement_type_idx" ON "Achievement"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_userId_type_key" ON "Achievement"("userId", "type");

-- CreateIndex
CREATE INDEX "Challenge_userId_completed_idx" ON "Challenge"("userId", "completed");

-- CreateIndex
CREATE INDEX "Challenge_expiresAt_idx" ON "Challenge"("expiresAt");

-- CreateIndex
CREATE INDEX "_StaffProjects_B_index" ON "_StaffProjects"("B");

-- CreateIndex
CREATE UNIQUE INDEX "InternalService_slug_key" ON "InternalService"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "InternalServiceMapping_internalServiceId_providerServiceId__key" ON "InternalServiceMapping"("internalServiceId", "providerServiceId", "providerId");

-- CreateIndex
CREATE UNIQUE INDEX "PromoCode_projectId_code_key" ON "PromoCode"("projectId", "code");

-- CreateIndex
CREATE INDEX "ProviderService_providerId_rawPrice_idx" ON "ProviderService"("providerId", "rawPrice");

-- CreateIndex
CREATE UNIQUE INDEX "Session_projectId_userId_key" ON "Session"("projectId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_projectId_key_key" ON "Settings"("projectId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "User_projectId_tgId_key" ON "User"("projectId", "tgId");

-- CreateIndex
CREATE UNIQUE INDEX "User_projectId_email_key" ON "User"("projectId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "User_projectId_earlyBirdRank_key" ON "User"("projectId", "earlyBirdRank");

-- AddForeignKey
ALTER TABLE "AutoMonitoring" ADD CONSTRAINT "AutoMonitoring_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES "InternalService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoMonitoring" ADD CONSTRAINT "AutoMonitoring_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutoMonitoring" ADD CONSTRAINT "AutoMonitoring_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectServiceOverride" ADD CONSTRAINT "ProjectServiceOverride_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES "InternalService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectServiceOverride" ADD CONSTRAINT "ProjectServiceOverride_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_verifiedUserId_fkey" FOREIGN KEY ("verifiedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportMessage" ADD CONSTRAINT "SupportMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusinessExpense" ADD CONSTRAINT "BusinessExpense_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalServiceMapping" ADD CONSTRAINT "InternalServiceMapping_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalServiceMapping" ADD CONSTRAINT "InternalServiceMapping_providerServiceId_providerId_fkey" FOREIGN KEY ("providerServiceId", "providerId") REFERENCES "ProviderService"("id", "providerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyLog" ADD CONSTRAINT "LoyaltyLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyLog" ADD CONSTRAINT "LoyaltyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDocument" ADD CONSTRAINT "LegalDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Achievement" ADD CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffProjects" ADD CONSTRAINT "_StaffProjects_A_fkey" FOREIGN KEY ("A") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StaffProjects" ADD CONSTRAINT "_StaffProjects_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
