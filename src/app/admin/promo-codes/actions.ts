'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminFinanceService } from '@/services/admin/admin-finance.service';
import { AdminContext } from '@/services/types';

async function requireSupportOrAdmin(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session) {
        throw new Error('Unauthorized: Session not found');
    }
    if (!['ADMIN', 'SUPPORT'].includes(session.role)) {
        throw new Error(`Forbidden: Role ${session.role} is not authorized for this action`);
    }
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

export async function getPromoCodesAction() {
    const ctx = await requireSupportOrAdmin();
    const result = await AdminFinanceService.getInstance().getPromoCodes(ctx);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

export async function createPromoCodeAction(data: {
    code: string;
    discountPercent: number;
    description?: string;
    projectId?: string;
}) {
    const ctx = await requireSupportOrAdmin();
    const result = await AdminFinanceService.getInstance().createPromoCode(ctx, {
      ...data,
      projectId: data.projectId ?? null
    });
    if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/promo-codes');
    return { success: true, promo: result.data };
}

export async function togglePromoCodeAction(promoId: string) {
    const ctx = await requireSupportOrAdmin();
    const result = await AdminFinanceService.getInstance().togglePromoCode(ctx, promoId);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/promo-codes');
    return { success: true };
}

export async function deletePromoCodeAction(promoId: string) {
    const ctx = await requireSupportOrAdmin();
    const result = await AdminFinanceService.getInstance().deletePromoCode(ctx, promoId);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/promo-codes');
    return { success: true, message: result.data.deleted ? undefined : 'Промокод деактивирован, так как он уже использовался' };
}
