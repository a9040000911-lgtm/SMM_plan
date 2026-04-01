'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers/provider.service';
import { revalidatePath } from 'next/cache';

export async function refillOrder(orderId: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { project: true }
        });

        if (!order) {
            return { success: false, error: 'Заказ не найден' };
        }

        const user = session.user as any;
        if (order.userId !== user.id && user.role !== 'ADMIN') {
            return { success: false, error: 'Доступ запрещен' };
        }

        // Eligibility check
        if (order.status !== 'COMPLETED' && order.status !== 'PARTIAL') {
            return { success: false, error: 'Дозаправка доступна только для завершенных заказов' };
        }

        if (!order.warrantyDays || order.warrantyDays <= 0) {
            return { success: false, error: 'Для данного заказа не предусмотрена гарантия (Refill)' };
        }

        if (!order.warrantyDays || order.warrantyDays <= 0) {
            return { success: false, error: 'Для данного заказа не предусмотрена гарантия (Refill)' };
        }

        // Check if warranty period has expired
        const warrantyExpiry = new Date(order.createdAt);
        warrantyExpiry.setDate(warrantyExpiry.getDate() + order.warrantyDays);
        if (new Date() > warrantyExpiry) {
            return { success: false, error: 'Срок гарантии на дозаправку истек' };
        }

        // --- REFILL LOCKING ---
        const metadata = (order.metadata as any) || {};
        const lastRefillAt = metadata.lastRefillAt ? new Date(metadata.lastRefillAt) : null;
        const now = new Date();

        if (lastRefillAt && now.getTime() - lastRefillAt.getTime() < 60000) {
            const waitSeconds = Math.ceil(60 - (now.getTime() - lastRefillAt.getTime()) / 1000);
            return { success: false, error: `Повторный запрос возможен через ${waitSeconds} сек. Пожалуйста, подождите.` };
        }

        const result = await ProviderService.refillOrder(orderId);

        if (result.success) {
            // Update metadata with lastRefillAt
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    metadata: {
                        ...metadata,
                        lastRefillAt: now.toISOString()
                    }
                }
            });
        }
        
        revalidatePath('/orders');
        revalidatePath('/dashboard');
        
        return result;
    } catch (error: any) {
        console.error('[RefillAction] Error:', error);
        return { success: false, error: error.message || 'Ошибка при запросе дозаправки' };
    }
}
