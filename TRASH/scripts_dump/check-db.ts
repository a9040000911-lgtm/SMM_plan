import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('--- DATABASE INTEGRITY CHECK ---');

    const tables = [
        'user', 'project', 'order', 'provider', 'providerService', 'internalService',
        'scheduledOrder', 'transaction', 'supportTicket'
    ];

    for (const table of tables) {
        try {
            // @ts-ignore
            const count = await prisma[table].count();
            console.log(`[${table}] Count: ${count}`);
        } catch (e: any) {
            console.log(`[${table}] ERROR: ${e.message}`);
        }
    }

    try {
        const usersWithBan = await prisma.user.count({
            where: { OR: [{ isPermanentlyBanned: true }, { banExpiresAt: { not: null } }] }
        });
        console.log(`[user] Banned users: ${usersWithBan}`);
    } catch (e: any) {
        console.log(`[user] Ban check error: ${e.message}`);
    }

    try {
        const projects = await prisma.project.findMany({
            select: { name: true, slug: true, isActive: true }
        });
        console.log(`[project] Active projects: ${projects.filter(p => p.isActive).length}`);
        console.log('Projects:', JSON.stringify(projects, null, 2));
    } catch (e: any) {
        console.log(`[project] Error: ${e.message}`);
    }

    try {
        const usersWithoutProject = await prisma.user.count({ where: { isGlobalAdmin: false, projectId: null } });
        console.log(`[user] Issues: Users without project: ${usersWithoutProject}`);
    } catch (e: any) { console.log(`[user] Error: ${e.message}`); }

    try {
        const categories = await prisma.serviceCategory.findMany({
            select: { id: true, name: true, projectId: true }
        });
        console.log(`[serviceCategory] List:`, JSON.stringify(categories.slice(0, 5), null, 2));
        const categoriesWithoutProject = categories.filter(c => !c.projectId).length;
        console.log(`[serviceCategory] Issues: Categories without project: ${categoriesWithoutProject}`);
    } catch (e: any) { console.log(`[serviceCategory] Error: ${e.message}`); }

    try {
        const providers = await prisma.provider.findMany({ select: { name: true, isEnabled: true } });
        console.log(`[provider] List:`, JSON.stringify(providers, null, 2));
    } catch (e: any) { console.log(`[provider] Error: ${e.message}`); }

    console.log('--- CHECK COMPLETE ---');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
