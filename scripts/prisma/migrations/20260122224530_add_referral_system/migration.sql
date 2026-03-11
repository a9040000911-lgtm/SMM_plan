-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralEarnings" DECIMAL(20,2) NOT NULL DEFAULT 0.00,
ADD COLUMN     "referrerId" TEXT;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
