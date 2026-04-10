import { PrismaClient } from '../src/generated/client';

const prisma = new PrismaClient();

function generateDescription(name: string, category: string, price: number): string {
    const isPremium = name.includes('Премиум');
    const isStandart = name.includes('Стандарт');
    const hasRu = name.match(/росси/i);

    const seed = name.length + price; 
    
    if (isPremium) {
        const templates = [
            `Премиум качество. Живые пользователи${hasRu ? ' из РФ' : ''}. Высокое удержание без списаний.`,
            `Максимальная безопасность. Активная ${hasRu ? 'СНГ ' : ''}аудитория. Гарантия результата.`,
            `Топ-качество для алгоритмов. Проверенные профили, органичный рост показателей.`
        ];
        return templates[seed % templates.length];
    } else if (isStandart) {
        const templates = [
            `Быстрый запуск. Смешанная аудитория${hasRu ? ' (преимущественно РФ)' : ''}. Допустимы колебания.`,
            `Оптимальная цена/качество. Стабильные профили. Подходит для регулярного использования.`,
            `Надежное выполнение. Базовые аккаунты без строгой гео-привязки. Отличная скорость.`
        ];
        return templates[seed % templates.length];
    } else {
        const templates = [
            `Бюджетный старт. Офферы и боты. Возможны естественные отписки (без гарантии).`,
            `Эконом-вариант для визуальной массы. Базовое качество профилей (весь мир).`,
            `Мгновенный результат за минимальный бюджет. Без защиты от списаний.`
        ];
        return templates[seed % templates.length];
    }
}

async function run() {
    const services = await prisma.internalService.findMany();

    let updated = 0;
    for (const svc of services) {
        const newDesc = generateDescription(svc.name, svc.category, Number(svc.pricePer1000));
        await prisma.internalService.update({
            where: { id: svc.id },
            data: { description: newDesc }
        });
        updated++;
    }

    console.log(`✅ Высушено от воды! Обновлено ${updated} описаний.`);
    process.exit(0);
}

run().catch(console.error);
