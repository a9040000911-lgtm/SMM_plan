/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { PricingService } from '@/services/finance/pricing.service';
import { Decimal } from 'decimal.js';
import { ServiceResult, CatalogServiceItem } from "../types";
import { SerializedServiceV2 } from "@/types/catalog";
import { translateCategory } from "@/utils/translations";
import { LinkService } from "../providers/link.service";
import { analyzeLink } from "@/utils/link-analyzer";
import { Platform } from "@prisma/client";
import { sanitizeData } from "@/utils/service-sanitizer";

export class CatalogService {
    /**
     * Returns all available services for a specific project with formatted pricing and badges.
     */
    static async getAvailableServices(projectId: string): Promise<ServiceResult<CatalogServiceItem[]>> {
        try {
            const services = await prisma.internalService.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { providerMappings: { some: { projectId } } },
                        { providerMappings: { some: { projectId: null } } },
                        { projectOverrides: { some: { projectId, isActive: true } } }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    pricePer1000: true,
                    serviceCategory: { select: { categoryType: true } },
                    socialPlatform: { select: { slug: true } },
                    minQty: true,
                    maxQty: true,
                    requirements: true,
                    targetType: true,
                    isPrivate: true,
                    projectOverrides: {
                        where: { projectId },
                        select: {
                            customPrice: true,
                            customName: true,
                            customDescription: true,
                            customRequirements: true,
                            isActive: true,
                            customMinQty: true,
                            customMaxQty: true
                        }
                    },
                    metadata: true,
                    numericId: true
                },
                orderBy: {
                    pricePer1000: 'asc',
                },
            });

            const items: CatalogServiceItem[] = services.map(s => {
                const override = s.projectOverrides?.[0];
                const finalPricePer1000 = override?.customPrice ? Number(override.customPrice) : Number(s.pricePer1000);
                const pricePerUnit = Number((finalPricePer1000 / 1000).toFixed(4));

                return {
                    id: s.id,
                    name: override?.customName || s.name,
                    description: override?.customDescription || s.description,
                    requirements: override?.customRequirements || s.requirements || "",
                    pricePer1000: finalPricePer1000,
                    pricePerUnit: pricePerUnit,
                    category: s.serviceCategory?.categoryType as any || "OTHER",
                    platform: s.socialPlatform?.slug as any || "other",
                    targetType: s.targetType,
                    isPrivate: s.isPrivate,
                    // Smart Badges Logic (Moved from Action)
                    isHot: s.name.toLowerCase().includes("premium") || s.name.toLowerCase().includes("fast"),
                    isCheap: finalPricePer1000 < 50,
                    isBest: s.name.toLowerCase().includes("garant") || s.name.toLowerCase().includes("гарант"),
                    quality: s.name.toLowerCase().includes("hq") ? "HIGH" : "STD",
                    minQty: Number(override?.customMinQty || s.minQty || 1),
                    maxQty: Number(override?.customMaxQty || s.maxQty || 1000000),
                    qtyStep: Number((s as any).config?.qtyStep || (s as any).metadata?.qty_step || 1),
                    numericId: (s as any).numericId?.toString()
                };
            });

            return { success: true, data: sanitizeData(items) };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'CATALOG_FETCH_FAILED', message: error.message }
            };
        }
    }
    
    /**
     * Returns available services optionally filtered by platform.
     */
    static async getAvailableByPlatform(projectId: string, platform?: string | null): Promise<ServiceResult<CatalogServiceItem[]>> {
        try {
            const query: any = {
                where: {
                    isActive: true,
                    OR: [
                        { providerMappings: { some: { projectId } } },
                        { providerMappings: { some: { projectId: null } } },
                        { projectOverrides: { some: { projectId, isActive: true } } }
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    pricePer1000: true,
                    serviceCategory: { select: { categoryType: true } },
                    socialPlatform: { select: { slug: true } },
                    minQty: true,
                    maxQty: true,
                    requirements: true,
                    targetType: true,
                    isPrivate: true,
                    projectOverrides: {
                        where: { projectId },
                        select: {
                            customPrice: true,
                            customName: true,
                            customDescription: true,
                            customRequirements: true,
                            isActive: true,
                            customMinQty: true,
                            customMaxQty: true
                        }
                    },
                    metadata: true,
                    numericId: true
                },
                orderBy: {
                    pricePer1000: 'asc',
                },
            };

            // Apply platform filter if provided
            if (platform && platform.toLowerCase() !== 'all' && platform.toLowerCase() !== 'generic') {
                query.where.socialPlatform = { slug: platform.toLowerCase() };
            }

            const services = await prisma.internalService.findMany(query) as any[];

            const items: CatalogServiceItem[] = services.map(s => {
                const override = s.projectOverrides?.[0];
                const finalPricePer1000 = override?.customPrice ? Number(override.customPrice) : Number(s.pricePer1000);
                const pricePerUnit = Number((finalPricePer1000 / 1000).toFixed(4));

                return {
                    id: s.id,
                    name: override?.customName || s.name,
                    description: override?.customDescription || s.description,
                    requirements: override?.customRequirements || s.requirements || "",
                    pricePer1000: finalPricePer1000,
                    pricePerUnit: pricePerUnit,
                    category: s.serviceCategory?.categoryType as any || "OTHER",
                    platform: s.socialPlatform?.slug as any || "other",
                    targetType: s.targetType,
                    isPrivate: s.isPrivate,
                    isHot: s.name.toLowerCase().includes("premium") || s.name.toLowerCase().includes("fast"),
                    isCheap: finalPricePer1000 < 50,
                    isBest: s.name.toLowerCase().includes("garant") || s.name.toLowerCase().includes("гарант"),
                    quality: s.name.toLowerCase().includes("hq") ? "HIGH" : "STD",
                    minQty: Number(override?.customMinQty || s.minQty || 1),
                    maxQty: Number(override?.customMaxQty || s.maxQty || 1000000),
                    qtyStep: Number((s as any).config?.qtyStep || (s as any).metadata?.qty_step || 1),
                    numericId: (s as any).numericId?.toString()
                };
            });

            return { success: true, data: sanitizeData(items) };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'CATALOG_FETCH_PLATFORM_FAILED', message: error.message }
            };
        }
    }

    /**
     * Returns a grouped catalog structure optimized for the UI.
     */
    static async getGroupedCatalog(projectId: string): Promise<ServiceResult<Record<string, Record<string, SerializedServiceV2[]>>>> {
        try {
            const services = await prisma.internalService.findMany({
                where: {
                    isActive: true,
                    OR: [
                        { projectOverrides: { some: { projectId, isActive: true } } },
                        { 
                            isPrivate: false,
                            providerMappings: { some: { projectId } }
                        },
                        {
                            isPrivate: false,
                            providerMappings: { some: { projectId: null } }
                        }
                    ]
                },
                include: {
                    serviceCategory: true,
                    socialPlatform: true,
                    projectOverrides: {
                        where: { projectId, isActive: true },
                        include: { serviceCategory: true }
                    }
                },
                orderBy: [{ socialPlatform: { slug: 'asc' } }, { serviceCategory: { categoryType: 'asc' } }, { pricePer1000: 'asc' }]
            });

            const grouped: Record<string, Record<string, SerializedServiceV2[]>> = {};

            const toNum = (val: any): number => {
                if (val == null) return 0;
                if (typeof val === 'number') return val;
                if (typeof val === 'string') return Number(val);
                if (typeof val.toNumber === 'function') return val.toNumber();
                return Number(val) || 0;
            };

            services.forEach((s: any) => {
                const platformSlug = s.socialPlatform?.slug || "other";
                if (!grouped[platformSlug]) grouped[platformSlug] = {};

                const override = s.projectOverrides[0];
                const categoryOverride = override?.serviceCategory;

                const catType = s.serviceCategory?.categoryType || "OTHER";
                let categoryDisplayName = translateCategory(catType);

                // Smart Taxonomy Overlay - восстанавливаем разделение и лечим 'Другое'
                if (catType === 'SUBSCRIBERS' && s.isPrivate) {
                    categoryDisplayName = 'Подписчики (Закрытый канал)';
                } else if (catType === 'OTHER' && (s.name.toLowerCase().includes('реакци') || s.name.toLowerCase().includes('reaction'))) {
                    categoryDisplayName = 'Реакции';
                } else if (categoryOverride?.name && categoryOverride.name !== s.serviceCategory?.name) {
                    // Уважаем ручной труд администратора, если это не мусорный дубль
                    const overrideLower = categoryOverride.name.toLowerCase();
                    if (!['views', 'likes', 'subscribers', 'comments', 'reposts', 'other', catType.toLowerCase()].includes(overrideLower)) {
                        categoryDisplayName = categoryOverride.name;
                    }
                }

                if (!grouped[platformSlug][categoryDisplayName]) grouped[platformSlug][categoryDisplayName] = [];

                let finalPricePer1000 = toNum(s.pricePer1000);
                let markupValue = toNum(s.markup);

                if (override) {
                    if (override.customPrice) {
                        finalPricePer1000 = toNum(override.customPrice);
                    } else if (override.markup) {
                        const cost = toNum(s.lastProviderPrice) || finalPricePer1000 / 2;
                        markupValue = toNum(override.markup);
                        const rawCalculated = cost * (1 + markupValue / 100);
                        finalPricePer1000 = PricingService.applyBeautifulRounding(new Decimal(rawCalculated)).toNumber();
                    }
                }

                const nameLower = s.name.toLowerCase();

                const serialized: SerializedServiceV2 = {
                    id: s.id,
                    numericId: s.numericId,
                    name: override?.customName || s.name,
                    description: override?.customDescription || s.description || "",
                    platform: platformSlug as any,
                    category: categoryDisplayName,
                    pricePer1000: finalPricePer1000,
                    lastProviderPrice: toNum(s.lastProviderPrice),
                    createdAt: s.createdAt.toISOString(),
                    updatedAt: s.updatedAt.toISOString(),
                    providerPriceOriginal: toNum(s.providerPriceOriginal),
                    markup: markupValue,
                    marketPrice: toNum(s.marketPrice),
                    isHot: nameLower.includes("premium") || nameLower.includes("fast") || nameLower.includes("быстрые") || nameLower.includes("живые"),
                    isCheap: finalPricePer1000 < 50,
                    isBest: nameLower.includes("garant") || nameLower.includes("гарант"),
                    quality: nameLower.includes("hq") ? "HIGH" : "STD",
                    minQty: s.minQty,
                    maxQty: s.maxQty,
                    isActive: s.isActive,
                    isCurated: s.isCurated || false,
                    targetType: s.targetType
                };

                grouped[platformSlug][categoryDisplayName].push(serialized);
            });

            return { success: true, data: sanitizeData(grouped) };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'GROUPED_CATALOG_FETCH_FAILED', message: error.message }
            };
        }
    }

    /**
     * Returns a specific service by ID.
     */
    static async getServiceById(serviceId: string): Promise<ServiceResult<any>> {
        try {
            const service = await prisma.internalService.findUnique({
                where: { id: serviceId }
            });

            if (!service) throw new Error('Услуга не найдена');

            return { success: true, data: sanitizeData(service) };
        } catch (error: any) {
            return { success: false, error: { code: 'SERVICE_NOT_FOUND', message: error.message } };
        }
    }

    /**
     * Validates a link for a specific service.
     */
    static async validateLink(link: string, serviceId: string): Promise<ServiceResult<any>> {
        try {
            const service = await prisma.internalService.findUnique({
                where: { id: serviceId },
                select: { socialPlatform: { select: { slug: true } }, targetType: true, allowedTargetTypes: true }
            });

            if (!service) throw new Error('Услуга не найдена');

            const validation = LinkService.validate(
                link,
                service.socialPlatform?.slug as Platform || 'OTHER',
                service.targetType,
                service.allowedTargetTypes || undefined
            );

            return { success: true, data: validation };
        } catch (error: any) {
            return { success: false, error: { code: 'LINK_VALIDATION_FAILED', message: error.message } };
        }
    }

    /**
     * Premium: Analyzes link and suggests services for smmplan-elite.
     */
    static async analyzePremiumLink(link: string): Promise<ServiceResult<any>> {
        try {
            const analysis = analyzeLink(link);
            if (!analysis) throw new Error('Не удалось определить платформу');

            const project = await prisma.project.findUnique({ where: { slug: "smmplan-elite" } });
            if (!project) throw new Error("Проект Elite не найден");

            const overrides = await prisma.projectServiceOverride.findMany({
                where: {
                    projectId: project.id,
                    isActive: true,
                    internalService: {
                        socialPlatform: { slug: analysis.platform },
                        serviceCategory: { categoryType: { in: analysis.possibleCategories } },
                    }
                },
                include: { internalService: true },
                take: 5,
            });

            return {
                success: true,
                data: sanitizeData({
                    platform: analysis.platform,
                    objectType: analysis.objectType,
                    suggestedServices: overrides.map(o => ({
                        id: o.internalService.id,
                        name: o.customName || o.internalService.name,
                        description: o.customDescription || o.internalService.description,
                        price: Number(o.customPrice || o.internalService.pricePer1000)
                    }))
                })
            };
        } catch (error: any) {
            return { success: false, error: { code: 'PREMIUM_ANALYSIS_FAILED', message: error.message } };
        }
    }

    /**
     * Premium: Gets services for smmplan-elite.
     */
    static async getPremiumServices(platform?: string): Promise<ServiceResult<any[]>> {
        try {
            const project = await prisma.project.findUnique({ where: { slug: "smmplan-elite" } });
            if (!project) throw new Error("Проект Elite не найден");

            const overrides = await prisma.projectServiceOverride.findMany({
                where: {
                    projectId: project.id,
                    isActive: true,
                    ...(platform && platform !== 'all' ? { internalService: { socialPlatform: { slug: platform } } } : {})
                },
                include: { internalService: { include: { socialPlatform: true } } },
                orderBy: { internalService: { rating: 'desc' } }
            });

            return {
                success: true,
                data: sanitizeData(overrides.map(o => ({
                    id: o.internalService.id,
                    name: o.customName || o.internalService.name,
                    desc: o.customDescription || o.internalService.description,
                    price: `${Number(o.customPrice || o.internalService.pricePer1000)} ₽`,
                    platform: o.internalService.socialPlatform?.slug || 'other'
                })))
            };
        } catch (error: any) {
            return { success: false, error: { code: 'PREMIUM_SERVICES_FAILED', message: error.message } };
        }
    }
}


