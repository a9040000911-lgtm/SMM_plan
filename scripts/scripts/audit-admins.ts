
import { prisma } from '../src/lib/prisma';

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { tgId: BigInt(268747191) },
                { role: 'ADMIN' },
                { isGlobalAdmin: true }
            ]
        },
        include: {
            project: true
        }
    });

    console.log('--- USER DATA AUDIT ---');
    users.forEach(u => {
        console.log(`- ID: ${u.id}`);
        console.log(`  Project: ${u.project?.slug} (${u.projectId})`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Username: ${u.username}`);
        console.log(`  Role: ${u.role}`);
        console.log(`  isGlobalAdmin: ${u.isGlobalAdmin}`);
        console.log(`  tgId: ${u.tgId}`);
        console.log(`  allowedTabs: ${JSON.stringify(u.allowedTabs)}`);
        console.log('------------------------');
    });

    const defaultProject = await prisma.project.findFirst({ where: { slug: 'default' } });
    console.log('Default Project ID:', defaultProject?.id);
}

main().catch(console.error);
