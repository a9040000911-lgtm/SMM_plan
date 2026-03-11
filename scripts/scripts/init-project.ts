
import { ProjectService } from '../src/services/core';
import { prisma } from '../src/lib/prisma';

async function main() {
    const project = await ProjectService.ensureDefaultProject();
    console.log('Project initialized:', project.slug, project.id);

    // Also list all project IDs
    const allProjects = await prisma.project.findMany();
    console.log('All projects:', allProjects.map(p => p.id));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
