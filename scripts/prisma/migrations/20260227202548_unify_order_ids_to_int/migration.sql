/*
  Warnings:

  - The `orderId` column on the `NPSSurvey` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Order` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Order` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orderId` column on the `Review` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `orderId` column on the `SupportTicket` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `orderId` on the `ChurnPrediction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `orderId` on the `ChurnSnapshot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "ChurnPrediction" DROP CONSTRAINT "ChurnPrediction_orderId_fkey";

-- DropForeignKey
ALTER TABLE "ChurnSnapshot" DROP CONSTRAINT "ChurnSnapshot_orderId_fkey";

-- DropForeignKey
ALTER TABLE "NPSSurvey" DROP CONSTRAINT "NPSSurvey_orderId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_orderId_fkey";

-- DropForeignKey
ALTER TABLE "SupportTicket" DROP CONSTRAINT "SupportTicket_orderId_fkey";

-- AlterTable
ALTER TABLE "ChurnPrediction" DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "ChurnSnapshot" DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "NPSSurvey" DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER;

-- AlterTable
ALTER TABLE "Order" DROP CONSTRAINT "Order_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Order_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER;

-- AlterTable
ALTER TABLE "SupportTicket" DROP COLUMN "orderId",
ADD COLUMN     "orderId" INTEGER;

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "orderId" INTEGER;

-- CreateIndex
CREATE INDEX "ChurnPrediction_orderId_createdAt_idx" ON "ChurnPrediction"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "ChurnSnapshot_orderId_snapshotDate_idx" ON "ChurnSnapshot"("orderId", "snapshotDate");

-- CreateIndex
CREATE INDEX "SupportTicket_orderId_idx" ON "SupportTicket"("orderId");

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurnSnapshot" ADD CONSTRAINT "ChurnSnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurnPrediction" ADD CONSTRAINT "ChurnPrediction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NPSSurvey" ADD CONSTRAINT "NPSSurvey_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
