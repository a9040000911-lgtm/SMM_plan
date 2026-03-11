
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';

async function main() {
    console.log('\n--- 🧪 COMPREHENSIVE TENANCY & ADMIN OPS TEST ---');

    // 0. Cleanup old test data
    await prisma.projectServiceOverride.deleteMany({ where: { project: { slug: { in: ['test-p1', 'test-p2'] } } } });
    await prisma.internalServiceMapping.deleteMany({ where: { project: { slug: { in: ['test-p1', 'test-p2'] } } } });
    await prisma.provider.deleteMany({ where: { project: { slug: { in: ['test-p1', 'test-p2'] } } } });
    await prisma.project.deleteMany({ where: { slug: { in: ['test-p1', 'test-p2'] } } });

    // 1. Setup Projects
    const p1 = await prisma.project.create({ data: { slug: 'test-p1', domain: 'p1.test', name: 'Project One' } });
    const p2 = await prisma.project.create({ data: { slug: 'test-p2', domain: 'p2.test', name: 'Project Two' } });
    console.log(`✅ Created test projects: ${p1.slug}, ${p2.slug}`);

    // --- TEST 1: ADD PROVIDER ---
    console.log('\n[Step 1] Adding isolated providers...');
    const prov1 = await prisma.provider.create({
        data: {
            name: 'P1-ONLY-PROVIDER',
            projectId: p1.id,
            apiUrl: 'http://api.p1.com',
            apiKey: 'key1',
            type: 'universal'
        }
    });

    const globalProviders = await prisma.provider.findMany({ where: { projectId: null } });
    const p2Providers = await prisma.provider.findMany({
        where: { OR: [{ projectId: p2.id }, { projectId: null }] }
    });

    if (p2Providers.some(p => p.id === prov1.id)) {
        throw new Error('❌ FAIL: Project 2 sees Project 1 provider');
    }
    console.log('✅ PASS: Provider isolation verified (P2 cannot see P1 provider)');

    // --- TEST 2: IMPORT SERVICES ---
    console.log('\n[Step 2] Importing services into Project 1...');
    // Create a global service first
    const serviceId = 'tenancy-test-svc';
    await prisma.internalService.upsert({
        where: { id: serviceId },
        update: {},
        create: {
            id: serviceId,
            name: 'Shared Service',
            platform: 'TELEGRAM',
            category: 'SUBSCRIBERS',
            description: 'Shared',
            geo: 'WORLDWIDE',
            pricePer1000: new Decimal(100),
            minQty: 10,
            maxQty: 10000
        }
    });

    // Create provider service (as if fetched from API)
    const externalId = 5005;
    await prisma.providerService.upsert({
        where: { id_providerId: { id: externalId, providerId: prov1.id } },
        update: {},
        create: {
            id: externalId,
            providerId: prov1.id,
            name: 'External TG Members',
            rawPrice: new Decimal(50),
            platform: 'TELEGRAM',
            category: 'SUBSCRIBERS',
            rawData: {}
        }
    });

    // Create Mapping for P1
    await prisma.internalServiceMapping.create({
        data: {
            projectId: p1.id,
            internalServiceId: serviceId,
            providerId: prov1.id,
            providerServiceId: externalId,
            priority: 1
        }
    });

    const p1Mappings = await prisma.internalServiceMapping.findMany({ where: { projectId: p1.id } });
    const p2Mappings = await prisma.internalServiceMapping.findMany({ where: { projectId: p2.id } });

    console.log(`P1 Mappings count: ${p1Mappings.length}`);
    console.log(`P2 Mappings count: ${p2Mappings.length}`);

    if (p1Mappings.length === 1 && p2Mappings.length === 0) {
        console.log('✅ PASS: Service mappings are project-isolated');
    } else {
        throw new Error('❌ FAIL: Mapping isolation failed');
    }

    // --- TEST 3: EDITING (OVERRIDES) ---
    console.log('\n[Step 3] Creating project-specific price override for P1...');
    const customPrice = new Decimal(250);
    const customName = 'P1 Exclusive TG Channel';

    await prisma.projectServiceOverride.create({
        data: {
            projectId: p1.id,
            internalServiceId: serviceId,
            customPrice: customPrice,
            customName: customName
        }
    });

    // Resolve final data for P1
    const getFinalSvc = async (pId: string) => {
        const base = await prisma.internalService.findUnique({ where: { id: serviceId } });
        const ovr = await prisma.projectServiceOverride.findUnique({
            where: { projectId_internalServiceId: { projectId: pId, internalServiceId: serviceId } }
        });
        return {
            name: ovr?.customName || base?.name,
            price: ovr?.customPrice?.toNumber() || base?.pricePer1000.toNumber()
        };
    };

    const final1 = await getFinalSvc(p1.id);
    const final2 = await getFinalSvc(p2.id);

    console.log(`P1 Resolver: ${final1.name} | ${final1.price} RUB`);
    console.log(`P2 Resolver: ${final2.name} | ${final2.price} RUB (Global Default)`);

    if (final1.price === 250 && final2.price === 100) {
        console.log('✅ PASS: Project overrides work as expected');
    } else {
        throw new Error('❌ FAIL: Overrides logic failing');
    }

    console.log('\n--- 🏁 ALL TENANCY TESTS PASSED SUCCESSFULLY 🏁 ---');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
