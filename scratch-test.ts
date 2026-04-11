import { Prisma } from '@prisma/client';
const d = new Date();
const cond = [Prisma.sql`"createdAt" >= ${d}`];
const w = Prisma.sql`WHERE ${Prisma.join(cond, ' AND ')}`;
const q = Prisma.sql`SELECT * FROM "Order" ${w}`;
console.log(q.text);
console.log(q.values);
