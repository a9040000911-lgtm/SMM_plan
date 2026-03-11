-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "refundedAmount" DECIMAL(20,2) NOT NULL DEFAULT 0.00;
