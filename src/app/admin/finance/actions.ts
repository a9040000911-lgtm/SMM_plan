'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { AdminServices } from '@/services/admin/registry';
import { AdminContext } from '@/services/types';

export async function getFinanceMetricsAction(period: 'all' | 'month' | 'today' = 'all') {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
        throw new Error('Unauthorized');
    }

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    const result = await AdminServices.finance.getFinanceMetrics(ctx, period);
    if (!result.success) {
        throw new Error(result.error.message);
    }

    return result.data;
}


