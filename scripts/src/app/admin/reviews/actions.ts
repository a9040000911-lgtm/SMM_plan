'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ReviewStatus } from '@/generated/client';

async function getAdminAccess() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) return { isAuthorized: false, isGlobal: false, projectIds: [] };

    const { verifyAdminSession } = await import('@/lib/jwt');
    const data = await verifyAdminSession(session.value);
    if (!data) return { isAuthorized: false, isGlobal: false, projectIds: [] };
    return {
        isAuthorized: true,
        isGlobal: data.isGlobalAdmin,
        projectIds: data.allowedProjects || []
    };
}

export async function updateReviewStatus(reviewId: string, status: ReviewStatus) {
    const access = await getAdminAccess();
    if (!access.isAuthorized) return { success: false, error: 'Unauthorized' };

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return { success: false, error: 'Review not found' };

    if (!access.isGlobal && !access.projectIds.includes(review.projectId)) {
        return { success: false, error: 'Access denied to this project' };
    }

    try {
        await prisma.review.update({
            where: { id: reviewId },
            data: {
                status,
                moderatedAt: new Date(),
            }
        });
        revalidatePath('/admin/reviews');
        revalidatePath('/admin/content');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Failed to update review:', e);
        return { success: false, error: 'Database error' };
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
    const access = await getAdminAccess();
    if (!access.isAuthorized) return { success: false, error: 'Unauthorized' };

    if (!access.isGlobal && !access.projectIds.includes(data.projectId)) {
        return { success: false, error: 'Access denied to this project' };
    }

    try {
        const reviewData = {
            ...data,
            // Since schema requires userId, we use the admin's ID or find a fallback
            userId: (await prisma.user.findFirst({ where: { role: 'ADMIN' } }))?.id || '',
            moderatedAt: new Date(),
        };

        if (id) {
            await prisma.review.update({ where: { id }, data: reviewData });
        } else {
            await prisma.review.create({ data: reviewData });
        }

        revalidatePath('/admin/reviews');
        revalidatePath('/admin/content');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Failed to upsert review:', e);
        return { success: false, error: 'Database error' };
    }
}

export async function deleteReview(reviewId: string) {
    const access = await getAdminAccess();
    if (!access.isAuthorized) return { success: false, error: 'Unauthorized' };

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return { success: false, error: 'Review not found' };

    if (!access.isGlobal && !access.projectIds.includes(review.projectId)) {
        return { success: false, error: 'Access denied to this project' };
    }

    try {
        await prisma.review.delete({ where: { id: reviewId } });
        revalidatePath('/admin/reviews');
        revalidatePath('/admin/content');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error('Failed to delete review:', e);
        return { success: false, error: 'Database error' };
    }
}
