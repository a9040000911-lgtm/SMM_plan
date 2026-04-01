import { CatalogService } from '../src/services/core/catalog.service';
import { prisma } from '../src/lib/prisma';

async function test() {
    console.log("Starting test...");
    const project = await prisma.project.findFirst();
    if (!project) {
        console.log("No projects found");
        return;
    }
    console.log("Testing with projectId =", project.id);
    const result = await CatalogService.getGroupedCatalog(project.id);
    console.dir(result, { depth: null });
}

test().catch(console.error).finally(() => prisma.$disconnect());
