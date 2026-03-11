import { PrismaClient } from '../src/generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('--- USERS ---');
    const users = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, email: true, username: true, role: true, isGlobalAdmin: true }
    });
    console.log(JSON.stringify(users, null, 2));

    console.log('\n--- PROJECTS ---');
    const projects = await prisma.project.findMany({
        select: { id: true, name: true, slug: true, domain: true }
    });
    console.log(JSON.stringify(projects, null, 2));

    console.log('\n--- RECENT ADMIN LOGS ---');
    const logs = await prisma.adminLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' }
    });
    console.log(JSON.stringify(logs, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
