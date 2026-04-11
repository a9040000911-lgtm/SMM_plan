const { Prisma } = require('@prisma/client');
function test() {
    const cutoffDate = new Date();
    const conditions = [Prisma.sql`"createdAt" >= ${cutoffDate}`];
    const whereClause = conditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty;
    const q = Prisma.sql`SELECT * FROM "Order" ${whereClause} GROUP BY 1`;
    console.log("SQL:", q.text);
    console.log("Args:", q.values);
}

test();
