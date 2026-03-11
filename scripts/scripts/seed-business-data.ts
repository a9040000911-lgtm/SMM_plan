
import { prisma } from '../src/lib/prisma';
import { Decimal } from 'decimal.js';
import { Platform, Category, TicketStatus, TransactionType, TransactionStatus, OrderStatus } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log('🚀 Starting business data seeding with correct targetType and descriptions...');

    // 1. Ensure Project and Admin
    const project = await prisma.project.upsert({
        where: { slug: 'main' },
        update: {},
        create: {
            id: 'main',
            name: 'Smmplan Main',
            slug: 'main',
            domain: 'smmplan.local',
            config: {}
        }
    });

    const admin = await prisma.user.upsert({
        where: { id: 'admin-user' },
        update: {},
        create: {
            id: 'admin-user',
            username: 'admin',
            role: 'ADMIN',
            tgId: BigInt(268747191),
            balance: new Decimal(20000),
            projectId: project.id
        }
    });

    console.log('✅ Base infrastructure ready.');

    // 2. Clear previous data in correct order
    console.log('🗑️ Cleaning up previous data...');
    await prisma.supportMessage.deleteMany({ where: { OR: [{ ticketId: { startsWith: 'MOCK_TIK_' } }, { ticketId: { startsWith: 'SIM_TIK_' } }, { ticket: { userId: admin.id } }] } });
    await prisma.supportTicket.deleteMany({ where: { OR: [{ id: { startsWith: 'MOCK_TIK_' } }, { id: { startsWith: 'SIM_TIK_' } }, { userId: admin.id }] } });
    await prisma.order.deleteMany({ where: { OR: [{ userId: admin.id }] } });
    await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: { startsWith: 'EXT_' } } });
    await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: { startsWith: 'TEST_' } } });
    await prisma.internalService.deleteMany({ where: { id: { startsWith: 'EXT_TG_' } } });
    await prisma.internalService.deleteMany({ where: { id: { startsWith: 'EXT_TW_' } } });
    await prisma.internalService.deleteMany({ where: { id: { startsWith: 'EXT_VK_' } } });
    await prisma.internalService.deleteMany({ where: { id: { startsWith: 'TEST_' } } });

    const services: any[] = [];

    // --- TELEGRAM ---
    const tgData = [
        // Subscribers (CHANNEL)
        { id: 'EXT_TG_SUB_ECO', name: 'Подписчики [Эконом]', price: 45, desc: 'Бюджетные боты со всего мира. Возможны списания. Без гарантии.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_TG_SUB_STD', name: 'Подписчики [Стандарт]', price: 120, desc: 'Аккаунты с аватарками и именами. Средняя скорость и стабильность.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_TG_SUB_REAL', name: 'Подписчики [Живые RU]', price: 350, desc: 'Реальные пользователи из СНГ. Высокое удержание. Гарантия 30 дней.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_TG_SUB_NODROP', name: 'Подписчики [Без списаний]', price: 550, desc: 'Максимальная стабильность. Гарантия восполнения (Refill) 90 дней.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_TG_SUB_PREM', name: 'Подписчики [Telegram Premium]', price: 1500, desc: 'Пользователи с подпиской Premium. Повышают траст канала в поиске.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },

        // Views (POST)
        { id: 'EXT_TG_VIEW_FAST', name: 'Просмотры [Мгновенные]', price: 2, desc: 'Быстрый запуск на один пост. Микс стран.', cat: Category.VIEWS, target: 'POST' },
        { id: 'EXT_TG_VIEW_STORY', name: 'Просмотры Stories', price: 120, desc: 'Просмотры ваших историй реальными пользователями.', cat: Category.VIEWS, target: 'STORY' },
        { id: 'EXT_TG_VIEW_AUTO10', name: 'Авто-просмотры [10 постов]', price: 35, desc: 'Автоматическое начисление просмотров на 10 будущих постов канала.', cat: Category.VIEWS, target: 'CHANNEL' }, // Link to channel
        { id: 'EXT_TG_VIEW_CHANNEL', name: 'Просмотры на старые посты', price: 80, desc: 'Распределение просмотров по всей ленте канала (последние 20-50 постов).', cat: Category.VIEWS, target: 'CHANNEL' },

        // Reactions (POST)
        { id: 'EXT_TG_REAC_POS', name: 'Реакции [Позитив]', price: 8, desc: 'Набор положительных эмоций: 👍, ❤️, 🔥, 🥰. Быстрый старт.', cat: Category.REACTIONS, target: 'POST' },
        { id: 'EXT_TG_REAC_PREM', name: 'Реакции Premium', price: 85, desc: 'Реакции только от пользователей с Telegram Premium.', cat: Category.REACTIONS, target: 'POST' },

        // Boosts (CHANNEL)
        { id: 'EXT_TG_BST_1M', name: 'Бусты [1 Месяц]', price: 850, desc: 'Стабильные бусты на 30 дней. Помогают разблокировать Stories и цвета.', cat: Category.BOOSTS, target: 'CHANNEL' },

        // Comments (POST)
        { id: 'EXT_TG_COM_RU', name: 'Комментарии [Живые RU]', price: 950, desc: 'Осмысленные комментарии от реальных RU-аккаунтов по теме контента.', cat: Category.COMMENTS, target: 'POST' },

        // Reposts (POST)
        { id: 'EXT_TG_REP_RU', name: 'Репосты [Россия]', price: 95, desc: 'Живые репосты от пользователей из СНГ. Повышают охват.', cat: Category.REPOSTS, target: 'POST' },
    ];
    tgData.forEach(s => services.push({ ...s, platform: Platform.TELEGRAM }));

    // --- VK ---
    const vkData = [
        // Subscribers (CHANNEL/PROFILE)
        { id: 'EXT_VK_SUB_STD', name: 'ВК Подписчики [Стандарт]', price: 250, desc: 'Качественные офферы с аватарками в группу или паблик.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_VK_SUB_REAL', name: 'ВК Подписчики [Живые RU]', price: 650, desc: 'Активные пользователи из РФ. Гарантия 30 дней.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
        { id: 'EXT_VK_FR_STD', name: 'ВК Друзья/Заявки', price: 180, desc: 'Добавление в друзья на личную страницу. Высокое качество.', cat: Category.FRIENDS, target: 'CHANNEL' }, // VK_PROFILE maps to CHANNEL in logic

        // Likes (POST)
        { id: 'EXT_VK_LIKE_REAL', name: 'ВК Лайки [Живые RU]', price: 85, desc: 'Лайки от реальных пользователей из СНГ.', cat: Category.LIKES, target: 'POST' },
        { id: 'EXT_VK_LIKE_PHOTO', name: 'ВК Лайки на Фото', price: 25, desc: 'Специальный алгоритм для аватарок и альбомов.', cat: Category.LIKES, target: 'PHOTO' },

        // Polls (POLL)
        { id: 'EXT_VK_POLL_TARGET', name: 'ВК Голоса в опросе', price: 180, desc: 'Голосование за конкретный пункт в опросе. Гарантия результата.', cat: Category.POLLS, target: 'POLL' },

        // Views (POST/VIDEO/CLIP/PLAYLIST)
        { id: 'EXT_VK_VIEW_POST', name: 'ВК Просмотры на пост', price: 5, desc: 'Просмотры (глазок) под записью на стене.', cat: Category.VIEWS, target: 'POST' },
        { id: 'EXT_VK_VIEW_VIDEO', name: 'ВК Просмотры Видео', price: 35, desc: 'Просмотры вашего ролика. Считаются в статистику.', cat: Category.VIEWS, target: 'VK_VIDEO' },
        { id: 'EXT_VK_VIEW_CLIPS', name: 'ВК Просмотры Клипов', price: 15, desc: 'Быстрые просмотры для раздела VK Clips.', cat: Category.VIEWS, target: 'VK_CLIP' },
        { id: 'EXT_VK_VIEW_MUSIC', name: 'ВК Прослушивания плейлиста', price: 120, desc: 'Прослушивания вашего музыкального плейлиста или трека.', cat: Category.VIEWS, target: 'PLAYLIST' },

        // Comments (POST)
        { id: 'EXT_VK_COM_REAL', name: 'ВК Комментарии [Живые]', price: 850, desc: 'Осмысленные комментарии от реальных пользователей.', cat: Category.COMMENTS, target: 'POST' },
    ];
    vkData.forEach(s => services.push({ ...s, platform: Platform.VK }));

    // --- TWITCH ---
    const twData = [
        { id: 'EXT_TW_VIEW_1H', name: 'Twitch Зрители [1 Час]', price: 350, desc: 'Стабильное удержание зрителей на счетчике во время стрима.', cat: Category.STREAMS, target: 'CHANNEL' },
        { id: 'EXT_TW_SUB_REAL', name: 'Twitch Фолловеры [Живые]', price: 550, desc: 'Реальные профили с историей, повышают траст канала.', cat: Category.SUBSCRIBERS, target: 'CHANNEL' },
    ];
    twData.forEach(s => services.push({ ...s, platform: Platform.TWITCH }));

    // 3. Batch Create
    console.log(`📦 Creating ${services.length} services with refined metadata...`);
    for (const s of services) {
        await prisma.internalService.create({
            data: {
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
                targetType: s.target
            }
        });
    }

    console.log('✅ Refined catalog populated.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
