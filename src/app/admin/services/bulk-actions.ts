'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';

async function requireSupportOrAdmin() {
    const session = await getAdminSession();
    if (!session) {
        throw new Error("Unauthorized: Session not found");
    }
    if (!['ADMIN', 'SUPPORT'].includes(session.role)) {
        throw new Error(`Forbidden: Role ${session.role} is not authorized for this action`);
    }
    return session;
}

export async function bulkMoveServicesToCategoryAction(
    serviceIds: string[],
    targetCategoryId: string,
    targetPlatform: string,
    targetCategoryEnum: string
) {
    try {
        await requireSupportOrAdmin();

        if (!serviceIds.length) return { success: false, error: 'No services selected' };

        await prisma.internalService.updateMany({
            where: { id: { in: serviceIds } },
            data: {
                categoryId: targetCategoryId,
                platform: targetPlatform as any,
                category: targetCategoryEnum as any
            }
        });

        revalidatePath('/admin/services');
        return { success: true, count: serviceIds.length };
    } catch (error: any) {
        console.error('Failed to bulk move services:', error);
        return { success: false, error: error.message };
    }
}

export async function bulkToggleStatusAction(serviceIds: string[], isActive: boolean) {
    try {
        await requireSupportOrAdmin();
        await prisma.internalService.updateMany({
            where: { id: { in: serviceIds } },
            data: { isActive }
        });
        revalidatePath('/admin/services');
        return { success: true, count: serviceIds.length };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
