-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Category" ADD VALUE 'WATCH_TIME';
ALTER TYPE "Category" ADD VALUE 'SAVES';
ALTER TYPE "Category" ADD VALUE 'STARS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Platform" ADD VALUE 'GOOGLE';
ALTER TYPE "Platform" ADD VALUE 'APPLE';
ALTER TYPE "Platform" ADD VALUE 'YANDEX';
ALTER TYPE "Platform" ADD VALUE 'STEAM';
ALTER TYPE "Platform" ADD VALUE 'RUMBLE';
ALTER TYPE "Platform" ADD VALUE 'TUMBLR';
ALTER TYPE "Platform" ADD VALUE 'VIMEO';
ALTER TYPE "Platform" ADD VALUE 'SHAZAM';
ALTER TYPE "Platform" ADD VALUE 'QUORA';
ALTER TYPE "Platform" ADD VALUE 'MEDIUM';
ALTER TYPE "Platform" ADD VALUE 'WEBSITE';
ALTER TYPE "Platform" ADD VALUE 'PERISCOPE';
ALTER TYPE "Platform" ADD VALUE 'CLOUDHUB';
ALTER TYPE "Platform" ADD VALUE 'AUDIOMACK';
ALTER TYPE "Platform" ADD VALUE 'DATPIFF';
