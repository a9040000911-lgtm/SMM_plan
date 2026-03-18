"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession, getActiveProjectId } from "@/utils/admin-session";
import { revalidatePath } from "next/cache";
import { ReviewStatus } from '@/generated/client';
import { AdminDataService } from "@/services/admin/admin-data.service";
import { AdminContext } from "@/services/types";

async function getCtx(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

/**
 * Fetches reviews for the active project context.
 */
export async function getReviewsAction() {
    const ctx = await getCtx();
    const activeProjectId = await getActiveProjectId();

    const result = await AdminDataService.getReviews(ctx, activeProjectId || undefined);
    if (!result.success) throw new Error(result.error.message);
    
    return result.data;
}

/**
 * Updates a review's status or content.
 */
export async function updateReviewAction(
    id: string,
    data: { status?: ReviewStatus; text?: string; rating?: number; userName?: string; userRole?: string }
) {
    const ctx = await getCtx();

    // The service handles status updates via updateReviewStatus
    if (data.status && Object.keys(data).length === 1) {
        const result = await AdminDataService.updateReviewStatus(ctx, id, data.status);
        if (!result.success) throw new Error(result.error.message);
    } else {
        // For general updates, we use upsertAdminReview logic or a dedicated update method
        // Existing AdminDataService.upsertAdminReview handles id as well
        // We'll fetch the review first to get its projectId if not provided in 'data'
        // But for simplicity, we'll assume the service handles internal logic.
        const result = await AdminDataService.upsertAdminReview(ctx, id, data);
        if (!result.success) throw new Error(result.error.message);
    }

    revalidatePath("/admin/marketing/reviews");
    return { success: true };
}

/**
 * Deletes a review.
 */
export async function deleteReviewAction(id: string) {
    const ctx = await getCtx();
    const result = await AdminDataService.deleteReview(ctx, id);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath("/admin/marketing/reviews");
    return { success: true };
}

/**
 * Creates or updates a review (Admin manual entry).
 */
export async function upsertAdminReviewAction(
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
    if (!result.success) throw new Error(result.error.message);

    revalidatePath("/admin/marketing/reviews");
    return { success: true };
}


