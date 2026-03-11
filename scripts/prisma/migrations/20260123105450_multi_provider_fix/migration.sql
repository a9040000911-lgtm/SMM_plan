/*
  Warnings:

  - The primary key for the `ProviderService` table will be changed. If it partially fails, a table could be left without a primary key constraint.
  - A unique constraint covering the columns `[internalServiceId,providerServiceId,providerName]` on the table `InternalServiceMapping` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `providerName` to the `InternalServiceMapping` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerId` to the `ProviderBalanceLog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `providerName` to the `ProviderService` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Create the new table for Providers
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiUrl" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Provider_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_name_key" ON "Provider"("name");

-- Step 2: Insert the default provider 'vexboost' with a placeholder UUID and credentials
-- IMPORTANT: User will need to update the apiKey and apiUrl manually later
INSERT INTO "Provider" ("id", "name", "apiKey", "apiUrl") VALUES ('clsc2zqgq0000e8zz90ge9dss', 'vexboost', 'PLEASE_UPDATE_YOUR_API_KEY', 'https://vexboost.ru/api/v2');

-- Step 3: Modify ProviderService table
-- Drop foreign key constraint from InternalServiceMapping that depends on the old primary key
ALTER TABLE "InternalServiceMapping" DROP CONSTRAINT "InternalServiceMapping_providerServiceId_fkey";
-- Drop old unique index from InternalServiceMapping
DROP INDEX "InternalServiceMapping_internalServiceId_providerServiceId_key";
-- Drop the old primary key from ProviderService
ALTER TABLE "ProviderService" DROP CONSTRAINT "ProviderService_pkey";
-- Add providerName column as optional
ALTER TABLE "ProviderService" ADD COLUMN "providerName" TEXT;
-- Populate the new column for existing rows
UPDATE "ProviderService" SET "providerName" = 'vexboost' WHERE "providerName" IS NULL;
-- Make the column required
ALTER TABLE "ProviderService" ALTER COLUMN "providerName" SET NOT NULL;
-- Add the new composite primary key
ALTER TABLE "ProviderService" ADD CONSTRAINT "ProviderService_pkey" PRIMARY KEY ("id", "providerName");

-- Step 4: Modify InternalServiceMapping table
-- Add providerName column as optional
ALTER TABLE "InternalServiceMapping" ADD COLUMN "providerName" TEXT;
-- Populate the new column for existing rows
UPDATE "InternalServiceMapping" SET "providerName" = 'vexboost' WHERE "providerName" IS NULL;
-- Make the column required
ALTER TABLE "InternalServiceMapping" ALTER COLUMN "providerName" SET NOT NULL;
-- Add the new foreign key constraint pointing to the new composite key
ALTER TABLE "InternalServiceMapping" ADD CONSTRAINT "InternalServiceMapping_providerServiceId_providerName_fkey" FOREIGN KEY ("providerServiceId", "providerName") REFERENCES "ProviderService"("id", "providerName") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Create the new unique index
CREATE UNIQUE INDEX "InternalServiceMapping_internalServiceId_providerServiceId__key" ON "InternalServiceMapping"("internalServiceId", "providerServiceId", "providerName");

-- Step 5: Modify ProviderBalanceLog table
-- Add providerId column as optional
ALTER TABLE "ProviderBalanceLog" ADD COLUMN "providerId" TEXT;
-- Populate the new column with the placeholder UUID for 'vexboost'
UPDATE "ProviderBalanceLog" SET "providerId" = 'clsc2zqgq0000e8zz90ge9dss' WHERE "providerId" IS NULL;
-- Make the column required
ALTER TABLE "ProviderBalanceLog" ALTER COLUMN "providerId" SET NOT NULL;
-- Add the foreign key constraint
ALTER TABLE "ProviderBalanceLog" ADD CONSTRAINT "ProviderBalanceLog_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
