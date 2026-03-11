-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramContact" TEXT,
ADD COLUMN     "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whatsapp" TEXT;
