'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { FailoverService } from '@/services/providers/failover.service';
import { revalidatePath } from 'next/cache';
import { processManualRefund, initiateOrder } from '@/services/orders';
import { OrderSyncService } from '@/services/orders/order-sync.service';
import { PricingService } from '@/services/finance';
import { getAdminSession } from '@/utils/admin-session';

/**
 * Синхронизирует конкретный заказ с API провайдера
 */
export async function syncOrderAction(orderId: number) {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT', 'SEO'].includes(session.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await OrderSyncService.syncAllActive([orderId]);
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Ручной возврат средств за заказ на баланс пользователя
 */
export async function refundOrderAction(orderId: number) {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await processManualRefund(orderId, 'INTERNAL', false, session.id);
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Принудительное переключение заказа на другого провайдера
 */
export async function failoverOrderAction(orderId: number) {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const result = await FailoverService.failoverOrder(orderId, session.id);
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');

        if (result && result.success) {
            return { success: true, newExternalId: result.newExternalId };
        } else {
            return { success: false, error: 'Резервный провайдер отклонил запрос или недоступен. Проверьте логи.' };
        }
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Массовое обновление статусов
 */
export async function bulkUpdateStatusAction(orderIds: number[]) {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT', 'SEO'].includes(session.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await OrderSyncService.syncAllActive(orderIds);
        revalidatePath('/admin/orders');
        return { success: true, count: orderIds.length };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Массовая отмена и возврат
 */
export async function bulkCancelOrdersAction(orderIds: number[]) {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        let count = 0;
        for (const id of orderIds) {
            try {
                await processManualRefund(id, 'INTERNAL', false, session.id);
                count++;
            } catch (err) {
                console.error(`Bulk cancel failed for ${id}:`, err);
            }
        }
        revalidatePath('/admin/orders');
        return { success: true, count };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Поиск пользователей для ручного заказа
 */
export async function searchUsersAction(query: string) {
    const session = await getAdminSession();
    if (!session) return [];

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { tgId: query.match(/^\d+$/) ? BigInt(query) : undefined },
                { username: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
                { id: query.length === 36 ? query : undefined } // Keep UUID check for User
            ]
        },
        take: 10,
        select: {
            id: true,
            tgId: true,
            username: true,
            balance: true,
            projectId: true
        }
    });

    return users.map(u => ({
        ...u,
        tgId: u.tgId ? u.tgId.toString() : null,
        balance: u.balance.toNumber()
    }));
}

/**
 * Поиск услуг для ручного заказа
 */
export async function searchServicesAction(query: string) {
    const session = await getAdminSession();
    if (!session) return [];

    const svcs = await prisma.internalService.findMany({
        where: {
            OR: [
                { name: { contains: query, mode: 'insensitive' } },
                { id: { contains: query, mode: 'insensitive' } } // InternalService id is string
            ],
            isActive: true
        },
        take: 10
    });

    return svcs.map(s => ({
        ...s,
        pricePer1000: s.pricePer1000.toNumber()
    }));
}

/**
 * Расчет цены для ручного заказа
 */
export async function calculateOrderPriceAction(userId: string, serviceId: string, qty: number) {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');

    const details = await PricingService.calculateOrderDetails(userId, serviceId, qty);
    return {
        basePrice: details.basePrice.toNumber(),
        finalPrice: details.finalPrice.toNumber(),
        discountAmount: details.discountAmount.toNumber(),
        discountPercent: details.discountPercent
    };
}

/**
 * Создание ручного заказа админом
 */
export async function createManualOrderAction(data: {
    userId: string,
    serviceId: string,
    link: string,
    qty: number,
    projectId: string | null
}) {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const details = await PricingService.calculateOrderDetails(data.userId, data.serviceId, data.qty, data.projectId || undefined);
        const service = await prisma.internalService.findUnique({ where: { id: data.serviceId } });

        if (!service) throw new Error('Service not found');

        const order = await initiateOrder({
            userId: data.userId,
            serviceId: data.serviceId,
            projectId: data.projectId,
            link: data.link,
            qty: data.qty,
            totalPrice: details.finalPrice,
            discountAmount: details.discountAmount,
            isManual: true, // Флаг ручного заказа
            costPrice: service.lastProviderPrice ? service.lastProviderPrice.mul(data.qty).div(1000) : undefined
        });

        revalidatePath('/admin/orders');
        return { success: true, orderId: order.id };
    } catch (e: any) {
        console.error('Manual order creation error:', e);
        return { success: false, error: e.message };
    }
}

/**
 * Получает список "зависших" заказов для Command Center
 */
export async function getStuckOrdersAction() {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const stuck = await prisma.order.findMany({
            where: {
                status: 'PROCESSING',
                metadata: {
                    path: ['possiblyCreated'],
                    equals: true
                }
            },
            include: { user: true, internalService: true },
            orderBy: { createdAt: 'desc' }
        });

        return {
            success: true,
            orders: stuck.map(o => ({
                id: o.id,
                username: o.user.username || o.user.tgId?.toString() || 'User',
                serviceName: o.internalService.name,
                stuckAt: (o.metadata as any)?.stuckAt,
                error: (o.metadata as any)?.lastQueueError,
                link: o.link,
                quantity: o.quantity
            }))
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

/**
 * Разрешает "зависший" заказ: подтверждает его с externalId или отменяет с возвратом
 */
export async function resolveStuckOrderAction(orderId: number, action: 'CONFIRM' | 'REFUND', externalId?: string) {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { user: true }
        });

        if (!order) throw new Error('Заказ не найден');

        if (action === 'CONFIRM') {
            if (!externalId) throw new Error('externalId обязателен для подтверждения');

            await prisma.order.update({
                where: { id: orderId },
                data: {
                    externalId,
                    status: 'IN_PROGRESS',
                    metadata: {} // Очищаем флаги ожидания проверки
                }
            });

            await prisma.adminLog.create({
                data: {
                    adminId: session.id,
                    action: 'ORDER_STUCK_CONFIRM',
                    details: `Stuck order #${orderId} confirmed manually with externalId: ${externalId}`
                }
            });
        } else {
            // REFUND
            await processManualRefund(orderId, 'INTERNAL', false, session.id);

            await prisma.adminLog.create({
                data: {
                    adminId: session.id,
                    action: 'ORDER_STUCK_REFUND',
                    details: `Stuck order #${orderId} refunded manually after verification`
                }
            });
        }

        revalidatePath('/admin/orders');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
