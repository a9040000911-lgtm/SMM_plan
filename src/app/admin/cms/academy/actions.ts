"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Academy Server Actions for CMS Studio
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminContext } from '@/services/types';
import { getActiveProjectId } from '@/utils/admin-session';

export async function getAcademyArticlesAction(projectId: string) {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    // const result = await AdminServices.management.getAcademyArticles(ctx, projectId);
    // if (!result.success) throw new Error(result.error.message);
    
    return []; // result.data;
}

export async function upsertAcademyArticleAction(projectId: string, data: any) {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    // const result = await AdminServices.management.upsertAcademyArticle(ctx, projectId, data);
    // if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/cms/academy');
    return {}; // result.data;
}

export async function deleteAcademyArticleAction(id: string) {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    // const result = await AdminServices.management.deleteAcademyArticle(ctx, id);
    // if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/cms/academy');
    return { success: true };
}

export async function getActiveProjectIdAction() {
    return await getActiveProjectId();
}
