'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminDataService } from '@/services/admin/admin-data.service';
import { Platform, Category } from '@/generated/client';
import { getAdminContext } from '@/utils/admin-context';

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
    try {
        const ctx = await getAdminContext();
        const res = await AdminDataService.getInternalServices(ctx, {
            platform,
            category,
            take: 100
        });

        if (!res.success) throw new Error(res.error?.message);
        return res.data || [];
    } catch (error: any) {
        console.error('[getServicesForFilter] Error:', error);
        return [];
    }
}


