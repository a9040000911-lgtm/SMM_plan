import { PrismaClient } from '@prisma/client';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

async function main() {
    const providerData = {
        name: 'Smmpanel Us',
        apiUrl: 'https://smmpanelus.com/api/v2',
        apiKey: 'PASTE_YOUR_KEY_HERE', // Пользователь может изменить это в админ-панели
        type: 'universal',
        isEnabled: true,
        balanceThreshold: new Decimal(10),
        metadata: {
            requestType: 'json',
            method: 'POST',
            currency: 'USD'
        }
    };

    const provider = await prisma.provider.upsert({
        where: { id: 'smmpanel-us' },
        update: providerData,
        create: { ...providerData, id: 'smmpanel-us' },
    });

    console.log(`✅ Провайдер "${provider.name}" успешно добавлен/обновлен.`);
    console.log(`🔗 ID провайдера: ${provider.id}`);
    console.log('⚠️ Не забудьте обновить API ключ в административной панели.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
