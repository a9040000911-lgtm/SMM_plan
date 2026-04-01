import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.systemLog.findMany({
    where: {
      type: { in: ['AUTH_STEP', 'AUTH_FAILED', 'ADMIN_ACTION'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(logs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
