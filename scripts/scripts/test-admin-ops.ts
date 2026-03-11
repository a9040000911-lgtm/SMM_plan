
import { prisma } from '../src/lib/prisma';
import { ServiceSyncService } from '../src/services/providers/sync.service';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('--- STARTING ADMIN OPERATIONS TEST (Tenancy & Import) ---');

    try {
        // 1. Setup Projects
        const projectA = await prisma.project.upsert({
            where: { slug: 'project-a' },
            update: {},
            create: { slug: 'project-a', domain: 'a.test', name: 'Project Alpha' }
        });
        const projectB = await prisma.project.upsert({
            where: { slug: 'project-b' },
            update: {},
            create: { slug: 'project-b', domain: 'b.test', name: 'Project Beta' }
        });
        console.log(`✅ Projects ready: ${projectA.slug}, ${projectB.slug}`);

        // 2. Add Project-Specific Provider
        const providerName = 'Isolated Provider';
        const providerA = await prisma.provider.upsert({
            where: { projectId_name: { projectId: projectA.id, name: providerName } },
            update: { isEnabled: true },
            create: {
                name: providerName,
                projectId: projectA.id,
                apiUrl: 'https://api.example.com',
                apiKey: 'key-a',
                type: 'perfect-panel',
                isEnabled: true
            }
        });
        console.log(`✅ Provider created for ${projectA.slug}: ${providerA.name}`);

        // 3. Verify Isolation
        const providersForB = await prisma.provider.findMany({
            where: {
                OR: [
                    { projectId: projectB.id },
                    { projectId: null } // Global ones
                ]
            }
        });
        const hasAInB = providersForB.some(p => p.id === providerA.id);
        if (hasAInB) {
            console.log('❌ Isolation FAIL: Project B sees Project A provider');
        } else {
            console.log('✅ Isolation PASS: Project B does not see Project A provider');
        }

        // 4. Import Simulation (Manual DB seed for provider services to avoid network)
        await prisma.providerService.upsert({
            where: { id_providerId: { id: 9991, providerId: providerA.id } },
            update: {},
            create: {
                id: 9991,
                providerId: providerA.id,
                name: 'Imported Test Service',
                rawPrice: new Decimal(0.1),
                platform: 'INSTAGRAM',
                category: 'LIKES',
                rawData: {}
            }
        });
        console.log('✅ Simulated import by seeding ProviderService.');

        // 5. Create Internal Service & Global Default
        const serviceId = 'test-ops-svc';
        const globalSvc = await prisma.internalService.upsert({
            where: { id: serviceId },
            update: { pricePer1000: new Decimal(10.0) },
            create: {
                id: serviceId,
                name: 'Global Service Name',
                description: 'Global Description',
                platform: 'INSTAGRAM',
                category: 'LIKES',
                pricePer1000: new Decimal(10.0),
                minQty: 10,
                maxQty: 1000,
                geo: 'WORLDWIDE'
            }
        });
        console.log(`✅ Global service created: ${globalSvc.name} @ ${globalSvc.pricePer1000} RUB`);

        // 6. Project-Specific Override (EDITING)
        const overridePrice = new Decimal(15.0);
        const overrideName = 'Special Project A Price';
        await prisma.projectServiceOverride.upsert({
            where: { projectId_internalServiceId: { projectId: projectA.id, internalServiceId: serviceId } },
            update: { customPrice: overridePrice, customName: overrideName },
            create: {
                projectId: projectA.id,
                internalServiceId: serviceId,
                customPrice: overridePrice,
                customName: overrideName
            }
        });
        console.log(`✅ Override created for ${projectA.slug}: ${overrideName} @ ${overridePrice} RUB`);

        // 7. Verify Edit Visibility
        const resolvePrice = async (pId: string) => {
            const override = await prisma.projectServiceOverride.findUnique({
                where: { projectId_internalServiceId: { projectId: pId, internalServiceId: serviceId } }
            });
            return {
                name: override?.customName || globalSvc.name,
                price: override?.customPrice || globalSvc.pricePer1000
            };
        };

        const resultA = await resolvePrice(projectA.id);
        const resultB = await resolvePrice(projectB.id);

        console.log(`\nResults for ${projectA.slug}: ${resultA.name} @ ${resultA.price} RUB (Expected Override)`);
        console.log(`Results for ${projectB.slug}: ${resultB.name} @ ${resultB.price} RUB (Expected Global)`);

        if (resultA.price.equals(overridePrice) && resultB.price.equals(globalSvc.pricePer1000)) {
            console.log('\n✅ TENANCY EDIT TEST: PASS');
        } else {
            console.log('\n❌ TENANCY EDIT TEST: FAIL');
        }

    } catch (e: any) {
        console.error('❌ TEST FAILED:', e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
