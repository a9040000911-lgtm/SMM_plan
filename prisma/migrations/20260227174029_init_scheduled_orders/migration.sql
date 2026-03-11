-- CreateEnum
CREATE TYPE "ServiceManagementMode" AS ENUM ('MANUAL', 'SMART_IMPORT');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "TransactionStatus" ADD VALUE 'ERROR';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'WITHDRAWAL';
ALTER TYPE "TransactionType" ADD VALUE 'ORDER_PAYMENT';
ALTER TYPE "TransactionType" ADD VALUE 'NEW_ORDER';
ALTER TYPE "TransactionType" ADD VALUE 'ORDER_STATUS_CHANGE';

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDripFeedDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "marketerSettings" JSONB,
ADD COLUMN     "markup" DECIMAL(10,2),
ADD COLUMN     "serviceManagementMode" "ServiceManagementMode" NOT NULL DEFAULT 'SMART_IMPORT';

-- CreateTable
CREATE TABLE "ScheduledOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "projectId" TEXT,
    "link" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "totalPrice" DECIMAL(20,2),
    "costPrice" DECIMAL(20,4),
    "scheduleTime" TIMESTAMP(3) NOT NULL,
    "repeatInterval" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScheduledOrder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ScheduledOrder" ADD CONSTRAINT "ScheduledOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledOrder" ADD CONSTRAINT "ScheduledOrder_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "InternalService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduledOrder" ADD CONSTRAINT "ScheduledOrder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
