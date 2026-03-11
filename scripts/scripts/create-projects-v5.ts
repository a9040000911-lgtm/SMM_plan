import { prisma } from '../src/lib/prisma';

async function upsertSetting(projectId: string, key: string, value: any) {
    const valStr = JSON.stringify(value);
    const existing = await prisma.settings.findUnique({
        where: { projectId_key: { projectId, key } }
    });
    if (existing) {
        await prisma.settings.update({ where: { id: existing.id }, data: { value: valStr } });
    } else {
        await prisma.settings.create({ data: { projectId, key, value: valStr } });
    }
}

async function main() {
    console.log('--- ИНИЦИАЛИЗАЦИЯ ПРОЕКТОВ v5.0 ---');

    // 1. SMMGO (Масс-маркет)
    // Цель: 1000% (x11)
    const smmgo = await prisma.project.upsert({
        where: { slug: 'smmgo' },
        update: { name: 'SMMGO' },
        create: {
            name: 'SMMGO',
            slug: 'smmgo',
            domain: 'smmgo.ru',
            brandColor: '#10b981', // Emerald
        }
    });

    // Сохраняем лестницу x11
    await upsertSetting(smmgo.id, 'PRICING_LADDER', [
        { threshold: 1, multiplier: 50, fixedMarkup: 0 },
        { threshold: Infinity, multiplier: 11, fixedMarkup: 0 }
    ]);
    console.log(`✅ Проект SMMGO (Slug: ${smmgo.slug}) настроен.`);

    // 2. SMMVIP (Премиум)
    // Цель: 2000% (x21) + Twitch (x111)
    const smmvip = await prisma.project.upsert({
        where: { slug: 'smmvip' },
        update: {
            name: 'SMMVIP',
            brandColor: '#8b5cf6', // Violet
        },
        create: {
            name: 'SMMVIP',
            slug: 'smmvip',
            domain: 'smmvip.ru',
            brandColor: '#8b5cf6',
        }
    });

    // Сохраняем лестницу x21
    await upsertSetting(smmvip.id, 'PRICING_LADDER', [
        { threshold: 1, multiplier: 100, fixedMarkup: 0 },
        { threshold: Infinity, multiplier: 21, fixedMarkup: 0 }
    ]);

    // Настройка CATEGORY_MULTIPLIERS для Twitch (x111)
    // Сохраняем в SettingsService через прямую вставку в конфиг или через SettingsService.set
    // Но PricingService ищет их в SettingsService по ключу и ProjectID.
    // Т.к. SettingsService работает с таблицей Config/Settings, нам нужно добавить запись туда.
    await upsertSetting(smmvip.id, 'CATEGORY_MULTIPLIERS', { 'TWITCH': 111 });

    console.log(`✅ Проект SMMVIP (Slug: ${smmvip.slug}) настроен.`);
    console.log(`🚀 Настройка для Twitch (x111) в SMMVIP применена.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
