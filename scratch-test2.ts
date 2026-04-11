import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const d = new Date();
  const cond = [Prisma.sql`"createdAt" >= ${d}`];
  const w = Prisma.sql`WHERE ${Prisma.join(cond, ' AND ')}`;
  const q = Prisma.sql`SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD') as "dateStr", COUNT(*)::int as count FROM "Order" ${w} GROUP BY 1`;
  
  try {
    const res = await prisma.$queryRaw(q);
    console.log("Success", res);
  } catch (e) {
    console.error("Error", e);
  }
}

main().finally(() => prisma.$disconnect());
