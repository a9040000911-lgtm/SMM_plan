#!/bin/bash
CONTAINER_NAME="smmplan-app"
echo "🎯 Запуск полной настройки каталога Smmplan..."
echo "📦 Шаг 0: Установка необходимых библиотек..."
docker exec -u root $CONTAINER_NAME npm install decimal.js bcryptjs
docker exec -u root $CONTAINER_NAME bash -c "cat <<EOT > scripts/seed-full-prod.ts
import { PrismaClient, Platform, Category } from '@prisma/client';
import { Decimal } from 'decimal.js';
const prisma = new PrismaClient();
async function main() {
    console.log('🚀 Начинаем импорт...');
    const project = await prisma.project.upsert({
        where: { slug: 'main' },
        update: {},
        create: { id: 'main', name: 'Smmplan Main', slug: 'main', domain: 'smmplan.ru', config: {} }
    });
    const services = [
        { id: 'EXT_TG_SUB_ECO', plat: 'TELEGRAM', cat: 'SUBSCRIBERS', name: 'Подписчики [Эконом]', price: 45, target: 'CHANNEL', desc: 'Бюджетные боты.' },
        { id: 'EXT_TG_SUB_REAL', plat: 'TELEGRAM', cat: 'SUBSCRIBERS', name: 'Подписчики [Живые RU]', price: 350, target: 'CHANNEL', desc: 'Реальные пользователи.' },
        { id: 'EXT_TG_VIEW_FAST', plat: 'TELEGRAM', cat: 'VIEWS', name: 'Просмотры [Мгновенно]', price: 2, target: 'POST', desc: 'Быстрый запуск.' },
        { id: 'EXT_VK_LIKE_REAL', plat: 'VK', cat: 'LIKES', name: 'ВК Лайки [Живые RU]', price: 85, target: 'POST', desc: 'Лайки от реальных пользователей.' }
    ];
    for (const s of services) {
        const internal = await prisma.internalService.upsert({
            where: { id: s.id },
            update: { name: s.name, pricePer1000: new Decimal(s.price), isActive: true },
            create: { id: s.id, platform: s.plat as any, category: s.cat as any, name: s.name, description: s.desc, geo: 'RU', pricePer1000: new Decimal(s.price), minQty: 10, maxQty: 1000000, isActive: true, priceUnit: 1000, targetType: s.target as any }
        });
        await prisma.projectServiceOverride.upsert({
            where: { projectId_internalServiceId: { projectId: project.id, internalServiceId: internal.id } },
            update: { isActive: true },
            create: { projectId: project.id, internalServiceId: internal.id, isActive: true }
        });
    }
    console.log('✅ Готово!');
}
main().finally(() => prisma.\$disconnect());
EOT"
echo "📦 Наполнение базы данными..."
docker exec -u root $CONTAINER_NAME npx tsx scripts/seed-full-prod.ts
echo "🔧 Настройка админа и связей..."
docker exec -u root $CONTAINER_NAME npx tsx scripts/fix-catalog-and-admin.ts
echo "✨ Успешно! Логин: admin@smmplan.ru | Пароль: adminpassword123"
