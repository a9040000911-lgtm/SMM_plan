import { PrismaClient, Platform, Category, Role, TransactionType, TransactionStatus, OrderStatus } from '@prisma/client';
import { Decimal } from 'decimal.js';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting standalone business data seeding...');

    // 1. Ensure Project and Admin
    const project = await prisma.project.upsert({
        where: { slug: 'main' },
        update: {},
        create: {
            id: 'main',
            name: 'Smmplan Main',
            slug: 'main',
            domain: 'smmplan.ru',
            config: {}
        }
    });

    const admin = await prisma.user.upsert({
        where: { email: 'admin@smmplan.ru' },
        update: { role: 'ADMIN', isGlobalAdmin: true },
        create: {
            username: 'admin',
            email: 'admin@smmplan.ru',
            role: 'ADMIN',
            isGlobalAdmin: true,
            balance: new Decimal(100000),
            projectId: project.id
        }
    });

    console.log('✅ Base infrastructure ready.');

    // 2. Clear previous data in correct order (optional/safety)
    // We skip deleteMany to avoid accidents, but you can uncomment if needed

    const services: any[] = [];

    // --- TELEGRAM ---
    const tgData = [
        { id: 'EXT_TG_SUB_ECO', name: 'Подписчики [Эконом]', price: 45, desc: 'Бюджетные боты со всего мира. Возможны списания. Без гарантии.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_TG_SUB_STD', name: 'Подписчики [Стандарт]', price: 120, desc: 'Аккаунты с аватарками и именами. Средняя скорость и стабильность.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_TG_SUB_REAL', name: 'Подписчики [Живые RU]', price: 350, desc: 'Реальные пользователи из СНГ. Высокое удержание. Гарантия 30 дней.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_TG_VIEW_FAST', name: 'Просмотры [Мгновенные]', price: 2, desc: 'Быстрый запуск на один пост. Микс стран.', cat: Category.VIEWS, target: 'POST' },
        { id: 'EXT_TG_REAC_POS', name: 'Реакции [Позитив]', price: 8, desc: 'Набор положительных эмоций: 👍, ❤️, 🔥, 🥰.', cat: Category.REACTIONS, target: 'POST' },
    ];
    tgData.forEach(s => services.push({ ...s, platform: Platform.TELEGRAM }));

    // --- VK ---
    const vkData = [
        { id: 'EXT_VK_SUB_STD', name: 'ВК Подписчики [Стандарт]', price: 250, desc: 'Качественные офферы с аватарками в группу или паблик.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_VK_LIKE_REAL', name: 'ВК Лайки [Живые RU]', price: 85, desc: 'Лайки от реальных пользователей из СНГ.', cat: Category.LIKES, target: 'POST' },
    ];
    vkData.forEach(s => services.push({ ...s, platform: Platform.VK }));

    // 3. Batch Create
    console.log(`📦 Creating ${services.length} services...`);
    for (const s of services) {
        await prisma.internalService.upsert({
            where: { id: s.id },
            update: {
                name: s.name,
                description: s.desc,
                pricePer1000: new Decimal(s.price),
                isActive: true
            },
            create: {
                id: s.id,
                platform: s.platform,
                category: s.cat,
                name: s.name,
                description: s.desc,
                geo: s.id.includes('_RU') ? 'Russia' : 'Global',
                pricePer1000: new Decimal(s.price),
                minQty: 10,
                maxQty: 1000000,
                isActive: true,
                priceUnit: 1000,
                targetType: s.target as any
            }
        });

        // Ensure mapping to project
        await prisma.projectServiceOverride.upsert({
            where: {
                projectId_internalServiceId: {
                    projectId: project.id,
                    internalServiceId: s.id
                }
            },
            update: { isActive: true },
            create: {
                projectId: project.id,
                internalServiceId: s.id,
                isActive: true
            }
        });
    }

    console.log('✅ Catalog populated and mapped to project.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
