const { PrismaClient } = require('./src/generated/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Adding curatorNote column to InternalService table...');
    await prisma.$executeRawUnsafe('ALTER TABLE "InternalService" ADD COLUMN IF NOT EXISTS "curatorNote" TEXT;');
    console.log('Successfully added curatorNote column.');
  } catch (error) {
    console.error('Failed to add column:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
