import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Starting Catalog Visibility Fix...');

    // 1. Find all projects
    const projects = await prisma.project.findMany({
        orderBy: { createdAt: 'asc' }
    });

    if (projects.length === 0) {
        console.log('❌ No projects found in Database!');
        return;
    }

    console.log(`Found ${projects.length} projects:`);
    projects.forEach(p => console.log(` - ID: ${p.id}, Name: ${p.name}, Slug: ${p.slug}, Domain: ${p.domain}`));

    // 2. Identify the target project (we want 'main' or the first created one)
    const targetProject = projects.find(p => p.slug === 'main') || projects[0];
    console.log(`\n🎯 Using Project: ${targetProject.name} (${targetProject.id}) as the PRIMARY catalog.`);

    // 3. FIX: If the user is accessing via IP, we should ensure this project matches common access patterns
    // We will set domain to smmplan.ru, but also ensure slug is 'main' for easy fallback
    await prisma.project.update({
        where: { id: targetProject.id },
        data: {
            domain: 'smmplan.ru',
            slug: 'main', // Ensure this is 'main' for the fallback logic
            isActive: true
        }
    });
    console.log('✅ Updated project domain/slug for proper resolution.');

    // 4. FIX: Ensure all services belong to this project or are global
    const internalServices = await prisma.internalService.findMany({
        include: { serviceCategory: true }
    });

    console.log(`\nRe-linking ${internalServices.length} services...`);

    for (const service of internalServices) {
        // A. Ensure there is a ProjectServiceOverride for this project
        await prisma.projectServiceOverride.upsert({
            where: {
                projectId_internalServiceId: {
                    projectId: targetProject.id,
                    internalServiceId: service.id
                }
            },
            update: { isActive: true },
            create: {
                projectId: targetProject.id,
                internalServiceId: service.id,
                isActive: true
            }
        });

        // B. If the service belongs to a category, ensure THAT category also belongs to this project
        if (service.categoryId) {
            const category = service.serviceCategory;
            if (category && category.projectId !== targetProject.id && category.projectId !== null) {
                console.log(` - Moving category ${category.name} to target project...`);
                await prisma.serviceCategory.update({
                    where: { id: category.id },
                    data: { projectId: targetProject.id }
                });
            }
        }
    }

    // 5. Cleanup: If there are other "empty" projects created by mistake, mark them inactive
    if (projects.length > 1) {
        for (const p of projects) {
            if (p.id !== targetProject.id) {
                console.log(` - Deactivating extra project: ${p.name} (${p.id})`);
                await prisma.project.update({
                    where: { id: p.id },
                    data: { isActive: false }
                });
            }
        }
    }

    console.log('\n✨ Done! Catalog should be visible now.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
