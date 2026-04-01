import { prisma } from '../src/lib/prisma';
import { CatalogService } from '../src/services/core/catalog.service';

async function test() {
    console.log("Projects:", await prisma.project.findMany({select:{id:true, slug:true}}));
    const project = await prisma.project.findFirst({where:{slug:'smmplan'}});
    const pid = project?.id;
    console.log("Services count total:", await prisma.internalService.count());
    
    if (pid) {
        console.log("Services matching query for project `smmplan`:", await prisma.internalService.count({
            where: {
                isActive: true,
                OR: [
                    { projectOverrides: { some: { projectId: pid, isActive: true } } },
                    { 
                        isPrivate: false,
                        providerMappings: { some: { projectId: pid } }
                    },
                    {
                        isPrivate: false,
                        providerMappings: { some: { projectId: null } }
                    }
                ]
            }
        }));
    }
}
test().catch(console.error).finally(() => prisma.$disconnect());
