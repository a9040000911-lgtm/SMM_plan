import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allowedProjects = ['proj1', 'proj2'];
  const userProjSql = Prisma.sql`"userId" IN (SELECT id FROM "User" WHERE "projectId" IN (${Prisma.join(allowedProjects)}))`;
  const txConditions = [
                Prisma.sql`"status" = 'COMPLETED'`,
                Prisma.sql`"type" = 'DEPOSIT'`,
                userProjSql
  ];
  const w = Prisma.sql`WHERE ${Prisma.join(txConditions, ' AND ')}`;
  const q = Prisma.sql`SELECT TO_CHAR("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow', 'YYYY-MM-DD') as "dateStr", COALESCE(SUM(amount), 0)::float as total FROM "Transaction" ${w} GROUP BY 1`;
  
  try {
    console.log(q.text);
    const res = await prisma.$queryRaw(q);
    console.log("Success", res);
  } catch (e) {
    console.error("Error", e);
  }
}

main().finally(() => prisma.$disconnect());
