"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🧹 Final Refinement of Database Classification...');
    const projects = await prisma.project.findMany();
    if (projects.length === 0)
        return;
    const project = projects[0];
    const reactionsRuCat = await prisma.serviceCategory.findFirst({
        where: { name: 'Реакции', platform: 'TELEGRAM', projectId: project.id }
    });
    const viewsRuCat = await prisma.serviceCategory.findFirst({
        where: { name: 'Просмотры', platform: 'TELEGRAM', projectId: project.id }
    });
    if (reactionsRuCat && viewsRuCat) {
        // 1. Move Mix Reactions to Reactions
        const mixReactions = await prisma.internalService.findMany({
            where: {
                name: { contains: 'микс', mode: 'insensitive' },
                OR: [
                    { name: { contains: 'реакций', mode: 'insensitive' } },
                    { name: { contains: 'reactions', mode: 'insensitive' } }
                ]
            }
        });
        for (const s of mixReactions) {
            await prisma.internalService.update({
                where: { id: s.id },
                data: { categoryId: reactionsRuCat.id, category: 'REACTIONS' }
            });
            console.log(` - Moved ${s.name} to Реакции`);
        }
        // 2. Move Views/Auto-Views/Stories out of Reactions to Views
        const misplacedViews = await prisma.internalService.findMany({
            where: {
                categoryId: reactionsRuCat.id,
                OR: [
                    { name: { contains: 'Просмотры', mode: 'insensitive' } },
                    { name: { contains: 'Views', mode: 'insensitive' } }
                ]
            }
        });
        for (const s of misplacedViews) {
            await prisma.internalService.update({
                where: { id: s.id },
                data: { categoryId: viewsRuCat.id, category: 'VIEWS' }
            });
            console.log(` - Moved ${s.name} to Просмотры`);
        }
    }
    console.log('✅ Final refinement completed.');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
