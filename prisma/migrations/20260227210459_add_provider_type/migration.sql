-- AlterTable
ALTER TABLE "Provider" ADD COLUMN     "balanceCurrency" "Currency" NOT NULL DEFAULT 'USD',
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'universal';
