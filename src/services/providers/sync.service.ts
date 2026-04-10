/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { Provider } from '@prisma/client';
import crypto from 'crypto';

import { ProviderService as ProviderServiceClass } from './provider.service';
import { SmartAnalyzerService } from './smart-analyzer.service';
import { DescriptionSanitizer } from '@/utils/description-sanitizer';
import { PricingService } from '@/services/finance/pricing.service';
import { IntelligenceEngine } from '@/services/intelligence/intelligence.engine';

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
        // 0. Sync Lock Check & Atomic Lock (Race Condition Guard)
        const provider = await prisma.provider.findUnique({ where: { id: providerId } });
        if (!provider) throw new Error(`Provider ${providerId} not found`);
        if (!provider.isEnabled) throw new Error(`Provider ${provider.name} is disabled`);

        const lockResult = await prisma.provider.updateMany({
            where: { id: providerId, syncLock: false },
            data: { syncLock: true }
        });

        if (lockResult.count === 0) {
            console.log(`[ServiceSync] ${provider.name} is already syncing (Locked). Skipping.`);
            return;
        }

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
                const botRequirements = IntelligenceEngine.extractBotRequirements(cleanDesc);

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
                    cancel: !!incoming.cancel,
                    refill: !!incoming.refill,
                    lastSeenAt: new Date(),
                };

                if (existingService && existingService.name !== incoming.name) {
                    const oldName = existingService.name.toLowerCase();
                    const newName = incoming.name.toLowerCase();
                    
                    const isBotAlert = (newName.includes('bot') || newName.includes('боты')) && !(oldName.includes('bot') || oldName.includes('боты'));
                    const isNoRefillAlert = (newName.includes('no refill') || newName.includes('no-refill') || newName.includes('norefill')) && !(oldName.includes('no refill') || oldName.includes('no-refill') || oldName.includes('norefill'));
                    
                    if (isBotAlert || isNoRefillAlert) {
                        console.warn(`[ServiceSync] SECURITY ALERT: Provider ${provider.name} changed service ${incoming.externalId} drastically: ${existingService.name} -> ${incoming.name}`);
                        dbData.isActive = false; // Force mute
                        
                        // Fire and forget log creation
                        prisma.adminLog.create({
                            data: {
                                adminId: undefined,
                                action: 'NAME_GUARD',
                                targetId: existingService.id,
                                details: `[NAME GUARD] Provider ${provider.name} substituted quality for API ID ${incoming.externalId}: "${existingService.name}" -> "${incoming.name}". Automatically muted.`
                            }
                        }).catch(console.error);
                    }
                }

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
                    projectId: provider.projectId
                },
                include: { providerService: true, provider: true }
            });

            if (mappings.length === 0) return;

            // PRE-FETCH: Load all internal services and overrides at once to avoid queries in the loop
            const internalSvcIds = [...new Set(mappings.map(m => m.internalServiceId))];
            const internalSvcs = await prisma.internalService.findMany({
                where: { id: { in: internalSvcIds } },
                include: { serviceCategory: true }
            });
            const internalSvcMap = new Map(internalSvcs.map(s => [s.id, s]));

            const overrides = await prisma.projectServiceOverride.findMany({
                where: { internalServiceId: { in: internalSvcIds } }
            });
            const overrideMap = new Map(overrides.map(o => [`${o.projectId}_${o.internalServiceId}`, o]));

            const operations: any[] = [];
            const logEntries: any[] = [];

            for (const mapping of mappings) {
                if (!mapping.providerService) continue;
                
                const internalSvc = internalSvcMap.get(mapping.internalServiceId);
                if (!internalSvc) continue;

                const cost = new Decimal(mapping.providerService.rawPrice);
                const currentPrice = new Decimal(internalSvc.pricePer1000);
                const isZeroCost = cost.isZero();
                
                // 1. Calculate and Prepare Global Service Update
                const newPrice = isZeroCost
                    ? currentPrice
                    : await PricingService.calculateRetailPrice(cost, {
                        category: internalSvc.serviceCategory?.categoryType as any || 'OTHER',
                        providerName: mapping.provider.name
                    });

                const safetyPrice = PricingService.getSafetyPrice(cost);
                const isProviderMuted = !mapping.providerService.isActive;
                const needsDisable = isZeroCost || currentPrice.lt(safetyPrice) || isProviderMuted;

                const botReqs = (mapping.providerService.rawData as any)?.botRequirements;
                const requirementText = botReqs?.requiresBot ? botReqs.botInstruction : null;

                const existingMetadata = typeof internalSvc.metadata === 'object' && internalSvc.metadata ? internalSvc.metadata : {};
                let targetIsActive = internalSvc.isActive;
                let metadataUpdate: any = undefined;

                if (needsDisable) {
                    targetIsActive = false;
                    const reason = isProviderMuted ? 'Provider service deleted/muted API' : (isZeroCost ? 'Zero cost from provider' : 'Margin below 1.5x');
                    if (internalSvc.isActive || !(existingMetadata as any).autoDisabled) {
                        metadataUpdate = { ...existingMetadata, autoDisabled: true, disableReason: reason };
                        logEntries.push({
                            action: 'AUTO_MUTE',
                            targetId: mapping.internalServiceId,
                            details: `Service auto-muted during sync: ${reason}`
                        });
                    }
                } else if (!internalSvc.isActive && (existingMetadata as any).autoDisabled) {
                    targetIsActive = true;
                    metadataUpdate = { ...existingMetadata, autoDisabled: false, disableReason: null };
                    logEntries.push({
                        action: 'AUTO_RECOVER',
                        targetId: mapping.internalServiceId,
                        details: `Service auto-recovered (provider restored service successfully)`
                    });
                }

                operations.push(prisma.internalService.update({
                    where: { id: mapping.internalServiceId },
                    data: {
                        ...(isZeroCost ? {} : {
                            lastProviderPrice: cost,
                            providerPriceOriginal: mapping.providerService.rawPriceOriginal,
                            providerCurrencyOriginal: mapping.providerService.rawCurrencyOriginal,
                        }),
                        pricePer1000: newPrice,
                        requirements: requirementText,
                        isActive: targetIsActive,
                        isCancelEnabled: !!mapping.providerService.cancel,
                        isRefillEnabled: !!mapping.providerService.refill,
                        ...(metadataUpdate ? { metadata: metadataUpdate } : {})
                    }
                }));

                // 2. Prepare Project Override Update
                if (mapping.projectId) {
                    const overrideKey = `${mapping.projectId}_${mapping.internalServiceId}`;
                    const override = overrideMap.get(overrideKey);

                    if (override) {
                        const currentProjPrice = override.customPrice ? new Decimal(override.customPrice) : new Decimal(internalSvc.pricePer1000);
                        const newProjPrice = isZeroCost
                            ? currentProjPrice
                            : await PricingService.calculateRetailPrice(cost, {
                                category: internalSvc.serviceCategory?.categoryType as any || 'OTHER',
                                providerName: mapping.provider.name,
                                projectId: mapping.projectId
                            });

                        const projNeedsDisable = isZeroCost || currentProjPrice.lt(safetyPrice);

                        operations.push(prisma.projectServiceOverride.update({
                            where: { id: override.id },
                            data: {
                                customPrice: newProjPrice,
                                isActive: projNeedsDisable ? false : override.isActive
                            }
                        }));
                    } else {
                        // Create default override if missing
                        const markupVal = Number(internalSvc.markup || 0);
                        const multiplier = Math.max(1 + markupVal / 100, 1.5);
                        operations.push(prisma.projectServiceOverride.create({
                            data: {
                                projectId: mapping.projectId,
                                internalServiceId: mapping.internalServiceId,
                                isActive: false,
                                customPrice: cost.mul(multiplier)
                            }
                        }));
                    }
                }
            }

            // Execute in batches to keep connection pool happy
            const CHUNK_SIZE = 100;
            for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
                const chunk = operations.slice(i, i + CHUNK_SIZE);
                await prisma.$transaction(chunk);
            }

            // Persist logs
            if (logEntries.length > 0) {
                await prisma.adminLog.createMany({ data: logEntries });
            }

            console.log(`[ServiceSync] ${provider.name}: Propagated prices to ${mappings.length} services (Batched).`);
        } catch (err) {
            console.error(`[ServiceSync] ${provider.name} propagation failed:`, err);
        }
    }
}


