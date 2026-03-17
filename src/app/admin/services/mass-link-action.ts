'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminDataService } from '@/services/admin/admin-data.service';
import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/utils/admin-context';
import { getActiveProjectId } from '@/utils/admin-session';

export async function massLinkCategoryServicesAction(categoryId: string, mappings: Array<{ internalServiceId: string, providerId: string, providerServiceId: number }>) {
    try {
        const ctx = await getAdminContext();
        const activeProjectId = await getActiveProjectId();

        const res = await AdminDataService.massLinkServices(ctx, activeProjectId || null, mappings);
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath('/admin/services');
        return { success: true, count: res.data };
    } catch (error: any) {
        console.error('[massLinkCategoryServicesAction] Error:', error);
        return { success: false, error: error.message };
    }
}
