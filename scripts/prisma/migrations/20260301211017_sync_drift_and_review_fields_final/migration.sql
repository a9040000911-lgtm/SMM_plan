-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Currency" ADD VALUE 'TRY';
ALTER TYPE "Currency" ADD VALUE 'IDR';
ALTER TYPE "Currency" ADD VALUE 'INR';
ALTER TYPE "Currency" ADD VALUE 'THB';
ALTER TYPE "Currency" ADD VALUE 'VND';

-- AlterTable
ALTER TABLE "ProviderBalanceLog" ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'USD';

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "userName" TEXT,
ADD COLUMN     "userRole" TEXT;

-- AlterTable
ALTER TABLE "ServiceCategory" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "GlobalSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GlobalSetting_key_key" ON "GlobalSetting"("key");
