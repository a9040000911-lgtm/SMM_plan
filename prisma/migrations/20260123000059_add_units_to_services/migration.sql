-- AlterTable
ALTER TABLE "InternalService" ADD COLUMN     "priceUnit" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "unitName" TEXT NOT NULL DEFAULT 'шт.';
