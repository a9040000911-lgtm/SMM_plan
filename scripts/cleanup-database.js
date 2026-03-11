"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🧹 Starting Database Cleanup & Sync...');
    const projects = await prisma.project.findMany();
    if (projects.length === 0)
        return;
    const project = projects[0];
    // 1. Delete English duplicate categories that were created by mistake
    const engCategories = await prisma.serviceCategory.findMany({
        where: {
            name: { in: ['SUBSCRIBERS', 'VIEWS', 'REACTIONS', 'LIKES'] },
            projectId: project.id
        }
    });
    console.log(`Found ${engCategories.length} English categories to remove/migrate.`);
    for (const engCat of engCategories) {
        // Find Russian equivalent
        const ruName = {
            'SUBSCRIBERS': 'Подписчики',
            'VIEWS': 'Просмотры',
            'REACTIONS': 'Реакции',
            'LIKES': 'Лайки'
        }[engCat.name];
        const ruCat = await prisma.serviceCategory.findFirst({
            where: { name: ruName, platform: engCat.platform, projectId: project.id }
        });
        if (ruCat) {
            console.log(` - Migrating services from ${engCat.name} (${engCat.platform}) to ${ruCat.name}`);
            // Move services
            await prisma.internalService.updateMany({
                where: { categoryId: engCat.id },
                data: { categoryId: ruCat.id }
            });
            // Delete old cat
            await prisma.serviceCategory.delete({ where: { id: engCat.id } });
        }
    }
    // 2. Fix Classification for Mix Reactions
    // Find all Mix Reaction services that are currently in 'Просмотры'
    const reactionsRuCat = await prisma.serviceCategory.findFirst({
        where: { name: 'Реакции', platform: 'TELEGRAM', projectId: project.id }
    });
    if (reactionsRuCat) {
        const misclassifiedReactions = await prisma.internalService.findMany({
            where: {
                name: { contains: 'Reactions', mode: 'insensitive' },
                category: 'VIEWS'
            }
        });
        console.log(`Found ${misclassifiedReactions.length} misclassified reaction services in VIEWS.`);
        for (const service of misclassifiedReactions) {
            await prisma.internalService.update({
                where: { id: service.id },
                data: {
                    categoryId: reactionsRuCat.id,
                    category: 'REACTIONS'
                }
            });
            console.log(` - Moved ${service.name} to Реакции`);
        }
        // 2b. Fix 'Просмотры историй' (Story Views) that might be in REACTIONS
        const viewsRuCat = await prisma.serviceCategory.findFirst({
            where: { name: 'Просмотры', platform: 'TELEGRAM', projectId: project.id }
        });
        if (viewsRuCat) {
            const misclassifiedViews = await prisma.internalService.findMany({
                where: {
                    name: { contains: 'Просмотры историй', mode: 'insensitive' },
                    categoryId: reactionsRuCat.id
                }
            });
            console.log(`Found ${misclassifiedViews.length} misclassified view services in REACTIONS.`);
            for (const service of misclassifiedViews) {
                await prisma.internalService.update({
                    where: { id: service.id },
                    data: {
                        categoryId: viewsRuCat.id,
                        category: 'VIEWS'
                    }
                });
                console.log(` - Moved ${service.name} to Просмотры`);
            }
        }
    }
    // 3. Ensure Project Overrides are fresh
    const allInternal = await prisma.internalService.findMany();
    for (const s of allInternal) {
        await prisma.projectServiceOverride.upsert({
            where: {
                projectId_internalServiceId: {
                    projectId: project.id,
                    internalServiceId: s.id
                }
            },
            update: { isActive: true },
            create: {
                projectId: project.id,
                internalServiceId: s.id,
                isActive: true
            }
        });
    }
    console.log('✅ Cleanup and Sync completed successfully.');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
