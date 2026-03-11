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
        throw new Error('Unauthorized: Session not found');
    }
    if (!['ADMIN', 'SUPPORT'].includes(session.role)) {
        throw new Error(`Forbidden: Role ${session.role} is not authorized for this action`);
    }
    return session;
}

export async function getPromoCodesAction() {
    const admin = await requireSupportOrAdmin();

    // Если не Global Admin, фильтруем по доступным проектам
    const isGlobalAdmin = (admin as any).isGlobalAdmin;
    const allowedProjects = (admin as any).allowedProjects || [];

    const where: any = {};
    if (!isGlobalAdmin) {
        where.projectId = { in: allowedProjects };
    }

    return await prisma.promoCode.findMany({
        where,
        orderBy: { isActive: 'desc' },
        include: { project: true }
    });
}

export async function createPromoCodeAction(data: {
    code: string;
    discountPercent: number;
    description?: string;
    projectId?: string;
}) {
    const admin = await requireSupportOrAdmin();

    // Проверка уникальности кода
    const existing = await prisma.promoCode.findFirst({
        where: {
            code: data.code.toUpperCase(),
            projectId: data.projectId || null
        }
    });

    if (existing) {
        throw new Error(`Промокод ${data.code} уже существует в этом проекте`);
    }

    const promo = await prisma.promoCode.create({
        data: {
            code: data.code.toUpperCase(),
            discountPercent: data.discountPercent,
            description: data.description,
            projectId: data.projectId || null,
            isActive: true
        }
    });

    await prisma.adminLog.create({
        data: {
            adminId: admin.id || 'system',
            action: 'CREATE_PROMOCODE',
            targetId: promo.id,
            details: `Created promo code ${promo.code} with ${promo.discountPercent}% discount`
        }
    });

    revalidatePath('/admin/promo-codes');
    return { success: true, promo };
}

export async function togglePromoCodeAction(promoId: string) {
    const admin = await requireSupportOrAdmin();

    const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
    if (!promo) throw new Error('Promo code not found');

    const updated = await prisma.promoCode.update({
        where: { id: promoId },
        data: { isActive: !promo.isActive }
    });

    await prisma.adminLog.create({
        data: {
            adminId: admin.id || 'system',
            action: 'TOGGLE_PROMOCODE',
            targetId: promoId,
            details: `Promo code ${promo.code} is now ${updated.isActive ? 'ACTIVE' : 'INACTIVE'}`
        }
    });

    revalidatePath('/admin/promo-codes');
    return { success: true };
}

export async function deletePromoCodeAction(promoId: string) {
    const admin = await requireSupportOrAdmin();

    const promo = await prisma.promoCode.findUnique({ where: { id: promoId } });
    if (!promo) throw new Error('Promo code not found');

    // Мы не удаляем физически, а просто деактивируем или помечаем как удаленный?
    // В схеме нет deletedAt для PromoCode, но мы можем его удалить, если еще нет связанных UserPromo
    const usage = await prisma.userPromo.count({ where: { promoCodeId: promoId } });

    if (usage > 0) {
        // Если уже использован кем-то, лучше просто деактивировать
        await prisma.promoCode.update({
            where: { id: promoId },
            data: { isActive: false }
        });
        return { success: true, message: 'Промокод деактивирован, так как он уже использовался' };
    }

    await prisma.promoCode.delete({ where: { id: promoId } });

    await prisma.adminLog.create({
        data: {
            adminId: admin.id || 'system',
            action: 'DELETE_PROMOCODE',
            targetId: promoId,
            details: `Deleted promo code ${promo.code}`
        }
    });

    revalidatePath('/admin/promo-codes');
    return { success: true };
}
