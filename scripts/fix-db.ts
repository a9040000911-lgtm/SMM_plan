import { prisma } from '../src/lib/prisma';

async function main() {
    const PROJECT_ID = 'f439f60b-f4e4-4013-8402-b1d7b61383fe';
    console.log(`--- [MERGE v2] DATABASE INTEGRITY FIX FOR PROJECT: ${PROJECT_ID} ---`);

    // 1. Fix Categories (Already partly done, but let's be sure)
    const orphanCats = await prisma.serviceCategory.findMany({
        where: { projectId: null }
    });
    console.log(`Found ${orphanCats.length} orphan categories.`);

    for (const orphan of orphanCats) {
        const existing = await prisma.serviceCategory.findUnique({
            where: {
                projectId_platform_name: {
                    projectId: PROJECT_ID,
                    platform: orphan.platform,
                    name: orphan.name
                }
            }
        });

        if (existing) {
            console.log(`Merging Category [${orphan.name}] (${orphan.platform}) -> Existing ID: ${existing.id}`);
            await prisma.internalService.updateMany({
                where: { categoryId: orphan.id },
                data: { categoryId: existing.id }
            });
            await prisma.serviceCategory.delete({ where: { id: orphan.id } });
        } else {
            console.log(`Assigning Category [${orphan.name}] (${orphan.platform}) to Project.`);
            await prisma.serviceCategory.update({
                where: { id: orphan.id },
                data: { projectId: PROJECT_ID }
            });
        }
    }

    // 2. Fix Users (Safely)
    const orphanUsers = await prisma.user.findMany({
        where: { projectId: null, isGlobalAdmin: false }
    });
    console.log(`Found ${orphanUsers.length} orphan users.`);

    for (const user of orphanUsers) {
        // Check for duplicates in target project
        let duplicate = false;
        if (user.email) {
            const sameEmail = await prisma.user.findFirst({
                where: { projectId: PROJECT_ID, email: user.email }
            });
            if (sameEmail) duplicate = true;
        }
        if (!duplicate && user.tgId) {
            const sameTg = await prisma.user.findFirst({
                // @ts-ignore
                where: { projectId: PROJECT_ID, tgId: user.tgId }
            });
            if (sameTg) duplicate = true;
        }

        if (duplicate) {
            console.log(`Skipping Duplicate User: ${user.email || user.tgId || user.id}`);
        } else {
            console.log(`Assigning User [${user.email || user.tgId}] to Project.`);
            await prisma.user.update({
                where: { id: user.id },
                data: { projectId: PROJECT_ID }
            });
        }
    }

    // 3. Heuristic Service-Category matching for remaining orphans
    const orphanServices = await prisma.internalService.findMany({
        where: { categoryId: null }
    });
    console.log(`Found ${orphanServices.length} services without category.`);

    const projectCats = await prisma.serviceCategory.findMany({
        where: { projectId: PROJECT_ID }
    });

    for (const service of orphanServices) {
        // Try to match by platform + name keywords
        const match = projectCats.find(c =>
            c.platform === service.platform &&
            service.name.toLowerCase().includes(c.name.toLowerCase())
        );

        if (match) {
            console.log(`Linking Service [${service.name}] -> Category [${match.name}]`);
            await prisma.internalService.update({
                where: { id: service.id },
                data: { categoryId: match.id }
            });
        }
    }

    console.log('--- FIX COMPLETE ---');
    process.exit(0);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
