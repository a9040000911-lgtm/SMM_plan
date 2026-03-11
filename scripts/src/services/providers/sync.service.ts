/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { Provider } from '@/generated/client';
import crypto from 'crypto';

import { ProviderService as ProviderServiceClass } from './provider.service';
import { SmartAnalyzerService } from './smart-analyzer.service';
import { DescriptionSanitizer } from '@/utils/description-sanitizer';
import { PricingService } from '@/services/finance/pricing.service';
import { LinkAnalyzerService } from '@/services/core/link-analyzer.service';

/**
 * Сервис для синхронизации услуг провайдеров с нашей базой данных.
 */
export class ServiceSyncService {
    /**
     * Синхронизирует услуги всех включенных провайдеров.
     */
    static async syncAllServices() {
        const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
        console.log(`[ServiceSync] Starting sync for ${providers.length} providers.`);

        const { CurrencyService } = await import('@/services/finance/currency.service');
        const rates = await CurrencyService.getRates();

        for (const provider of providers) {
            try {
                await this.syncProvider(provider.id, rates);
            } catch (err) {
                console.error(`[ServiceSync] Global sync failed for ${provider.name}, skipping:`, err instanceof Error ? err.message : err);
            }
        }

        // Автоматическая проверка на услуги с ценой 0 после синхронизации
        try {
            const { SelfHealingService } = await import('@/services/core/self-healing.service');
            await SelfHealingService.reconcileZeroPriceServices();
        } catch (err) {
            console.error('[ServiceSync] Failed to run post-sync price check:', err);
        }
    }

    /**
     * Синхронизирует услуги конкретного провайдера.
     */
    static async syncProvider(providerId: string, providedRates?: any) {
        // 0. Sync Lock Check
        const provider = await prisma.provider.findUnique({ where: { id: providerId } });
        if (!provider) throw new Error(`Provider ${providerId} not found`);
        if (!provider.isEnabled) throw new Error(`Provider ${provider.name} is disabled`);
        if (provider.syncLock) {
            console.log(`[ServiceSync] ${provider.name} is already syncing (Locked). Skipping.`);
            return;
        }

        // Lock
        await prisma.provider.update({ where: { id: providerId }, data: { syncLock: true } });

        try {
            const rates = providedRates || await import('@/services/finance/currency.service').then(m => m.CurrencyService.getRates());
            await this.processProviderSync(provider, rates);

            // Update balance log
            try {
                const instance = await ProviderServiceClass.getInstance(provider.id);
                if (instance) {
                    const { balance } = await instance.getBalance();
                    await prisma.providerBalanceLog.create({
                        data: {
                            providerId: provider.id,
                            balance: new Decimal(balance),
                            currency: provider.balanceCurrency
                        },
                    });
                }
            } catch (e) {
                console.error(`[ServiceSync] Failed to update balance for ${provider.name}:`, e);
            }
        } finally {
            // Unlock
            await prisma.provider.update({ where: { id: providerId }, data: { syncLock: false } });
        }
    }

    private static generateHash(data: object) {
        return crypto
            .createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    private static buildHashInput(s: any) {
        return {
            name: s.name,
            min: s.min,
            max: s.max,
            rate: s.rate,
            type: s.type,
            category: s.category
        };
    }

    private static async processProviderSync(provider: Provider, rates: any) {
        const instance = await ProviderServiceClass.getInstance(provider.id);
        if (!instance) return;

        try {
            // Phase 1: Fetch
            const rawServices = await instance.getServices();
            console.log(`[ServiceSync] ${provider.name}: Received ${rawServices.length} direct services from API.`);

            const currency = provider.pricesCurrency;
            const rate = rates[currency] || 1;

            // Phase 2: Prepare & Analyze (Incoming Map)
            const incomingMap = new Set<string>();
            const analyzedServices = await Promise.all(rawServices.map(async (s: any) => {
                const cleanName = DescriptionSanitizer.sanitize(s.name);
                const cleanDesc = DescriptionSanitizer.sanitize(s.description || '');

                const analysis = await SmartAnalyzerService.analyzeService(cleanName, cleanDesc, s.category || '');
                const botRequirements = LinkAnalyzerService.extractBotRequirementsFromDescription(cleanDesc);

                const convertedPrice = new Decimal(s.rate).mul(rate);
                const hash = this.generateHash(this.buildHashInput({ ...s, name: cleanName }));

                incomingMap.add(s.service.toString());

                return {
                    ...s,
                    externalId: s.service.toString(),
                    name: cleanName,
                    description: cleanDesc,
                    convertedPrice,
                    analysis,
                    botRequirements,
                    hash,
                    originalPrice: new Decimal(s.rate),
                    originalCurrency: currency
                };
            }));

            // Phase 3: Compare (Existing services)
            const existing = await prisma.providerService.findMany({
                where: { providerId: provider.id }
            });

            const existingMap = new Map(existing.map(s => [s.externalId, s]));

            const toCreate: any[] = [];
            const toUpdate: any[] = [];
            const seenExternalIds = new Set<string>();

            // Pre-fetch platform slug → id mapping
            const allPlatforms = await prisma.socialPlatform.findMany({ select: { id: true, slug: true } });
            const platformSlugToId: Record<string, string> = {};
            allPlatforms.forEach(p => platformSlugToId[p.slug.toLowerCase()] = p.id);

            for (const incoming of analyzedServices) {
                const existingService = existingMap.get(incoming.externalId);
                const slug = incoming.analysis?.platformSlug || 'other';
                const socialPlatformId = platformSlugToId[slug.toLowerCase()] || null;

                const dbData = {
                    externalId: incoming.externalId,
                    name: incoming.name,
                    rawPrice: incoming.convertedPrice,
                    rawPriceOriginal: incoming.originalPrice,
                    rawCurrencyOriginal: incoming.originalCurrency,
                    platform: incoming.analysis?.platform || 'OTHER',
                    socialPlatformId,
                    category: incoming.analysis?.category || 'OTHER',
                    description: incoming.description,
                    rawData: { ...incoming, botRequirements: incoming.botRequirements } as any,
                    dataHash: incoming.hash,
                    isActive: true,
                    lastSeenAt: new Date(),
                };

                if (!existingService) {
                    toCreate.push({ ...dbData, providerId: provider.id });
                } else if (existingService.dataHash !== incoming.hash || !existingService.isActive) {
                    toUpdate.push({ id: existingService.id, ...dbData });
                } else {
                    // Update only lastSeenAt to keep it "alive"
                    seenExternalIds.add(existingService.id);
                }
            }

            const toDeactivate = existing.filter(s => !incomingMap.has(s.externalId) && s.isActive);

            // Phase 4: Batch Persist
            if (toCreate.length > 0) {
                console.log(`[ServiceSync] ${provider.name}: Creating ${toCreate.length} new services.`);
                await prisma.providerService.createMany({ data: toCreate });
            }

            if (toUpdate.length > 0) {
                console.log(`[ServiceSync] ${provider.name}: Updating ${toUpdate.length} changed services.`);
                // Prisma doesn't support bulk update with different values, but we can use transaction
                const CHUNK_SIZE = 50;
                for (let i = 0; i < toUpdate.length; i += CHUNK_SIZE) {
                    const chunk = toUpdate.slice(i, i + CHUNK_SIZE);
                    await prisma.$transaction(
                        chunk.map(s => prisma.providerService.update({
                            where: { id: s.id },
                            data: s
                        }))
                    );
                }
            }

            if (seenExternalIds.size > 0) {
                const idList = Array.from(seenExternalIds);
                const CHUNK_SIZE = 500;
                for (let i = 0; i < idList.length; i += CHUNK_SIZE) {
                    const chunk = idList.slice(i, i + CHUNK_SIZE);
                    await prisma.providerService.updateMany({
                        where: { id: { in: chunk } },
                        data: { lastSeenAt: new Date() }
                    });
                }
            }

            if (toDeactivate.length > 0) {
                console.log(`[ServiceSync] ${provider.name}: Deactivating ${toDeactivate.length} removed services.`);
                await prisma.providerService.updateMany({
                    where: { id: { in: toDeactivate.map(s => s.id) } },
                    data: { isActive: false }
                });
            }

            console.log(`[ServiceSync] ${provider.name}: Diff-Sync completed. New: ${toCreate.length}, Updated: ${toUpdate.length}, Total: ${rawServices.length}`);

            // PROPAGATION
            await this.propagatePrices(provider);

        } catch (error: any) {
            console.error(`[ServiceSync] ${provider.name} failed:`, error.message);
            throw error;
        }
    }

    private static async propagatePrices(provider: Provider) {
        try {
            const mappings = await prisma.internalServiceMapping.findMany({
                where: {
                    providerId: provider.id,
                    isActive: true,
                    priority: 1,
                    projectId: provider.projectId // Critical for isolation
                },
                include: { providerService: true, provider: true }
            });

            for (const mapping of mappings) {
                try {
                    if (mapping.providerService) {
                        const cost = new Decimal(mapping.providerService.rawPrice);

                        // 1. Update Global Service
                        const internalSvc = await prisma.internalService.findUnique({
                            where: { id: mapping.internalServiceId },
                            select: { markup: true, pricePer1000: true, isActive: true, category: true }
                        });

                        if (internalSvc) {
                            const currentPrice = new Decimal(internalSvc.pricePer1000);

                            // Safety Check: If cost is 0, it's likely a provider error or archived service
                            const isZeroCost = cost.isZero();
                            const newPrice = isZeroCost
                                ? currentPrice
                                : await PricingService.calculateRetailPrice(cost, {
                                    category: internalSvc.category,
                                    providerName: mapping.provider.name
                                });

                            const safetyPrice = PricingService.getSafetyPrice(cost);
                            const needsDisable = isZeroCost || currentPrice.lt(safetyPrice);

                            const botReqs = (mapping.providerService.rawData as any)?.botRequirements;
                            const requirementText = botReqs?.requiresBot ? botReqs.botInstruction : null;

                            await prisma.internalService.update({
                                where: { id: mapping.internalServiceId },
                                data: {
                                    ...(isZeroCost ? {} : {
                                        lastProviderPrice: cost,
                                        providerPriceOriginal: mapping.providerService.rawPriceOriginal,
                                        providerCurrencyOriginal: mapping.providerService.rawCurrencyOriginal,
                                    }),
                                    pricePer1000: newPrice,
                                    requirements: requirementText,
                                    isActive: needsDisable ? false : internalSvc.isActive
                                }
                            });

                            if (needsDisable) {
                                const reason = isZeroCost ? 'Zero cost from provider' : 'Margin below 1.5x';
                                console.log(`[ServiceSync] DISABLED Global Service ${mapping.internalServiceId} - ${reason}`);

                                await prisma.adminLog.create({
                                    data: {
                                        adminId: 'system-sync',
                                        action: 'AUTO_MUTE',
                                        targetId: mapping.internalServiceId,
                                        details: `Service auto-muted during sync: ${reason} (Profit Guard v2)`
                                    }
                                });
                            }
                        }

                        // 2. Update Project Override
                        if (mapping.projectId) {
                            const override = await prisma.projectServiceOverride.findUnique({
                                where: {
                                    projectId_internalServiceId: {
                                        projectId: mapping.projectId,
                                        internalServiceId: mapping.internalServiceId
                                    }
                                },
                                include: { project: { select: { markup: true } } }
                            });

                            if (override) {
                                const currentProjPrice = override.customPrice ? new Decimal(override.customPrice) : (internalSvc ? new Decimal(internalSvc.pricePer1000) : null);

                                const isZeroCost = cost.isZero();
                                const newProjPrice = isZeroCost
                                    ? currentProjPrice
                                    : await PricingService.calculateRetailPrice(cost, {
                                        category: internalSvc?.category || 'OTHER',
                                        providerName: mapping.provider.name,
                                        projectId: mapping.projectId || undefined
                                    });

                                const safetyPrice = PricingService.getSafetyPrice(cost);
                                const projNeedsDisable = isZeroCost || (currentProjPrice ? currentProjPrice.lt(safetyPrice) : false);

                                await prisma.projectServiceOverride.update({
                                    where: {
                                        projectId_internalServiceId: {
                                            projectId: mapping.projectId,
                                            internalServiceId: mapping.internalServiceId
                                        }
                                    },
                                    data: {
                                        customPrice: newProjPrice,
                                        isActive: projNeedsDisable ? false : override.isActive
                                    }
                                });

                                if (projNeedsDisable) {
                                    const reason = isZeroCost ? 'Zero cost from provider' : 'Margin below 1.5x';
                                    console.log(`[ServiceSync] DISABLED Project Override ${mapping.projectId}/${mapping.internalServiceId} - ${reason}`);
                                }
                            } else {
                                // Create default override if it doesn't exist
                                const markupVal = internalSvc?.markup ? Number(internalSvc.markup) : 0;
                                const multiplier = Math.max(1 + markupVal / 100, 1.5);
                                await prisma.projectServiceOverride.create({
                                    data: {
                                        projectId: mapping.projectId,
                                        internalServiceId: mapping.internalServiceId,
                                        isActive: false, // Start disabled
                                        customPrice: cost.mul(multiplier)
                                    }
                                });
                            }
                        }
                    }
                } catch (svcErr) {
                    console.error(`[ServiceSync] Failed to propagate price for ${mapping.internalServiceId}:`, svcErr);
                    // Continue to next service
                }
            }
            console.log(`[ServiceSync] ${provider.name}: Propagated prices to ${mappings.length} services.`);
        } catch (err) {
            console.error(`[ServiceSync] ${provider.name} propagation failed:`, err);
        }
    }
}
