'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { revalidatePath } from 'next/cache';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export async function updateBugStatus(
    bugId: string,
    status: any,
    rewardAmount?: number,
    adminNotes?: string
) {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    const result = await AdminDataService.processBugBounty(ctx, bugId, {
        status,
        rewardAmount,
        adminNotes
    });

    if (!result.success) {
        return { success: false, error: result.error.message };
    }

    revalidatePath('/admin/support/bug-reports');
    revalidatePath(`/admin/support/bug-reports/${bugId}`);
    revalidatePath('/admin/support');
    
    return { success: true };
}


