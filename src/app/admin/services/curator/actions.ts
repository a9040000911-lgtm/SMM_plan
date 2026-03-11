'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@/generated/client';

export interface ServiceFilter {
    search?: string;
    provider?: string;
    platform?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    showIgnored?: boolean;
    page?: number;
    limit?: number;
}

export async function getProviderServicesAction(filter: ServiceFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 50;
    const skip = (page - 1) * limit;

    const where: Prisma.ProviderServiceWhereInput = {
        mappings: { none: {} }, // Only unlinked services
    };

    if (!filter.showIgnored) {
        where.isIgnored = false;
    }

    if (filter.search) {
        where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
        ];
        const searchNum = Number(filter.search);
        if (!isNaN(searchNum)) {
            where.OR.push({ id: { equals: String(searchNum) } });
        }
    }

    if (filter.provider) {
        where.provider = { name: filter.provider };
    }

    // Crude platform/category filtering by name regex if not stored in DB
    if (filter.platform && filter.platform !== 'ALL') {
        where.name = { contains: filter.platform, mode: 'insensitive' };
    }

    // Price range
    if (filter.priceMin !== undefined || filter.priceMax !== undefined) {
        where.rawPrice = {};
        if (filter.priceMin !== undefined) where.rawPrice.gte = filter.priceMin;
        if (filter.priceMax !== undefined) where.rawPrice.lte = filter.priceMax;
    }

    const [items, total] = await Promise.all([
        prisma.providerService.findMany({
            where,
            skip,
            take: limit,
            orderBy: { rawPrice: 'asc' },
            include: { provider: true }
        }),
        prisma.providerService.count({ where })
    ]);

    return { items, total, totalPages: Math.ceil(total / limit) };
}

export async function ignoreServicesAction(ids: number[], providerName: string) {
    await prisma.providerService.updateMany({
        where: {
            id: { in: ids.map(String) },
            provider: { name: providerName }
        },
        data: { isIgnored: true }
    });
    revalidatePath('/admin/services/curator');
}

export interface ImportConfig {
    markupPercent: number; // e.g. 200 for 200% markup (x3 price)
    platform: string;
    category: string;
    targetType: string;
}

export async function importServicesAction(selectedServices: { id: number, providerName: string, name: string, rawPrice: number }[], config: ImportConfig) {
    let importedCount = 0;

    for (const svc of selectedServices) {
        const recommendedPrice = svc.rawPrice * (1 + config.markupPercent / 100);

        // Lookup provider ID first
        const provider = await prisma.provider.findFirst({ where: { name: svc.providerName } });
        if (!provider) {
            console.error(`Provider not found: ${svc.providerName}`);
            continue;
        }

        // Generate a simplified slug/id
        const cleanName = svc.name.replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
        const shortName = cleanName.split(' ').slice(0, 4).join('_');
        const internalId = `${config.platform.toLowerCase()}_${config.category.toLowerCase()}_${shortName}_${svc.id}`.substring(0, 50);

        try {
            const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');

            await prisma.$transaction(async (tx) => {
                const categoryObj = await SmartAnalyzerService.resolveCategory(tx, config.platform as any, config.category as any, config.targetType, null);

                await tx.internalService.create({
                    data: {
                        id: internalId,
                        name: svc.name,
                        description: `Imported from ${svc.providerName}`,
                        pricePer1000: recommendedPrice,
                        platform: config.platform as any,
                        category: config.category as any,
                        serviceCategory: { connect: { id: categoryObj.id } },
                        targetType: config.targetType,
                        geo: 'GLOBAL',
                        minQty: 10,
                        maxQty: 100000,
                        providerMappings: {
                            create: {
                                providerServiceId: String(svc.id),
                                providerId: provider.id,
                                priority: 1,
                                isActive: true
                            }
                        }
                    }
                });
            });
            importedCount++;
        } catch (e) {
            console.error(`Failed to import ${svc.id}:`, e);
        }
    }

    revalidatePath('/admin/services/curator');
    return { success: true, importedCount };
}
