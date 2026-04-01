import { PrismaClient } from '@prisma/client';
import { ProviderService } from '../src/services/providers/provider.service';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

function computeHash(data: any): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
}

async function syncAllProviders() {
    console.log('--- 🔄 Big Data: Синхронизация каталогов всех провайдеров ---');

    const providers = await prisma.provider.findMany({
        where: { isEnabled: true }
    });

    console.log(`Найдено активных провайдеров: ${providers.length}\n`);

    let totalSaved = 0;

    for (const provider of providers) {
        console.log(`[${provider.name}] Подключение к API...`);
        try {
            const rawServices = await ProviderService.getProviderServices(provider.id);
            console.log(`[${provider.name}] Получено ${rawServices.length} услуг от API. Сохраняю в БД...`);

            let newCount = 0;
            let updCount = 0;

            // Используем последовательные операции для безопасности, либо пакетные транзакции
            // Так как количество 1000-5000 штук, батчи по 200
            const CHUNK_SIZE = 200;
            for (let i = 0; i < rawServices.length; i += CHUNK_SIZE) {
                const chunk = rawServices.slice(i, i + CHUNK_SIZE);
                await prisma.$transaction(
                    chunk.map(s => {
                        const sId = String(s.id || s.service || s.externalId);
                        const sName = String(s.name || s.title || 'Unknown');
                        const price = parseFloat(s.rate || s.price || '0');
                        const hash = computeHash(s);

                        return prisma.providerService.upsert({
                            where: {
                                providerId_externalId: {
                                    providerId: provider.id,
                                    externalId: sId
                                }
                            },
                            update: {
                                name: sName.substring(0, 190), // Prisma limit safeguard
                                rawPrice: price,
                                rawData: s,
                                isIgnored: false,
                                description: s.description || s.desc || null,
                                dataHash: hash,
                                isActive: true,
                                lastSeenAt: new Date(),
                                updatedAt: new Date()
                            },
                            create: {
                                id: crypto.randomUUID(),
                                providerId: provider.id,
                                externalId: sId,
                                name: sName.substring(0, 190),
                                rawPrice: price,
                                rawData: s,
                                dataHash: hash,
                                isIgnored: false,
                                description: s.description || s.desc || null,
                                isActive: true,
                                updatedAt: new Date()
                            }
                        });
                    })
                );
                totalSaved += chunk.length;
                newCount += chunk.length; // Approximate logging
            }
            console.log(`✅ [${provider.name}] Синхронизация завершена.\n`);

        } catch (error: any) {
            console.error(`❌ [${provider.name}] Ошибка:`, error.message);
        }
    }

    console.log(`--- ✨ Big Data база успешно пополнена! Всего услуг в БД теперь очень много ---`);
}

syncAllProviders()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
