-- AlterTable
ALTER TABLE "AutoMonitoring" ADD COLUMN     "delayMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dripInterval" INTEGER,
ADD COLUMN     "dripRuns" INTEGER,
ADD COLUMN     "isDripFeed" BOOLEAN NOT NULL DEFAULT false;
