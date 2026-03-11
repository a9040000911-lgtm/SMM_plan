import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const logs = await prisma.adminLog.findMany();
    console.log('Admin Logs:', JSON.stringify(logs, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
