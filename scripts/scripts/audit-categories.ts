
import { prisma } from '../src/lib/prisma';

async function checkCategories() {
    const projects = await prisma.project.findMany();
    for (const p of projects) {
        const count = await prisma.serviceCategory.count({ where: { projectId: p.id } });
        console.log(`Project ${p.name}: ${count} categories`);
    }
}

checkCategories();
