/**
 * E2E Test: Create test orders via API and verify provider dispatch
 * Run: npx tsx scripts/test-orders-e2e.ts
 */
import { PrismaClient, Decimal } from '@prisma/client';

const prisma = new PrismaClient();
const BASE = 'http://localhost:3000';

async function main() {
    console.log('🧪 E2E Test: Тестовые заказы у провайдеров\n');

    // ═══════════════════════════════════════════════════
    // STEP 1: Diagnostics — check what we have
    // ═══════════════════════════════════════════════════
    const providers = await prisma.provider.findMany({
        select: { id: true, name: true, isEnabled: true, apiUrl: true, type: true }
    });
    console.log('📡 Провайдеры в системе:');
    providers.forEach(p => {
        const status = p.isEnabled ? '✅' : '❌';
        console.log(`  ${status} ${p.name} (${p.type}) — ${p.apiUrl}`);
    });

    const totalServices = await prisma.internalService.count({ where: { isActive: true } });
    const totalMappings = await prisma.internalServiceMapping.count({ where: { isActive: true } });
    console.log(`\n📦 Услуг в каталоге: ${totalServices}`);
    console.log(`🔗 Привязок к провайдерам: ${totalMappings}`);

    // Find services WITH provider mappings
    const servicesWithMappings = await prisma.internalService.findMany({
        where: {
            isActive: true,
            providerMappings: { some: { isActive: true } }
        },
        include: {
            socialPlatform: true,
            serviceCategory: true,
            providerMappings: {
                where: { isActive: true },
                include: {
                    provider: { select: { name: true, isEnabled: true, apiUrl: true } },
                    providerService: { select: { id: true, externalId: true, name: true } }
                }
            }
        },
        take: 20
    });

    console.log(`\n🎯 Услуги с привязками (для тестирования): ${servicesWithMappings.length}`);
    servicesWithMappings.forEach(s => {
        const mapping = s.providerMappings[0];
        console.log(`  [${s.id}] ${s.name.substring(0, 60)}`);
        console.log(`      → Провайдер: ${mapping.provider.name}, Услуга: ${mapping.providerService?.externalId || mapping.providerServiceId}`);
        console.log(`      → Цена: ${s.pricePer1000}₽/1000, Мин: ${s.minQty}`);
    });

    if (servicesWithMappings.length === 0) {
        console.log('\n⚠️  Нет услуг с активными привязками к провайдерам!');
        console.log('   Создаю тестовые привязки к мок-провайдеру...\n');
        await createMockMappings();
        return main(); // re-run
    }

    // ═══════════════════════════════════════════════════
    // STEP 2: Prepare test user with balance
    // ═══════════════════════════════════════════════════
    const project = await prisma.project.findFirst();
    if (!project) {
        console.error('❌ Нет проекта в системе!');
        return;
    }

    const TEST_EMAIL = 'test-orders@smmplan.dev';
    let testUser = await prisma.user.findFirst({ where: { email: TEST_EMAIL, projectId: project.id } });
    
    if (!testUser) {
        const bcrypt = await import('bcryptjs');
        testUser = await prisma.user.create({
            data: {
                email: TEST_EMAIL,
                password: await bcrypt.hash('testpass123', 10),
                username: 'test_orders',
                projectId: project.id,
                balance: 50000
            }
        });
        console.log(`\n👤 Создан тестовый пользователь: ${TEST_EMAIL} (баланс: 50,000₽)`);
    } else {
        // Top up balance
        await prisma.user.update({
            where: { id: testUser.id },
            data: { balance: 50000 }
        });
        console.log(`\n👤 Тестовый пользователь обновлён: ${TEST_EMAIL} (баланс: 50,000₽)`);
    }

    // ═══════════════════════════════════════════════════
    // STEP 3: Create test orders DIRECTLY in DB
    // ═══════════════════════════════════════════════════
    console.log('\n📝 Создаю тестовые заказы...\n');

    const testLinks: Record<string, string> = {
        'TELEGRAM': 'https://t.me/durov',
        'INSTAGRAM': 'https://www.instagram.com/p/test123/',
        'VK': 'https://vk.com/durov',
        'YOUTUBE': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'TIKTOK': 'https://www.tiktok.com/@test/video/123456789',
        'OTHER': 'https://example.com/test'
    };

    const createdOrders: number[] = [];

    // Pick up to 5 services with mappings to test
    const testServices = servicesWithMappings.slice(0, 5);

    for (const svc of testServices) {
        const platform = svc.socialPlatform?.slug?.toUpperCase() || 'OTHER';
        const link = testLinks[platform] || testLinks['OTHER'];
        const quantity = svc.minQty || 100;
        const price = (Number(svc.pricePer1000) * quantity) / 1000;

        try {
            const order = await prisma.order.create({
                data: {
                    projectId: project.id,
                    userId: testUser.id,
                    internalServiceId: svc.id,
                    link,
                    quantity,
                    totalPrice: price,
                    costPrice: 0,
                    status: 'PENDING',
                    isDripFeed: false,
                    runs: 1,
                    interval: 0,
                    currentRun: 0,
                    metadata: { source: 'e2e_test', testRun: true }
                }
            });

            createdOrders.push(order.id);
            console.log(`  ✅ Заказ #${order.id}: ${svc.name.substring(0, 50)}`);
            console.log(`     Ссылка: ${link}`);
            console.log(`     Количество: ${quantity}, Цена: ${price.toFixed(2)}₽`);
            console.log(`     Провайдер: ${svc.providerMappings[0]?.provider.name}`);
        } catch (err: any) {
            console.log(`  ❌ Ошибка создания заказа для ${svc.name.substring(0, 30)}: ${err.message}`);
        }
    }

    console.log(`\n📊 Итого создано ${createdOrders.length} тестовых заказов со статусом PENDING`);

    // ═══════════════════════════════════════════════════
    // STEP 4: Trigger OrderQueue processing
    // ═══════════════════════════════════════════════════
    console.log('\n⚡ Запускаю обработку очереди заказов (OrderQueueService)...\n');

    try {
        // Dynamic import to use project's service
        const { OrderQueueService } = await import('../src/services/orders/order-queue.service');
        
        for (const orderId of createdOrders) {
            console.log(`  🔄 Обрабатываю заказ #${orderId}...`);
            try {
                await OrderQueueService.processPendingOrders(orderId);
                
                // Check result
                const updated = await prisma.order.findUnique({ where: { id: orderId } });
                if (updated) {
                    const statusEmoji = updated.status === 'PROCESSING' ? '✅' : 
                                       updated.status === 'CANCELED' ? '❌' : '⏳';
                    console.log(`     ${statusEmoji} Статус: ${updated.status}`);
                    if (updated.externalId) console.log(`     📋 External ID: ${updated.externalId}`);
                    if (updated.providerName) console.log(`     🏭 Провайдер: ${updated.providerName}`);
                    if (updated.providerRawResponse) {
                        console.log(`     📦 Ответ провайдера: ${JSON.stringify(updated.providerRawResponse).substring(0, 200)}`);
                    }
                }
            } catch (err: any) {
                console.log(`     ❌ Ошибка: ${err.message.substring(0, 100)}`);
            }
        }
    } catch (importErr: any) {
        console.log(`  ⚠️  Не удалось импортировать OrderQueueService: ${importErr.message}`);
        console.log('     Попробую через HTTP API...');

        // Fallback: trigger via HTTP
        try {
            const res = await fetch(`${BASE}/api/admin/orders/process-queue`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-key': process.env.ADMIN_MASTER_KEY || '777777' }
            });
            console.log(`     HTTP Queue trigger: ${res.status} ${res.statusText}`);
        } catch (httpErr: any) {
            console.log(`     HTTP trigger failed: ${httpErr.message}`);
        }
    }

    // ═══════════════════════════════════════════════════
    // STEP 5: Final Summary
    // ═══════════════════════════════════════════════════
    console.log('\n' + '═'.repeat(60));
    console.log('📊 ФИНАЛЬНЫЙ ОТЧЁТ');
    console.log('═'.repeat(60));

    for (const orderId of createdOrders) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { internalService: { select: { name: true } } }
        });
        if (order) {
            const emoji = order.status === 'PROCESSING' ? '🟢' :
                         order.status === 'COMPLETED' ? '✅' :
                         order.status === 'CANCELED' ? '🔴' : '🟡';
            console.log(`  ${emoji} #${order.id} | ${order.status.padEnd(12)} | ${order.internalService.name.substring(0, 40)}`);
            if (order.externalId) console.log(`     └─ Provider: ${order.providerName} / ExtID: ${order.externalId}`);
        }
    }

    console.log('\n✅ Тест завершён!');
}

async function createMockMappings() {
    // Find provider (mock)
    const provider = await prisma.provider.findFirst({ where: { isEnabled: true } });
    if (!provider) {
        console.error('❌ Нет включённых провайдеров! Зарегистрируйте хотя бы одного в Админ > Провайдеры.');
        process.exit(1);
    }

    // Get first N provider services
    const providerServices = await prisma.providerService.findMany({
        where: { providerId: provider.id },
        take: 10
    });

    if (providerServices.length === 0) {
        console.error(`❌ У провайдера "${provider.name}" нет синхронизированных услуг.`);
        console.error('   Запустите синхронизацию из Админки → Провайдеры → Синхронизация.');
        process.exit(1);
    }

    // Take our first 5 internal services and map them
    const internalServices = await prisma.internalService.findMany({ where: { isActive: true }, take: 5 });

    for (let i = 0; i < Math.min(internalServices.length, providerServices.length); i++) {
        const exists = await prisma.internalServiceMapping.findFirst({
            where: { internalServiceId: internalServices[i].id, providerId: provider.id }
        });
        if (exists) continue;

        await prisma.internalServiceMapping.create({
            data: {
                internalServiceId: internalServices[i].id,
                providerId: provider.id,
                providerServiceId: providerServices[i].id,
                priority: 1,
                isActive: true
            }
        });
        console.log(`  🔗 Привязал: "${internalServices[i].name.substring(0, 40)}" → ${provider.name} / ${providerServices[i].externalId}`);
    }

    console.log(`\n✅ Создано ${Math.min(internalServices.length, providerServices.length)} тестовых привязок!\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
