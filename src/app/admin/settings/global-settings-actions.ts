'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminServices } from '@/services/admin/registry';
import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/utils/admin-context';

export async function updateGlobalSettingsAction(settings: Record<string, string>) {
    try {
        const ctx = await getAdminContext();
        if (!ctx.isGlobalAdmin) {
            throw new Error('Unauthorized: Global Admin access required');
        }

        const res = await AdminServices.management.updateGlobalSettings(ctx, { settings });
        if (!res.success) throw new Error(res.error?.message);

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        console.error('[GlobalSettings] Error updating settings:', e);
        return { success: false, error: e.message };
    }
}

export async function getGlobalSettingsAction() {
    try {
        const ctx = await getAdminContext();
        const res = await AdminServices.management.getGlobalSettings(ctx);
        if (!res.success) throw new Error(res.error?.message);
        return { success: true, settings: res.data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


