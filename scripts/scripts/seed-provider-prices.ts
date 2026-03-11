
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('🚀 Seeding Provider Services and Mappings for VexBoost...');

    const provider = await prisma.provider.upsert({
        where: { id: 'vexboost' },
        update: {},
        create: {
            id: 'vexboost',
            name: 'VexBoost',
            apiKey: 'mock-key',
            apiUrl: 'https://vexboost.com/api/v2',
            isEnabled: true,
            type: 'universal'
        }
    });

    const internalServices = await prisma.internalService.findMany();
    console.log(`🔎 Found ${internalServices.length} internal services.`);

    const project = await prisma.project.findFirst();
    if (!project) throw new Error('No project found. Run seed-real-data first.');

    for (const service of internalServices) {
        console.log(`⏳ Processing: ${service.name} (${service.id})`);

        const purchasePrice = service.pricePer1000.mul(0.7);
        const providerServiceId = Math.floor(Math.random() * 1000000);

        try {
            await prisma.providerService.upsert({
                where: {
                    id_providerId: {
                        id: providerServiceId,
                        providerId: provider.id
                    }
                },
                update: {
                    rawPrice: purchasePrice,
                    name: `[VexBoost] ${service.name}`,
                    category: service.category,
                    platform: service.platform
                },
                create: {
                    id: providerServiceId,
                    providerId: provider.id,
                    name: `[VexBoost] ${service.name}`,
                    rawPrice: purchasePrice,
                    category: service.category,
                    platform: service.platform,
                    rawData: { external_id: providerServiceId }
                }
            });
            console.log(`   - ProviderService created/updated`);

            await prisma.internalServiceMapping.upsert({
                where: {
                    projectId_internalServiceId_providerServiceId_providerId: {
                        projectId: project.id,
                        internalServiceId: service.id,
                        providerServiceId: providerServiceId,
                        providerId: provider.id
                    }
                },
                update: {
                    isActive: true,
                    priority: 1
                },
                create: {
                    projectId: project.id,
                    internalServiceId: service.id,
                    providerServiceId: providerServiceId,
                    providerId: provider.id,
                    priority: 1,
                    isActive: true
                }
            });
            console.log(`   - Mapping created/updated`);

            await prisma.internalService.update({
                where: { id: service.id },
                data: {
                    lastProviderPrice: purchasePrice
                }
            });
            console.log(`   - InternalService updated with price: ${purchasePrice}`);
        } catch (err: any) {
            console.error(`❌ Error processing ${service.id}:`, err.message);
        }
    }

    console.log('✅ Provider prices and mappings seeded successfully.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
