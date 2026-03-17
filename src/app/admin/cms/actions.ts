'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { CmsService } from '@/services/cms/cms.service';
import { AdminServices } from '@/services/admin/registry';
import { AdminContext } from '@/services/types';

export async function updateCmsStringsAction(
    projectId: string, 
    updates: Record<string, string>, 
    pageSlug?: string
): Promise<{ success: boolean; error?: string }> {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    const result = await AdminServices.management.updateCmsStrings(ctx, { projectId, updates, pageSlug });
    if (!result.success) return { success: false, error: result.error.message };

    await CmsService.invalidateCache(projectId, pageSlug);
    revalidatePath('/');
    revalidatePath('/admin/cms');
    
    return { success: true };
}

export async function updateCmsBlocksAction(
    projectId: string, 
    pageSlug: string, 
    blocks: any[]
): Promise<{ success: boolean; error?: string }> {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    const result = await AdminServices.management.updateCmsBlocks(ctx, { projectId, pageSlug, blocks });
    if (!result.success) return { success: false, error: result.error.message };

    await CmsService.invalidateCache(projectId, pageSlug);
    revalidatePath('/');
    revalidatePath('/admin/cms');
    
    return { success: true };
}
