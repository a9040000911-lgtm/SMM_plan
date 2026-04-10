import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: {
      OR: [
        { role: { in: ['ADMIN', 'SUPPORT', 'SEO'] } },
        { isGlobalAdmin: true }
      ]
    },
    select: {
      email: true,
      role: true,
      isGlobalAdmin: true
    }
  });

  console.log('--- ADMIN PRIVILEGED USERS ---');
  console.log(JSON.stringify(admins, null, 2));
  console.log('Count:', admins.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
