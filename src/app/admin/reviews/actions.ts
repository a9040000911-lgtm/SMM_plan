'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';
import { ReviewStatus } from '@/generated/client';

async function getCtx(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

export async function updateReviewStatus(reviewId: string, status: ReviewStatus) {
    const ctx = await getCtx();
    const result = await AdminDataService.updateReviewStatus(ctx, reviewId, status);
    
    if (result.success) {
        revalidatePath('/admin/reviews');
        revalidatePath('/admin/content');
        revalidatePath('/');
        return { success: true };
    } else {
        return { success: false, error: result.error.message };
    }
}

export async function upsertAdminReview(
    id: string | null,
    data: {
        projectId: string;
        rating: number;
        text: string;
        userName: string;
        userRole: string;
        status: ReviewStatus;
        isAnonymous: boolean;
    }
) {
    const ctx = await getCtx();
    const result = await AdminDataService.upsertAdminReview(ctx, id, data);
    
    if (result.success) {
        revalidatePath('/admin/reviews');
        revalidatePath('/admin/content');
        revalidatePath('/');
        return { success: true };
    } else {
        return { success: false, error: result.error.message };
    }
}

export async function deleteReview(reviewId: string) {
    const ctx = await getCtx();
    const result = await AdminDataService.deleteReview(ctx, reviewId);
    
    if (result.success) {
        revalidatePath('/admin/reviews');
        revalidatePath('/admin/content');
        revalidatePath('/');
        return { success: true };
    } else {
        return { success: false, error: result.error.message };
    }
}
