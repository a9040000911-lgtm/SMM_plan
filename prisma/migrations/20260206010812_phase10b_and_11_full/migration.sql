-- CreateTable
CREATE TABLE "ReferralLeaderboard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projectId" TEXT,
    "month" TIMESTAMP(3) NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferralLeaderboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferralLeaderboard_month_rank_idx" ON "ReferralLeaderboard"("month", "rank");

-- CreateIndex
CREATE INDEX "ReferralLeaderboard_projectId_month_idx" ON "ReferralLeaderboard"("projectId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralLeaderboard_userId_month_key" ON "ReferralLeaderboard"("userId", "month");

-- AddForeignKey
ALTER TABLE "ReferralLeaderboard" ADD CONSTRAINT "ReferralLeaderboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLeaderboard" ADD CONSTRAINT "ReferralLeaderboard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
