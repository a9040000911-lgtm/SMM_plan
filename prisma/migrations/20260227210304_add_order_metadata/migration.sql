-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "metadata" JSONB;
