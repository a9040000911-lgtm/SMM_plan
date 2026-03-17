'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminDataService } from '@/services/admin/admin-data.service';
import { getAdminContext } from '@/utils/admin-context';

export async function getServicesHealthStats() {
  try {
    const ctx = await getAdminContext();
    const res = await AdminDataService.getServicesHealthStats(ctx);
    if (!res.success) throw new Error(res.error?.message);
    return res.data;
  } catch (error: any) {
    console.error('[getServicesHealthStats] Error:', error);
    return {};
  }
}
