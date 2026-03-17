'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export async function getDashboardChartsData() {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const result = await AdminDataService.getDashboardChartsData(ctx);
  if (!result.success) throw new Error(result.error.message);

  return result.data;
}

export async function getChurnStatsAction() {
    // This was already refactored in Churn implementation
    const { getChurnStatsAction: originalAction } = await import('./churn/actions');
    return originalAction();
}
