/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Platform, Category } from '@/generated/client';
import { Decimal } from 'decimal.js';
import { PricingService } from '@/services/finance/pricing.service';

export class ProviderSyncService {
    /**
     * Синхронизирует внутренний каталог услуг с данными провайдеров.
     * Перенесено из скрипта sync-catalog.ts.
     */
    static async syncGlobalCatalog(catalogs: { platform: Platform, items: any[] }[]) {
        console.log('--- ProviderSyncService: Глобальная синхронизация ---');

        const providerCache = new Map<string, string>();
        const allProviders = await prisma.provider.findMany();
        allProviders.forEach(p => providerCache.set(p.name, p.id));

        for (const catalog of catalogs) {
            const platform = catalog.platform;
            for (const item of catalog.items) {
                await this.syncSingleService(item, platform, providerCache);
            }
        }
        console.log('--- Глобальная синхронизация завершена ---');
    }

    private static async syncSingleService(item: any, platform: Platform, providerCache: Map<string, string>) {
        let rawPrice = new Decimal(0);
        const mainProvider = item.providers.find((p: any) => p.priority === 1);

        if (mainProvider) {
            const providerId = providerCache.get(mainProvider.providerName);
            if (providerId) {
                const ps = await prisma.providerService.findFirst({
                    where: { externalId: mainProvider.providerServiceId.toString(), providerId: providerId }
                });
                if (ps) rawPrice = ps.rawPrice;
            }
        }

        // Расчет розничной цены
        let finalPricePer1000: Decimal;
        if (item.fixedPricePer1000) {
            finalPricePer1000 = new Decimal(item.fixedPricePer1000);
            const safetyPrice = PricingService.getSafetyPrice(rawPrice);
            if (finalPricePer1000.lt(safetyPrice)) finalPricePer1000 = safetyPrice;
        } else {
            finalPricePer1000 = await PricingService.calculateRetailPrice(rawPrice, { category: item.category });
        }

        const priceUnit = (item.category === Category.BOOSTS || (item.metadata as any)?.type === 'set') ? 1 : 1000;
        let pricePerOne = finalPricePer1000.div(priceUnit);
        pricePerOne = pricePerOne.lt(0.01) ? new Decimal(0.01) : new Decimal(pricePerOne.toFixed(2, Decimal.ROUND_CEIL));

        const finalDbPricePer1000 = pricePerOne.mul(1000);
        const unitLabel = priceUnit === 1 ? ((item.category === Category.BOOSTS) ? 'день' : 'пакет') : 'шт.';

        const { formatServiceId } = await import('@/utils/id-formatter');
        const internalId = item.id || formatServiceId(platform, item.category, 0);

        const service = await prisma.$transaction(async (tx) => {
            const { SmartAnalyzerService } = await import('./smart-analyzer.service');
            const categoryObj = await SmartAnalyzerService.resolveCategory(tx, platform, item.category, item.targetType || 'ALL', null);

            return tx.internalService.upsert({
                where: { id: internalId },
                update: {
                    slug: item.slug,
                    platform: platform,
                    category: item.category,
                    serviceCategory: { connect: { id: categoryObj.id } },
                    targetType: item.targetType || 'ALL',
                    name: item.name,
                    description: item.description || '',
                    metadata: item.metadata || {},
                    geo: (item.metadata as any)?.geo || 'Mixed',
                    pricePer1000: finalDbPricePer1000,
                    lastProviderPrice: rawPrice,
                    minQty: priceUnit === 1 ? 1 : 100,
                    maxQty: item.maxQty || 100000,
                    isActive: true,
                    unitName: unitLabel,
                    priceUnit: priceUnit,
                },
                create: {
                    id: internalId,
                    slug: item.slug,
                    platform: platform,
                    category: item.category,
                    serviceCategory: { connect: { id: categoryObj.id } },
                    targetType: item.targetType || 'ALL',
                    name: item.name,
                    description: item.description || '',
                    metadata: item.metadata || {},
                    geo: (item.metadata as any)?.geo || 'Mixed',
                    pricePer1000: finalDbPricePer1000,
                    lastProviderPrice: rawPrice,
                    minQty: priceUnit === 1 ? 1 : 100,
                    maxQty: item.maxQty || 100000,
                    isActive: true,
                    unitName: unitLabel,
                    priceUnit: priceUnit,
                }
            });
        });

        await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: service.id } });
        for (const p of item.providers) {
            const providerId = providerCache.get(p.providerName);
            if (providerId) {
                // We need to find the UUID of the ProviderService first
                const ps = await prisma.providerService.findFirst({
                    where: { externalId: p.providerServiceId.toString(), providerId: providerId }
                });

                if (ps) {
                    await prisma.internalServiceMapping.create({
                        data: {
                            internalServiceId: service.id,
                            providerServiceId: ps.id, // Use UUID
                            providerId: providerId,
                            priority: p.priority,
                            isActive: true
                        }
                    });
                }
            }
        }
    }
}


