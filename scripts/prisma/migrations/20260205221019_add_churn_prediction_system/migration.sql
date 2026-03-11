-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "currentCount" INTEGER,
ADD COLUMN     "initialCount" INTEGER,
ADD COLUMN     "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN     "warrantyDays" INTEGER;

-- CreateTable
CREATE TABLE "ChurnSnapshot" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "subscriberCount" INTEGER NOT NULL,
    "daysElapsed" INTEGER NOT NULL,
    "dropoffRate" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "ChurnSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChurnPrediction" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "predictedChurn" DECIMAL(5,2) NOT NULL,
    "confidenceScore" DECIMAL(3,2) NOT NULL,
    "recommendedAction" TEXT,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ChurnPrediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChurnSnapshot_orderId_snapshotDate_idx" ON "ChurnSnapshot"("orderId", "snapshotDate");

-- CreateIndex
CREATE INDEX "ChurnSnapshot_snapshotDate_idx" ON "ChurnSnapshot"("snapshotDate");

-- CreateIndex
CREATE INDEX "ChurnPrediction_orderId_createdAt_idx" ON "ChurnPrediction"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "ChurnPrediction_recommendedAction_idx" ON "ChurnPrediction"("recommendedAction");

-- AddForeignKey
ALTER TABLE "ChurnSnapshot" ADD CONSTRAINT "ChurnSnapshot_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChurnPrediction" ADD CONSTRAINT "ChurnPrediction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
