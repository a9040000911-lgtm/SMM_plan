import { PrismaClient } from "@prisma/client";
import * as fs from "fs";

const prisma = new PrismaClient();
const CSV_FILE = 'vexboost_interchangeable_map.csv';

// Умные шаблоны для авто-генерации премиум-описаний на лету!
const getPremiumContent = (fullName: string): { name: string, description: string } => {
    // fullName e.g. "[Вконтакте] Вконтакте - Просмотры на пост (Эконом)"
    const match = fullName.match(/\[(.*?)\] (.*?) - (.*?) \((.*?)\)/);
    let platform = "Соцсеть";
    let action = "Продвижение";
    let tier = "Стандарт";
    let name = fullName;

    if (match) {
        platform = match[1];
        action = match[3];
        tier = match[4];
        name = `${action} (${tier})`;
    } else {
        const parts = fullName.split(' - ');
        if (parts.length > 1) {
            name = parts[1].replace(/\[.*?\]/g, '').trim(); 
        }
    }

    const actionLower = name.toLowerCase();
    
    let baseDesc = "Комплексное продвижение для повышения видимости и авторитета профиля.";
    if (actionLower.includes("просмотр")) {
        baseDesc = "Гарантированное увеличение охвата публикации. Способствует поднятию записей в рекомендациях и росту показателя вовлеченности (ER).";
    } else if (actionLower.includes("подписчик") || actionLower.includes("участник") || actionLower.includes("фолловер")) {
        baseDesc = "Безопасное расширение аудитории. Формирует солидный имидж страницы, повышая доверие новых посетителей.";
    } else if (actionLower.includes("лайк") || actionLower.includes("реакц") || actionLower.includes("класс")) {
        baseDesc = "Стимулирование положительного отклика. Лайки являются ключевым сигналом ранжирования для алгоритмов социальных сетей.";
    } else if (actionLower.includes("репост") || actionLower.includes("поделит")) {
        baseDesc = "Органическое распространение контента. Способствует вирусному охвату и привлечению новой аудитории.";
    } else if (actionLower.includes("комментар") || actionLower.includes("отзыв")) {
        baseDesc = "Создание видимости активного обсуждения. Подогревает интерес реальной аудитории к дискуссии.";
    } else if (actionLower.includes("сохранени")) {
        baseDesc = "Увеличение количества сохранений. Идеально для TikTok и Instagram как мощнейший сигнал для алгоритмов умной ленты.";
    }

    const description = `${baseDesc}\n\n• **Класс качества:** ${tier || 'Стандарт'}\n• **Платформа:** ${platform}\n• **Особенность:** Полностью автоматизированный старт.`;

    return { name, description };
};

async function seedCatalog() {
    console.log("🚀 Запуск сидера финального каталога (Локальная генерация)...");
    
    // Получаем провайдера (он у нас пока один в БД)
    const vexboost = await prisma.provider.findFirst();
    if (!vexboost) throw new Error("No provider found in DB");
    console.log("Found provider:", vexboost.name, "ID:", vexboost.id);

    const lines = fs.readFileSync(CSV_FILE, 'utf8').split('\n').filter(l => l.trim().length > 0);
    const headers = lines.shift();

    let inserted = 0;
    
    // Используем транзакцию для безопасности
    await prisma.$transaction(async (tx) => {
        // Опционально: Очистим текущие тестовые услуги (раскомментируйте если нужно)
        // await tx.internalServiceMapping.deleteMany();
        // await tx.internalService.deleteMany();

        for (const line of lines) {
            const cols = line.split(';');
            const targetTier = cols[0].replace(/^"|"$/g, '');
            const matchType = cols[1].replace(/^"|"$/g, '');
            const vexboostId = cols[2].replace(/^"|"$/g, '');
            const vexboostPrice = parseFloat(cols[4].replace(/^"|"$/g, '')) || 10;

            const { name, description } = getPremiumContent(targetTier);

            // Создаем Внутреннюю Услугу (InternalService)
            let servicePrice = vexboostPrice * 1.5; // Наценка 50% по умолчанию
            if (servicePrice < 10) servicePrice = 10;

            const newService = await tx.internalService.create({
                data: {
                    id: require('crypto').randomUUID(),
                    name: name,
                    description: description,
                    geo: "WORLD",
                    pricePer1000: servicePrice,
                    minQty: 100,
                    maxQty: 10000,
                    type: "REGULAR",
                    isActive: matchType === "DIRECT_100%", // Активируем только точные совпадения автоматически! Остальные - на ручную модерацию
                    requirements: "Открытый публичный доступ.",
                    // Уведомление для админа в заметку
                    curatorNote: matchType !== "DIRECT_100%" ? `Требует проверки маппинга. Предложенный системой Vexboost ID: ${vexboostId}` : undefined,
                    updatedAt: new Date()
                }
            });

            // Находим реальный ProviderService по внешнему ID
            const provService = await tx.providerService.findFirst({
                where: { providerId: vexboost.id, externalId: vexboostId }
            });

            if (provService) {
                // Создаем привязку провайдера
                await tx.internalServiceMapping.create({
                    data: {
                        id: require('crypto').randomUUID(),
                        internalServiceId: newService.id,
                        providerServiceId: provService.id,
                        providerId: vexboost.id,
                        priority: 1,
                        reliability: matchType === "DIRECT_100%" ? 100 : 70, // Снижаем рейтинг надежности для неточных матчей
                        isActive: true
                    }
                });
            }

            inserted++;
            if (inserted % 50 === 0) console.log(`👉 Интегрировано ${inserted} услуг...`);
        }
    });

    console.log(`\n🎉 УСПЕШНО ИНТЕГРИРОВАНО ${inserted} ПРЕМИУМ-УСЛУГ В БАЗУ ДАННЫХ SMMPlan!`);
    console.log(`\n💡 Идеальные совпадения активированы. Остальные скрыты от клиентов и ожидают вашего финального подтверждения маппинга Vexboost ID в Админ-Панели.`);
}

seedCatalog().catch(e => console.error(e)).finally(() => prisma.$disconnect());
