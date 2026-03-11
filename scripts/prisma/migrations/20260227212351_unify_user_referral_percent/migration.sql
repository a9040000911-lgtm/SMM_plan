/*
  Warnings:

  - Made the column `referralPercent` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "referralPercent" SET NOT NULL,
ALTER COLUMN "referralPercent" SET DEFAULT 0;
