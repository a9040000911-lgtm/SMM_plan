import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Audit ---');

    const tables = [
        'user', 'project', 'order', 'provider', 'providerService',
        'internalService', 'transaction', 'supportTicket', 'adminLog'
    ];

    for (const table of tables) {
        try {
            const count = await (prisma as any)[table].count();
            console.log(`${table}: ${count}`);
        } catch (e) {
            console.log(`${table}: Table might not exist or error`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
