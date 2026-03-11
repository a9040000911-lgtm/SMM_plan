-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "qualityScore" TEXT DEFAULT 'MEDIUM',
ADD COLUMN     "rewardAmount" DECIMAL(10,2),
ADD COLUMN     "rewardClaimed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "NPSSurvey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "orderId" TEXT,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NPSSurvey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NPSSurvey_userId_idx" ON "NPSSurvey"("userId");

-- CreateIndex
CREATE INDEX "NPSSurvey_projectId_idx" ON "NPSSurvey"("projectId");

-- CreateIndex
CREATE INDEX "NPSSurvey_score_idx" ON "NPSSurvey"("score");

-- CreateIndex
CREATE INDEX "NPSSurvey_createdAt_idx" ON "NPSSurvey"("createdAt");

-- CreateIndex
CREATE INDEX "Review_qualityScore_idx" ON "Review"("qualityScore");

-- AddForeignKey
ALTER TABLE "NPSSurvey" ADD CONSTRAINT "NPSSurvey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NPSSurvey" ADD CONSTRAINT "NPSSurvey_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NPSSurvey" ADD CONSTRAINT "NPSSurvey_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
