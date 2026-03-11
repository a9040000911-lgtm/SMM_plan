-- CreateTable
CREATE TABLE "ProviderBalanceLog" (
    "id" TEXT NOT NULL,
    "balance" DECIMAL(20,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderBalanceLog_pkey" PRIMARY KEY ("id")
);
