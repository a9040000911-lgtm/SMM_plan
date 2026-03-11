/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Category } from '@/generated/client';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { SmartAnalyzerLogic, AnalyzedService } from './smart-analyzer.logic';
import { CATEGORY_DISPLAY_NAMES, CATEGORY_ICONS } from '@/utils/category-metadata';

// Re-export constants and types for server components that already import from this file
export * from './smart-analyzer.logic';

export class SmartAnalyzerService {
    /**
     * Proxies to pure logic version.
     */
    static async getPlatforms() {
        // Simple 1-minute cache could be implemented here, but for now we fetch direct or assume Prisma cache
        // Actually, let's just fetch them. 
        return await prisma.socialPlatform.findMany({ where: { isActive: true } });
    }

    /**
     * Proxies to pure logic version.
     * NOTE: This sync version will ONLY use hardcoded platforms if called directly without dynamic data.
     * To use dynamic platforms, use analyzeService instead.
     */
    static detectSync(name: string, description: string = '', categoryInput: string = ''): AnalyzedService {
        return SmartAnalyzerLogic.detectSync(name, description, categoryInput);
    }

    static async analyzeService(name: string, description: string = '', categoryInput: string = ''): Promise<AnalyzedService | null> {
        const platforms = await this.getPlatforms();
        return SmartAnalyzerLogic.detectSync(name, description, categoryInput, platforms);
    }

    static async suggestPlatform(name: string, category: string = ''): Promise<string> {
        const platforms = await this.getPlatforms();
        return SmartAnalyzerLogic.detectSync(name, '', category, platforms).platform;
    }

    static suggestCategory(name: string, category: string = ''): Category {
        return SmartAnalyzerLogic.detectSync(name, '', category).category;
    }

    static async suggestTargetType(name: string, category: string, description: string = ''): Promise<string> {
        return SmartAnalyzerLogic.detectSync(name, description, category).targetType;
    }

    static suggestIsPrivate(name: string): boolean {
        return SmartAnalyzerLogic.detectSync(name).isPrivate;
    }

    /**
     * Finds or creates a ServiceCategory for the given platform and type.
     */
    static async resolveCategory(tx: any, platform: any, categoryType: Category, targetType: string, projectId: string | null = null) {
        let category = await tx.serviceCategory.findFirst({
            where: {
                projectId,
                platform: platform as any,
                categoryType: categoryType
            }
        });

        if (!category) {
            category = await tx.serviceCategory.create({
                data: {
                    projectId,
                    platform: platform as any,
                    categoryType: categoryType,
                    name: CATEGORY_DISPLAY_NAMES[categoryType] || categoryType,
                    icon: CATEGORY_ICONS[categoryType] || 'layers',
                    targetType: targetType || 'ALL',
                    priority: 0
                }
            });
        }
        return category;
    }

    /**
     * Bulk import logic for multiple services.
     */
    static async bulkImport(items: any[], settings: { platform?: any, priceMultiplier: number, projectId?: string | null }) {
        const platforms = await this.getPlatforms();
        let count = 0;
        for (const item of items) {
            try {
                // Use default price multiplier if not provided in item
                const multiplier = settings.priceMultiplier || 1.5;
                await this.importSingle(item.providerId, item.serviceId, item, multiplier, settings.projectId, platforms);
                count++;
            } catch (err) {
                console.error(`Failed to import service ${item.serviceId} from ${item.providerId}:`, err);
            }
        }
        return { count };
    }

    /**
     * Import a single service with smart analysis.
     */
    static async importSingle(
        providerId: string,
        serviceId: string | number,
        itemData?: any,
        priceMultiplier: number = 1.5,
        projectId?: string | null,
        preloadedPlatforms?: any[]
    ) {
        let rawSvc = itemData;
        if (!rawSvc) {
            rawSvc = await prisma.providerService.findUnique({
                where: { id: serviceId.toString() }
            });
        }

        if (!rawSvc) throw new Error('Provider service not found');

        const platforms = preloadedPlatforms || await this.getPlatforms();
        const analysis = SmartAnalyzerLogic.detectSync(rawSvc.name, rawSvc.description || '', rawSvc.category || '', platforms);

        let internalId = '';
        const existingMap = await prisma.internalServiceMapping.findFirst({
            where: { providerId, providerServiceId: rawSvc.id.toString() }
        });
        if (existingMap) {
            internalId = existingMap.internalServiceId;
        } else {
            internalId = crypto.randomUUID();
        }
        const finalPrice = new Decimal(rawSvc.rawPrice).mul(priceMultiplier);

        const svc = await prisma.$transaction(async (tx) => {
            // Ensure Category exists
            const categoryObj = await this.resolveCategory(tx, analysis.platform, analysis.category, analysis.targetType, projectId === 'all' ? null : (projectId || null));

            return tx.internalService.upsert({
                where: { id: internalId },
                update: {
                    name: analysis.suggestedName || rawSvc.name,
                    description: analysis.description_ru || rawSvc.description || '',
                    pricePer1000: finalPrice,
                    lastProviderPrice: rawSvc.rawPrice,
                    platform: analysis.platform,
                    socialPlatform: {
                        connect: { slug: analysis.platformSlug || 'other' }
                    },
                    category: analysis.category,
                    serviceCategory: { connect: { id: categoryObj.id } },
                    targetType: analysis.targetType,
                    isPrivate: analysis.isPrivate,
                    requirements: analysis.requirements,
                },
                create: {
                    id: internalId,
                    name: analysis.suggestedName || rawSvc.name,
                    description: analysis.description_ru || rawSvc.description || '',
                    pricePer1000: finalPrice,
                    lastProviderPrice: rawSvc.rawPrice,
                    minQty: rawSvc.minQty || 10,
                    maxQty: rawSvc.maxQty || 100000,
                    platform: analysis.platform,
                    socialPlatform: {
                        connect: { slug: analysis.platformSlug || 'other' }
                    },
                    category: analysis.category,
                    serviceCategory: { connect: { id: categoryObj.id } },
                    targetType: analysis.targetType,
                    isPrivate: analysis.isPrivate,
                    requirements: analysis.requirements,
                    geo: 'Global',
                    isActive: true,
                    providerMappings: {
                        create: {
                            providerId,
                            providerServiceId: rawSvc.id,
                            priority: 1,
                            isActive: true,
                            projectId: projectId === 'all' ? null : (projectId || null)
                        }
                    }
                }
            });
        });

        // If projectId is provided, also ensure the service is activated in that project
        if (projectId && projectId !== 'all') {
            const { activateServiceInProject } = await import('@/app/admin/services/actions');
            await activateServiceInProject(svc.id, projectId);
        }

        return svc;
    }
}
