
import { prisma } from '../src/lib/prisma';

async function checkSystem() {
    const projects = await prisma.project.findMany({ select: { id: true, name: true, slug: true } });
    const services = await prisma.internalService.count();
    const overrides = await prisma.projectServiceOverride.count();
    const categories = await prisma.serviceCategory.count();

    console.log(`--- Smmplan Service System Audit ---`);
    console.log(`Projects: ${projects.length}`);
    projects.forEach(p => console.log(` - ${p.name} (${p.slug}) [${p.id}]`));
    console.log(`Global Services: ${services}`);
    console.log(`Global Categories: ${categories}`);
    console.log(`Total Overrides: ${overrides}`);

    const overridesByProject = await prisma.projectServiceOverride.groupBy({
        by: ['projectId'],
        _count: { _all: true }
    });
    console.log(`Overrides by project:`);
    overridesByProject.forEach(o => {
        const p = projects.find(p => p.id === o.projectId);
        console.log(` - ${p?.name || 'Unknown'}: ${o._count._all} overrides`);
    });
}

checkSystem();
