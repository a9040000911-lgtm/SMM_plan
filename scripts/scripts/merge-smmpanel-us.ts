import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    // 1. Находим существующий старый провайдер
    const oldProvider = await prisma.provider.findFirst({
        where: { name: 'smmpanelus.com' }
    });

    const metadata = {
        requestType: 'json',
        method: 'POST',
        currency: 'USD'
    };

    if (oldProvider) {
        console.log(`🔄 Обновляем существующий провайдер "${oldProvider.name}"...`);
        await prisma.provider.update({
            where: { id: oldProvider.id },
            data: {
                name: 'Smmpanel Us',
                metadata: metadata,
                balanceThreshold: new Decimal(10)
            }
        });

        // 2. Удаляем временный дубликат, если он был создан (проверяем по ID из моего лога ранее или по имени)
        const duplicate = await prisma.provider.findFirst({
            where: {
                name: 'Smmpanel Us',
                id: { not: oldProvider.id }
            }
        });

        if (duplicate) {
            console.log(`🗑 Удаляем дубликат с ID: ${duplicate.id}`);
            await prisma.provider.delete({ where: { id: duplicate.id } });
        }
    }

    console.log('✅ Данные синхронизированы. Теперь используется один провайдер с правильными настройками JSON/USD.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
