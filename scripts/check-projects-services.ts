import { prisma } from "../src/lib/prisma";

async function checkProjects() {
    try {
        const projects = await prisma.project.findMany({
            select: { id: true, name: true, slug: true, domain: true, createdAt: true }
        });
        console.log("PROJECTS:");
        console.log(JSON.stringify(projects, null, 2));

        const defaultProject = await prisma.project.findFirst({
            orderBy: { createdAt: 'asc' },
            select: { id: true, name: true }
        });
        console.log("DEFAULT PROJECT:", defaultProject);

        if (defaultProject) {
            const serviceCount = await prisma.internalService.count({
                where: {
                    isActive: true,
                    OR: [
                        { providerMappings: { some: { projectId: defaultProject.id } } },
                        { providerMappings: { some: { projectId: null } } },
                        { projectOverrides: { some: { projectId: defaultProject.id, isActive: true } } }
                    ]
                }
            });
            console.log(`Service count for default project (${defaultProject.name}): ${serviceCount}`);
        }

    } catch (e: any) {
        console.error(e.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkProjects();
