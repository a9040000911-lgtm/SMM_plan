/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { Platform, Category } from '@/generated/client';
import { PricingService } from '@/services/finance/pricing.service';
import { ServiceSyncService } from '@/services/providers/sync.service';

export class ServiceEngine {
    /**
     * Импортирует услугу из провайдера, создавая InternalService и Mapping
     */
    static async importFromProvider(providerServiceId: string, providerId: string) {
        console.log(`[ServiceEngine] Importing service ${providerServiceId} from provider ${providerId}...`);

        // 1. Получаем данные услуги от провайдера
        const providerService = await prisma.providerService.findUnique({
            where: { id: providerServiceId },
            include: { provider: true }
        });

        if (!providerService) throw new Error('Provider service not found');

        // 2. Рассчитываем рекомендуемую розничную цену
        const recommendedPrice = await PricingService.calculateRetailPrice(providerService.rawPrice, {
            providerName: providerService.provider.name,
            category: providerService.category
        });

        // 3. Создаем InternalService (Мастер-каталог)
        const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');
        const internalId = `${providerService.platform}_${providerService.category}_${Date.now()}`;

        const internalService = await prisma.$transaction(async (tx) => {
            const categoryObj = await SmartAnalyzerService.resolveCategory(tx, providerService.platform, providerService.category, 'ALL', null);

            return tx.internalService.create({
                data: {
                    id: internalId,
                    name: providerService.name,
                    description: providerService.name,
                    geo: 'Global',
                    platform: providerService.platform,
                    category: providerService.category,
                    serviceCategory: { connect: { id: categoryObj.id } },
                    pricePer1000: recommendedPrice,
                    lastProviderPrice: providerService.rawPrice,
                    isActive: true,
                    minQty: 10,
                    maxQty: 100000,
                    targetType: 'UNKNOWN', // Требует уточнения после импорта
                    priceUnit: 1000
                }
            });
        });

        // 4. Создаем маппинг (Mapping)
        await prisma.internalServiceMapping.create({
            data: {
                internalServiceId: internalService.id,
                providerServiceId: providerService.id,
                providerId: providerId,
                priority: 1,
                isActive: true
            }
        });

        console.log(`[ServiceEngine] Successfully imported as ${internalService.id}`);
        return internalService;
    }

    /**
     * Глобальная синхронизация: Провайдеры -> Цены -> Состояние услуг
     * Включает Smart Rotation и Margin Guard
     */
    static async syncEverything() {
        console.log('[ServiceEngine] Global sync started (with SmartSync)...');

        // 1. Синхронизируем все API провайдеров
        await ServiceSyncService.syncAllServices();

        // 2. Получаем все активные маппинги
        const mappings = await prisma.internalServiceMapping.findMany({
            where: { isActive: true },
            include: {
                providerService: true,
                internalService: true,
                provider: true
            }
        });

        const uniqueServiceIds: string[] = Array.from(new Set(mappings.map((m: any) => m.internalServiceId)));
        let updatedCount = 0;

        for (const serviceId of uniqueServiceIds) {
            const serviceMappings = mappings.filter((m: any) => m.internalServiceId === serviceId);
            const internalService = (serviceMappings[0] as any).internalService;

            // --- MARGIN GUARD ---
            let shouldDisable = false;
            for (const mapping of serviceMappings as any[]) {
                const currentCost = mapping.providerService.rawPrice;
                const oldCost = internalService.lastProviderPrice || new Decimal(0);

                if (!currentCost.equals(oldCost) && oldCost.gt(0)) {
                    const priceDiffPercent = currentCost.sub(oldCost).div(oldCost).mul(100).toNumber();
                    if (priceDiffPercent > 50) { // Цена выросла более чем на 50%
                        shouldDisable = true;
                        break;
                    }
                }
            }

            if (shouldDisable) {
                await prisma.internalService.update({ where: { id: serviceId }, data: { isActive: false } });
                console.warn(`[ServiceEngine] Service ${serviceId} disabled by Margin Guard.`);
                continue;
            }

            // --- AUTO RE-MARKUP & SMART ROTATION ---
            const syncResult: any = await PricingService.syncInternalServicePrice(serviceId);

            if ('priceUpdated' in syncResult && syncResult.priceUpdated) {
                updatedCount++;
            }

            // --- LOSS PREVENTION ---
            if (syncResult.minCost && internalService.pricePer1000.lt(syncResult.minCost)) {
                await prisma.internalService.update({ where: { id: serviceId }, data: { isActive: false } });
                continue;
            }

            // --- SMART ROTATION ---
            if (syncResult.Cheaper) {
                const currentPrimaryMapping = serviceMappings.find((m: any) => m.priority === 1);
                const cheapestMapping = await prisma.internalServiceMapping.findFirst({
                    where: { internalServiceId: serviceId, provider: { name: syncResult.cheapestProvider } }
                });

                if (cheapestMapping && currentPrimaryMapping && cheapestMapping.id !== currentPrimaryMapping.id) {
                    await prisma.internalServiceMapping.update({ where: { id: currentPrimaryMapping.id }, data: { priority: 2 } });
                    await prisma.internalServiceMapping.update({ where: { id: cheapestMapping.id }, data: { priority: 1 } });
                }
            }
        }

        console.log(`[ServiceEngine] Sync finished.Updated ${updatedCount} prices.`);
        return { updatedCount };
    }

    /**
     * Включает/выключает услугу для конкретного проекта
     */
    static async toggleServiceForProject(serviceId: string, projectId: string, isActive: boolean) {
        return await prisma.projectServiceOverride.upsert({
            where: {
                projectId_internalServiceId: {
                    projectId,
                    internalServiceId: serviceId
                }
            },
            update: { isActive },
            create: {
                projectId,
                internalServiceId: serviceId,
                isActive
            }
        });
    }

    /**
     * Пакетный импорт новых услуг по фильтрам (например, все из категории Telegram)
     */
    static async bulkImportFromProvider(providerId: string, filters: { platform?: string, category?: string }) {
        const sourceServices = await prisma.providerService.findMany({
            where: {
                providerId,
                platform: filters.platform ? (filters.platform as Platform) : undefined,
                category: filters.category ? (filters.category as Category) : undefined,
                // Избегаем дублей: только те, у которых еще нет маппинга
                mappings: { none: {} }
            }
        });

        console.log(`[ServiceEngine] Found ${sourceServices.length} candidates for bulk import.`);
        const results = [];
        for (const s of sourceServices) {
            try {
                const internal = await this.importFromProvider(s.id, providerId);
                results.push(internal);
            } catch (e) {
                console.error(`[ServiceEngine] Failed to import ${s.id}: `, e);
            }
        }
        return results;
    }
}
