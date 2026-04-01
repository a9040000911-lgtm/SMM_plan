import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('Чтение premium_catalog.json...');
    
    if (!fs.existsSync('premium_catalog.json')) {
        throw new Error('Файл premium_catalog.json не найден. Загрузите его в корень проекта.');
    }

    const rawData = fs.readFileSync('premium_catalog.json', 'utf8');
    let items: any[] = [];
    try {
        items = JSON.parse(rawData);
    } catch (e) {
        throw new Error('Ошибка парсинга JSON: ' + (e as Error).message);
    }

    if (!Array.isArray(items)) {
        throw new Error('Файл должен содержать массив объектов');
    }

    console.log(`✅ Найдено ${items.length} услуг для обновления.`);
    let successCount = 0;
    let failCount = 0;

    for (const item of items) {
        if (!item.id) {
            console.warn('Пропущен элемент без ID:', item);
            failCount++;
            continue;
        }

        try {
            await prisma.providerService.update({
                where: { id: item.id },
                data: {
                    name: item.name,
                    description: item.description
                }
            });
            successCount++;
            if (successCount % 50 === 0) {
                console.log(`[Прогресс]: Обновлено ${successCount} из ${items.length}...`);
            }
        } catch (e) {
            console.error(`Ошибка при обновлении услуги ${item.id}:`, (e as Error).message);
            failCount++;
        }
    }

    console.log(`\n🎉 Готово! Успешно обновлено: ${successCount}, Ошибок: ${failCount}`);
}

main()
    .catch(e => {
        console.error('Критическая ошибка:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
