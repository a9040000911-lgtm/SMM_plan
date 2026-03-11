-- AlterTable
ALTER TABLE "InternalService" ADD COLUMN     "avgCompletionTime" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastProviderPrice" DECIMAL(20,4),
ADD COLUMN     "statusCount" JSONB,
ADD COLUMN     "successRate" DOUBLE PRECISION NOT NULL DEFAULT 100.0;

-- CreateTable
CREATE TABLE "ServiceChangeLog" (
    "id" TEXT NOT NULL,
    "internalServiceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceChangeLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ServiceChangeLog" ADD CONSTRAINT "ServiceChangeLog_internalServiceId_fkey" FOREIGN KEY ("internalServiceId") REFERENCES "InternalService"("id") ON DELETE CASCADE ON UPDATE CASCADE;
