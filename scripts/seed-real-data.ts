import { PrismaClient, Platform, Category, Role, TransactionType, TransactionStatus, OrderStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import * as dotenv from 'dotenv';
import { ServiceSyncService } from '../src/services/providers/sync.service';
import { SmartAnalyzerService } from '../src/services/providers/smart-analyzer.service';
import { PricingService } from '../src/services/finance/pricing.service';
import bcrypt from 'bcryptjs';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Real Data Seeding...');

    // 1. Ensure Project exists
    let project = await prisma.project.findFirst();
    if (!project) {
        console.log('Creating default project...');
        project = await prisma.project.create({
            data: {
                name: 'Smmplan Main',
                slug: 'main',
                domain: 'localhost',
            }
        });
    }
    console.log(`Using Project: ${project.name} (${project.id})`);

    // 1b. Ensure Project 101 exists for test scripts
    let project101 = await prisma.project.findUnique({ where: { slug: '101' } });
    if (!project101) {
        console.log('Creating project 101 for security tests...');
        project101 = await prisma.project.create({
            data: {
                name: 'Test Project 101',
                slug: '101',
                domain: 'test101.local',
            }
        });
    }

    // 2. Trigger initial sync for all providers (non-fatal)
    console.log('--- Triggering initial sync for all providers ---');
    try {
        await ServiceSyncService.syncAllServices();
    } catch (e) {
        console.warn('⚠️ Sync failed or partially failed, proceeding with DB data:', e);
    }

    // 3. Find the best provider with services AFTER sync
    let providers = await prisma.provider.findMany({
        include: { _count: { select: { services: true } } }
    });

    let provider = providers.sort((a, b) => b._count.services - a._count.services)[0];

    if (!provider || provider._count.services === 0) {
        console.log('Available providers:', providers.map(p => `${p.name}: ${p._count.services}`).join(', '));
        throw new Error('No provider with services found. Sync might have failed completely.');
    }
    console.log(`Using Provider for Importer: ${provider.name} (${provider.id}) with ${provider._count.services} services.`);

    // 5. Select and Import Quality Services
    console.log('Importing high-quality services...');
    const providerServices = await prisma.providerService.findMany({
        where: { providerId: provider.id },
        orderBy: { rawPrice: 'asc' }
    });

    if (providerServices.length === 0) {
        throw new Error('No provider services found in DB. Cannot proceed without real data.');
    }

    const selects = [
        { platform: 'TELEGRAM', category: 'SUBSCRIBERS', keywords: ['подписчики', 'канал', 'быстр'], count: 2, group: 'TG: Подписчики' },
        { platform: 'TELEGRAM', category: 'LIKES', keywords: ['лайки', 'реакции'], count: 2, group: 'TG: Лайки' },
        { platform: 'TELEGRAM', category: 'VIEWS', keywords: ['просмотры'], count: 1, group: 'TG: Просмотры' },
        { platform: 'VK', category: 'SUBSCRIBERS', keywords: ['вк', 'группа', 'друзья'], count: 3, group: 'VK: Подписчики' },
        { platform: 'VK', category: 'LIKES', keywords: ['лайки'], count: 2, group: 'VK: Лайки' },
    ];

    const importedServices: any[] = [];

    for (const sel of selects) {
        const matches = providerServices.filter(s =>
            s.platform === sel.platform &&
            s.category === sel.category &&
            sel.keywords.some(k => s.name.toLowerCase().includes(k))
        ).slice(0, sel.count);

        for (const s of matches) {
            const id = `${s.platform}_${s.category}_${s.id}`.toLowerCase();
            const analysis = await SmartAnalyzerService.analyzeService(s.name, (s.rawData as any).description || '', s.category);

            const retailPrice = await PricingService.calculateRetailPrice(s.rawPrice, {
                providerName: provider.name,
                category: s.category as Category,
                projectId: project.id
            });

            const internal = await prisma.internalService.upsert({
                where: { id },
                update: {
                    name: s.name,
                    description: analysis?.description_ru || s.name,
                    pricePer1000: retailPrice,
                    minQty: (s.rawData as any).min || 10,
                    maxQty: (s.rawData as any).max || 100000,
                    isActive: true,
                    targetType: analysis?.targetType || 'POST'
                },
                create: {
                    id,
                    platform: s.platform,
                    category: s.category,
                    name: s.name,
                    description: analysis?.description_ru || s.name,
                    pricePer1000: retailPrice,
                    minQty: (s.rawData as any).min || 10,
                    maxQty: (s.rawData as any).max || 100000,
                    isActive: true,
                    targetType: analysis?.targetType || 'POST',
                    geo: 'Мир'
                }
            });

            await prisma.internalServiceMapping.upsert({
                where: {
                    projectId_internalServiceId_providerId: {
                        projectId: project.id,
                        internalServiceId: id,
                        providerId: provider.id
                    }
                },
                update: { isActive: true },
                create: {
                    projectId: project.id,
                    internalServiceId: id,
                    providerServiceId: s.externalId,
                    providerId: provider.id,
                    isActive: true,
                    priority: 1
                }
            });

            importedServices.push(internal);
            console.log(`✅ Imported: ${internal.name} -> ${retailPrice}₽`);
        }
    }

    // 6. Create Test User and Prod Admin
    console.log('Creating test user and production-like admin...');
    const hashedPassword = await bcrypt.hash('admin12345678', 10);

    const testUser = await prisma.user.upsert({
        where: { email: 'tester@smmplan.ru' },
        update: { balance: new Decimal(5000), role: 'USER' as Role, password: hashedPassword },
        create: {
            email: 'tester@smmplan.ru',
            username: 'tester',
            balance: new Decimal(5000),
            projectId: project.id,
            role: 'USER' as Role,
            password: hashedPassword
        }
    });

    await prisma.user.upsert({
        where: { email: 'art@artmspektr.ru' },
        update: { role: 'ADMIN' as Role, isGlobalAdmin: true, password: hashedPassword },
        create: {
            email: 'art@artmspektr.ru',
            username: 'Artem',
            role: 'ADMIN' as Role,
            isGlobalAdmin: true,
            projectId: project.id,
            balance: new Decimal(1000000),
            password: hashedPassword
        }
    });
    console.log('✅ Admin art@artmspektr.ru configured locally!');

    // 7. Create 10 Test Orders with transaction logs
    console.log('Creating 10 test orders and transactions...');

    // Initial Deposit
    await prisma.transaction.create({
        data: {
            userId: testUser.id,
            projectId: project.id,
            amount: new Decimal(5000),
            type: 'DEPOSIT' as TransactionType,
            provider: 'YOOKASSA',
            status: 'COMPLETED' as TransactionStatus,
            metadata: { description: 'Пополнение баланса (тест)' }
        }
    });

    const orderConfigs = [
        { status: 'COMPLETED' as OrderStatus, link: 'https://t.me/durov' },
        { status: 'PENDING' as OrderStatus, link: 'https://t.me/test_channel' },
        { status: 'PROCESSING' as OrderStatus, link: 'https://t.me/another_test' },
        { status: 'CANCELED' as OrderStatus, link: 'https://vk.com/id1' }, // Canceled for refund test
        { status: 'IN_PROGRESS' as OrderStatus, link: 'https://vk.com/test_group' },
        { status: 'COMPLETED' as OrderStatus, link: 'https://t.me/durov_post/1' },
        { status: 'PARTIAL' as OrderStatus, link: 'https://t.me/partial_test' },
        { status: 'COMPLETED' as OrderStatus, link: 'https://vk.com/wall1_1' },
        { status: 'PENDING' as OrderStatus, link: 'https://t.me/new_protocol' },
        { status: 'COMPLETED' as OrderStatus, link: 'https://t.me/final_test' },
    ];

    for (let i = 0; i < 10; i++) {
        const service = importedServices[i % importedServices.length];
        const config = orderConfigs[i];
        const qty = 100;
        const price = service.pricePer1000.mul(qty).div(1000);

        const order = await prisma.order.create({
            data: {
                userId: testUser.id,
                projectId: project.id,
                internalServiceId: service.id,
                link: config.link,
                quantity: qty,
                totalPrice: price,
                status: config.status,
                costPrice: service.pricePer1000.div(2),
                providerName: provider.name,
                externalId: `${Math.floor(100000 + Math.random() * 900000)}`
            }
        });

        // Transaction: NEW_ORDER or ORDER_PAYMENT
        await prisma.transaction.create({
            data: {
                userId: testUser.id,
                projectId: project.id,
                orderId: order.id,
                amount: price,
                type: (i % 2 === 0) ? 'NEW_ORDER' : 'ORDER_PAYMENT',
                provider: 'INTERNAL',
                status: 'COMPLETED',
                metadata: { description: `Оплата заказа ${order.id}` }
            }
        });

        // STATUS_CHANGE log
        await prisma.transaction.create({
            data: {
                userId: testUser.id,
                projectId: project.id,
                orderId: order.id,
                amount: new Decimal(0),
                type: 'ORDER_STATUS_CHANGE',
                provider: 'SYSTEM',
                status: 'COMPLETED',
                metadata: { description: `Смена статуса на ${config.status}` }
            }
        });

        // Special case: Refund for Canceled/Partial
        if (config.status === 'CANCELED' || config.status === 'PARTIAL') {
            const refundAmount = config.status === 'CANCELED' ? price : price.div(2);
            await prisma.transaction.create({
                data: {
                    userId: testUser.id,
                    projectId: project.id,
                    orderId: order.id,
                    amount: refundAmount,
                    type: 'REFUND',
                    provider: 'INTERNAL',
                    status: 'COMPLETED',
                    metadata: { description: 'Возврат средств за отмененный заказ' }
                }
            });
            await prisma.user.update({
                where: { id: testUser.id },
                data: { balance: { increment: refundAmount } }
            });
        }

        // Deduct balance for initial order
        await prisma.user.update({
            where: { id: testUser.id },
            data: {
                balance: { decrement: price },
                spent: { increment: price }
            }
        });
    }

    console.log('✅ Real data seeding finished successfully!');
}

main()
    .catch(e => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
