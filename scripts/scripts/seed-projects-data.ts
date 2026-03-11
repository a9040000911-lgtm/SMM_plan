
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';
import { Platform, Category, OrderStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Setting up multi-project environment (SMMPlan & SMMgold)...');

    // 1. Projects Setup
    const projectsData = [
        {
            id: 'smmplan-id',
            name: 'SMMPlan',
            slug: 'smmplan',
            domain: 'smmplan.pro',
            tgMarkup: 7.0,   // +700% (multiplier x8)
            twMarkup: 100.0, // +10000% (multiplier x101)
            defMarkup: 10.0  // +1000% (multiplier x11)
        },
        {
            id: 'smmgold-id',
            name: 'SMMgold',
            slug: 'smmgold',
            domain: 'smmgold.top',
            tgMarkup: 12.5,  // +1250% (multiplier x13.5)
            twMarkup: 150.0, // +15000% (multiplier x151)
            defMarkup: 20.0  // +2000% (multiplier x21)
        }
    ];

    const projects = [];
    for (const p of projectsData) {
        const project = await prisma.project.upsert({
            where: { slug: p.slug },
            update: { name: p.name, domain: p.domain },
            create: {
                id: p.id,
                name: p.name,
                slug: p.slug,
                domain: p.domain,
                config: {}
            }
        });
        projects.push({ ...project, meta: p });
    }

    // 2. Admin User
    const admin = await prisma.user.upsert({
        where: { id: 'admin-user' },
        update: {},
        create: {
            id: 'admin-user',
            username: 'admin',
            role: 'ADMIN',
            tgId: BigInt(268747191),
            balance: new Decimal(100000),
            projectId: projects[0].id // Default to SMMPlan
        }
    });

    // 3. Setup Markups (Service Overrides)
    console.log('⚖️ Configuring project-specific markups...');
    const internalServices = await prisma.internalService.findMany();

    for (const project of projects) {
        console.log(`  - Processing ${project.name}...`);
        for (const service of internalServices) {
            let markup = project.meta.defMarkup;
            if (service.platform === Platform.TELEGRAM) markup = project.meta.tgMarkup;
            if (service.platform === Platform.TWITCH) markup = project.meta.twMarkup;

            // Rule: Price = Cost * (1 + markup)
            // costPrice is dummy in this test, using internalService base price as 'cost'
            const basePrice = service.pricePer1000;
            const customPrice = basePrice.mul(1 + markup);

            await prisma.projectServiceOverride.upsert({
                where: {
                    projectId_internalServiceId: {
                        projectId: project.id,
                        internalServiceId: service.id
                    }
                },
                update: { customPrice, isActive: true },
                create: {
                    projectId: project.id,
                    internalServiceId: service.id,
                    customPrice,
                    isActive: true
                }
            });
        }
    }

    // 4. Generate Mock Orders (100 per project)
    console.log('📦 Generating mock orders (100 per project)...');
    for (const project of projects) {
        const ordersToCreate = [];
        for (let i = 1; i <= 100; i++) {
            const service = internalServices[Math.floor(Math.random() * internalServices.length)];
            const qty = 100 + Math.floor(Math.random() * 5000);

            // Find override price for this project
            let markup = project.meta.defMarkup;
            if (service.platform === Platform.TELEGRAM) markup = project.meta.tgMarkup;
            if (service.platform === Platform.TWITCH) markup = project.meta.twMarkup;

            const pricePer1000 = service.pricePer1000.mul(1 + markup);
            const totalPrice = pricePer1000.mul(qty).div(1000);

            ordersToCreate.push({
                userId: admin.id,
                projectId: project.id,
                internalServiceId: service.id,
                quantity: qty,
                totalPrice: totalPrice,
                link: 'https://example.com/test',
                status: [OrderStatus.COMPLETED, OrderStatus.PROCESSING, OrderStatus.PENDING][i % 3],
                providerName: 'VexBoost',
                externalId: `EXT_${project.slug}_${Date.now()}_${i}`,
                createdAt: new Date(Date.now() - (i * 1800000)) // spread over ~50 hours
            });
        }

        // Batch create orders
        for (const o of ordersToCreate) {
            await prisma.order.create({
                data: o
            });
        }
        console.log(`  ✅ ${project.name}: 100 orders created.`);
    }

    console.log('\n🏁 Multi-project seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
