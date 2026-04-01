import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING TOTAL ADMIN RESET ---');
  
  const result = await prisma.user.updateMany({
    data: {
      role: 'USER',
      isGlobalAdmin: false
    }
  });

  console.log(`Reset successful. Updated ${result.count} users.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
