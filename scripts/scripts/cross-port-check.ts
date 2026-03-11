import { PrismaClient } from '@prisma/client';

async function main() {
    const ports = [5432, 5433];

    for (const port of ports) {
        console.log(`--- CHECKING PORT ${port} ---`);
        const url = `postgresql://smmuser:smmpassword@127.0.0.1:${port}/smmplan?schema=public`;
        process.env.DATABASE_URL = url;
        const prisma = new PrismaClient();

        try {
            const projects = await prisma.project.findMany({ select: { id: true, name: true, domain: true } });
            console.log(`Port ${port}: Found ${projects.length} projects.`);
            if (projects.length > 0) console.log(JSON.stringify(projects, null, 2));
        } catch (e) {
            console.log(`Port ${port}: Connection failed or table not found.`);
        } finally {
            await prisma.$disconnect();
        }
    }
}

main().catch(console.error);
