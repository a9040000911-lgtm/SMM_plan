'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminDataService } from '@/services/admin/admin-data.service';
import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/utils/admin-context';

export async function saveServiceOverrides(serviceId: string, overrides: Record<string, { customPrice: string, isActive: boolean, customName?: string, customDescription?: string }>) {
  try {
    const ctx = await getAdminContext();
    const res = await AdminDataService.saveServiceOverrides(ctx, serviceId, overrides);
    if (!res.success) throw new Error(res.error?.message);

    revalidatePath(`/admin/services/${serviceId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


