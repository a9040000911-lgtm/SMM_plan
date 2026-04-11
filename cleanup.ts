import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const ids = ['f1fb0562-8579-4382-8f27-75043b44a278', 'test-project', 'c75893ad-fe83-4aae-8290-a9c87c949555', '49c8aa5e-5942-4434-a364-8d6a866982ce', 'franchise-e2e'];
    
    // Find providers linked to these projects
    const providers = await prisma.provider.findMany({ where: { projectId: { in: ids } } });
    const providerIds = providers.map(p => p.id);
    console.log('Providers to delete:', providerIds.length);

    // Delete provider balance logs
    await prisma.providerBalanceLog.deleteMany({ where: { providerId: { in: providerIds } } });
    
    // Delete orders linked to these projects
    await prisma.order.deleteMany({ where: { projectId: { in: ids } } });
    
    // ProjectServiceOverride
    try {
        await prisma.projectServiceOverride.deleteMany({ where: { projectId: { in: ids } } });
    } catch(e) {}
    
    // InternalServiceMapping where providerId is in our list
    try {
        await prisma.internalServiceMapping.deleteMany({ where: { providerId: { in: providerIds } } });
    } catch(e) {}

    try {
        await prisma.provider.deleteMany({ where: { projectId: { in: ids } } });
    } catch(e) { console.error('Provider delete err:', e.message); }

    try {
        await prisma.user.deleteMany({ where: { projectId: { in: ids } } });
    } catch(e) {}

    try {
        await prisma.projectConfig.deleteMany({ where: { projectId: { in: ids } } });
    } catch(e) {}

    try {
        console.log('Attempting to delete test projects...');
        const result = await prisma.project.deleteMany({
            where: { id: { in: ids } }
        });
        console.log('Successfully deleted:', result.count);
    } catch(err: any) {
        console.error('Project delete failed:', err.message);
    }
}
main().finally(() => void prisma.$disconnect());
