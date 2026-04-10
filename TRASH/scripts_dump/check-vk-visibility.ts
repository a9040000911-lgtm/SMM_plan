import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("--- Project Data ---");
    const projects = await prisma.project.findMany();
    if (projects.length === 0) {
        console.log("Error: No projects found.");
        return;
    }

    for (const p of projects) {
        console.log(`[${p.id}] Name: ${p.name}, Slug: ${p.slug}, Domain: ${p.domain}`);
    }

    const firstProject = projects[0];
    console.log(`\nAnalyzing visibility for Project: ${firstProject.name} (${firstProject.id})`);

    const vkServices = await prisma.internalService.findMany({
        where: {
            platform: 'VK',
            isActive: true
        },
        include: {
            projectOverrides: {
                where: {
                    projectId: firstProject.id
                }
            }
        }
    });

    console.log(`\nFound ${vkServices.length} active VK InternalServices.`);

    let missingOverrides = 0;
    let inactiveOverrides = 0;

    vkServices.forEach(s => {
        const override = s.projectOverrides[0];
        if (!override) {
            missingOverrides++;
            console.log(` - MISSING OVERRIDE: ${s.name} (ID: ${s.numericId})`);
        } else if (!override.isActive) {
            inactiveOverrides++;
            console.log(` - INACTIVE OVERRIDE: ${s.name} (ID: ${s.numericId})`);
        }
    });

    console.log(`\nSummary:`);
    console.log(`- Total VK services: ${vkServices.length}`);
    console.log(`- Missing overrides: ${missingOverrides}`);
    console.log(`- Inactive overrides: ${inactiveOverrides}`);

    if (missingOverrides > 0) {
        console.log("\nProposing Fix: Create missing ProjectServiceOverride entries for this project.");
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
