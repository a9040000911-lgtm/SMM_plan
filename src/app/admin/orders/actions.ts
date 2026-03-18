'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminServices } from '@/services/admin/registry';
import { AdminContext } from '@/services/types';

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

/**
 * Синхронизирует конкретный заказ с API провайдера
 */
export async function syncOrderAction(orderId: number) {
    const ctx = await getCtx();
    if (!['ADMIN', 'SUPPORT', 'SEO'].includes(ctx.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    const result = await AdminServices.orders.syncOrder(ctx, orderId);
    if (result.success) {
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');
        return { success: true };
    } else {
        return { success: false, error: result.error.message };
    }
}

/**
 * Ручной возврат средств за заказ на баланс пользователя
 */
export async function refundOrderAction(orderId: number) {
    const ctx = await getCtx();
    if (!['ADMIN', 'SUPPORT'].includes(ctx.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    const result = await AdminServices.orders.refundOrder(ctx, orderId);
    if (result.success) {
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');
        return { success: true };
    } else {
        return { success: false, error: result.error.message };
    }
}

/**
 * Принудительное переключение заказа на другого провайдера
 */
export async function failoverOrderAction(orderId: number) {
    const ctx = await getCtx();
    if (ctx.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    const result = await AdminServices.orders.failoverOrder(ctx, orderId);
    if (result.success) {
        revalidatePath(`/admin/orders/${orderId}`);
        revalidatePath('/admin/orders');
        const failResult = result.data;
        if (failResult && failResult.success) {
            return { success: true, newExternalId: failResult.newExternalId };
        } else {
            return { success: false, error: 'Резервный провайдер отклонил запрос или недоступен. Проверьте логи.' };
        }
    } else {
        return { success: false, error: result.error.message };
    }
}

/**
 * Массовое обновление статусов
 */
export async function bulkUpdateStatusAction(orderIds: number[]) {
    const ctx = await getCtx();
    if (!['ADMIN', 'SUPPORT', 'SEO'].includes(ctx.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    // Reuse syncOrder for simplify or add bulkSync to service
    await Promise.all(orderIds.map(id => AdminServices.orders.syncOrder(ctx, id)));
    revalidatePath('/admin/orders');
    return { success: true, count: orderIds.length };
}

/**
 * Массовая отмена и возврат
 */
export async function bulkCancelOrdersAction(orderIds: number[]) {
    const ctx = await getCtx();
    if (ctx.role !== 'ADMIN') {
        return { success: false, error: 'Unauthorized' };
    }

    const result = await AdminServices.orders.bulkCancelOrders(ctx, { orderIds });
    if (result.success) {
        revalidatePath('/admin/orders');
        return { success: true, count: result.data };
    } else {
        return { success: false, error: result.error.message };
    }
}

/**
 * Поиск пользователей для ручного заказа
 */
export async function searchUsersAction(query: string) {
    const ctx = await getCtx();
    const result = await AdminServices.users.searchUsers(ctx, query);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

/**
 * Поиск услуг для ручного заказа
 */
export async function searchServicesAction(query: string) {
    const ctx = await getCtx();
    const result = await AdminServices.services.searchServices(ctx, query);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

/**
 * Расчет цены для ручного заказа
 */
export async function calculateOrderPriceAction(userId: string, serviceId: string, qty: number) {
    const ctx = await getCtx();
    const result = await AdminServices.orders.calculateOrderPrice(ctx, userId, serviceId, qty);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
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
    const ctx = await getCtx();
    if (!['ADMIN', 'SUPPORT'].includes(ctx.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    const result = await AdminServices.orders.createManualOrder(ctx, data);
    if (result.success) {
        revalidatePath('/admin/orders');
        return { success: true, orderId: result.data.orderId };
    } else {
        return { success: false, error: result.error.message };
    }
}

/**
 * Получает список "зависших" заказов для Command Center
 */
export async function getStuckOrdersAction() {
  try {
    const ctx = await getCtx();
    const result = await AdminServices.orders.getStuckOrders(ctx);
    if (!result.success) return { success: false, error: result.error.message };
    return { success: true, orders: result.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Разрешает "зависший" заказ: подтверждает его с externalId или отменяет с возвратом
 */
export async function resolveStuckOrderAction(orderId: number, action: 'CONFIRM' | 'REFUND', externalId?: string) {
  try {
    const ctx = await getCtx();
    const result = await AdminServices.orders.resolveStuckOrder(ctx, orderId, action, externalId);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/orders');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


