import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- DATABASE DIAGNOSTIC START ---');
    try {
        const servicesCount = await prisma.internalService.count();
        const projectsCount = await prisma.project.count();
        const overridesCount = await prisma.projectServiceOverride.count();
        const categoriesCount = await prisma.serviceCategory.count();

        console.log(`Internal Services: ${servicesCount}`);
        console.log(`Projects: ${projectsCount}`);
        console.log(`Project Overrides: ${overridesCount}`);
        console.log(`Service Categories: ${categoriesCount}`);

        const projects = await prisma.project.findMany({
            select: { id: true, slug: true, domain: true }
        });

        for (const p of projects) {
            const pOverrides = await prisma.projectServiceOverride.count({
                where: { projectId: p.id, isActive: true }
            });
            console.log(`Project: ${p.slug} (${p.id}) | Overrides: ${pOverrides}`);
        }

        if (servicesCount > 0 && overridesCount === 0) {
            console.log('WARNING: Services exist but NO PROJECT OVERRIDES found. Catalog will be empty!');
        }

    } catch (e) {
        console.error('Diagnostic failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
