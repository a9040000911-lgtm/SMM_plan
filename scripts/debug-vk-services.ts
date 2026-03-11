import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Projects ---");
    const projects = await prisma.project.findMany();
    projects.forEach(p => console.log(`Project: ${p.name} (id: ${p.id}, domain: ${p.domain}, slug: ${p.slug})`));

    const defaultProject = projects[0];
    if (!defaultProject) {
        console.log("No projects found!");
        return;
    }
    console.log(`\nDefault Project (for catalog): ${defaultProject.name} (${defaultProject.id})`);

    console.log("\n--- Internal Services (VK) ---");
    const vkServices = await prisma.internalService.findMany({
        where: { platform: { contains: 'VK', mode: 'insensitive' } },
        include: {
            projectOverrides: {
                where: { projectId: defaultProject.id }
            }
        }
    });

    if (vkServices.length === 0) {
        console.log("No VK services found in InternalService table.");
    } else {
        vkServices.forEach(s => {
            const hasOverride = s.projectOverrides.length > 0;
            const overrideActive = hasOverride ? s.projectOverrides[0].isActive : "N/A";
            console.log(`Service: ${s.name} (ID: ${s.numericId}, isActive: ${s.isActive}, hasOverride: ${hasOverride}, overrideActive: ${overrideActive})`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
