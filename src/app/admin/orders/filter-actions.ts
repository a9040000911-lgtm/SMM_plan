'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Platform, Category } from '@/generated/client';

export interface FilterServiceItem {
    id: string;
    name: string;
    platform: Platform;
    category: Category;
}

export async function getServicesForFilter(
    platform?: Platform | 'ALL',
    category?: Category | 'ALL'
): Promise<FilterServiceItem[]> {
    const where: any = {};

    if (platform && platform !== 'ALL') {
        where.platform = platform;
    }

    if (category && category !== 'ALL') {
        where.category = category;
    }

    const services = await prisma.internalService.findMany({
        where,
        select: {
            id: true,
            name: true,
            platform: true,
            category: true,
        },
        orderBy: {
            name: 'asc',
        },
        take: 100 // Limit to avoid massive payloads, maybe improve later with search
    });

    return services;
}
