import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const w = Prisma.empty;
  const q = Prisma.sql`SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD') as "dateStr", COUNT(*)::int as count FROM "SupportTicket" ${w} GROUP BY 1`;
  
  try {
    console.log(q.text);
    const res = await prisma.$queryRaw(q);
    console.log("Success", res);
  } catch (e) {
    console.error("Error", e);
  }
}

main().finally(() => prisma.$disconnect());
