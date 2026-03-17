'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminDataService } from '@/services/admin/admin-data.service';
import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/utils/admin-context';

export async function bulkMoveServicesToCategoryAction(
    serviceIds: string[],
    targetCategoryId: string,
    targetPlatform: string,
    targetCategoryEnum: string
) {
    try {
        const ctx = await getAdminContext();
        if (!serviceIds.length) return { success: false, error: 'No services selected' };

        const res = await AdminDataService.bulkMoveServicesToCategory(ctx, serviceIds, targetCategoryId, targetPlatform, targetCategoryEnum);
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath('/admin/services');
        return { success: true, count: res.data };
    } catch (error: any) {
        console.error('Failed to bulk move services:', error);
        return { success: false, error: error.message };
    }
}

export async function bulkToggleStatusAction(serviceIds: string[], isActive: boolean) {
    try {
        const ctx = await getAdminContext();
        const res = await AdminDataService.bulkToggleServices(ctx, serviceIds, isActive);
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath('/admin/services');
        return { success: true, count: res.data };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
