/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { AdminServiceResult, AdminContext } from '@/services/types';
import { BaseAdminService } from "./base-admin.service";
import { BatchCancelOrdersContract } from './contracts';

export class AdminOrderService extends BaseAdminService {
    private static instance: AdminOrderService;

    private constructor() {
        super('AdminOrder');
    }

    public static getInstance(): AdminOrderService {
        if (!AdminOrderService.instance) {
            AdminOrderService.instance = new AdminOrderService();
        }
        return AdminOrderService.instance;
    }

    /**
     * Gets old pending/processing orders (Support monitoring).
     */
    async getOldPendingOrders(ctx: AdminContext): Promise<AdminServiceResult<any[]>> {
        try {
            const oneHourAgo = new Date(Date.now() - 3600000);
            const where: any = {
                status: { in: ['PENDING', 'PROCESSING'] },
                createdAt: { lte: oneHourAgo }
            };

            if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            const stuck = await prisma.order.findMany({
                where,
                include: { user: true, internalService: true },
                orderBy: { createdAt: 'asc' },
                take: 10
            });

            return this.success(stuck);
        } catch (error: any) {
            return this.error('OLD_ORDERS_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Gets stuck orders (e.g., possiblyCreated metadata).
     */
    async getStuckOrders(ctx: AdminContext): Promise<AdminServiceResult<any[]>> {
        try {
            const where: any = {
                status: 'PROCESSING',
                metadata: { path: ['possiblyCreated'], equals: true }
            };

            if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            const stuck = await prisma.order.findMany({
                where,
                include: { user: true, internalService: true },
                orderBy: { createdAt: 'desc' }
            });

            return this.success(stuck.map(o => ({
                id: o.id,
                username: o.user.username || o.user.tgId?.toString() || 'User',
                serviceName: o.internalService.name,
                stuckAt: (o.metadata as any)?.stuckAt,
                error: (o.metadata as any)?.lastQueueError,
                link: o.link,
                quantity: o.quantity
            })));
        } catch (error: any) {
            return this.error('STUCK_ORDERS_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Resolves a stuck order.
     */
    async resolveStuckOrder(ctx: AdminContext, orderId: number, action: 'CONFIRM' | 'REFUND', externalId?: string): Promise<AdminServiceResult<any>> {
        try {
            const oldOrder = await prisma.order.findUnique({ where: { id: orderId } });
            if (!oldOrder) throw new Error('Order not found');
            await this.checkProjectAuth(ctx, oldOrder.projectId);

            let updated;
            if (action === 'CONFIRM') {
                if (!externalId) throw new Error('externalId required');
                updated = await prisma.order.update({
                    where: { id: orderId },
                    data: { externalId, status: 'IN_PROGRESS', metadata: {} }
                });
                await this.logAction(ctx, 'ORDER_STUCK_CONFIRM', `Stuck order #${orderId} confirmed with ${externalId}`, orderId.toString(), undefined, oldOrder, updated, oldOrder.projectId);
            } else {
                const { processManualRefund } = await import('@/services/orders');
                await processManualRefund(orderId, 'INTERNAL', false, ctx.userId);
                updated = await prisma.order.findUnique({ where: { id: orderId } });
                await this.logAction(ctx, 'ORDER_STUCK_REFUND', `Stuck order #${orderId} refunded manually`, orderId.toString(), undefined, oldOrder, updated, oldOrder.projectId);
            }
            return this.success({ orderId });
        } catch (error: any) {
            return this.error('ORDER_RESOLVE_FAILED', error.message, error);
        }
    }

    /**
     * Synchronizes a specific order with provider.
     */
    async syncOrder(ctx: AdminContext, orderId: number): Promise<AdminServiceResult<void>> {
        try {
            const order = await prisma.order.findUnique({ where: { id: orderId }, select: { projectId: true } });
            if (!order) throw new Error('Order not found');
            await this.checkProjectAuth(ctx, order.projectId);

            const { OrderSyncService } = await import('@/services/orders/order-sync.service');
            await OrderSyncService.syncAllActive([orderId]);
            await this.logAction(ctx, 'REORDER', `Reordered order ${orderId}`, orderId.toString(), undefined, null, null, order.projectId);
            return this.success(undefined);
        } catch (error: any) {
            return this.error('ORDER_SYNC_FAILED', error.message, error);
        }
    }

    /**
     * Manually refunds an order.
     */
    async refundOrder(ctx: AdminContext, orderId: number): Promise<AdminServiceResult<void>> {
        try {
            const oldOrder = await prisma.order.findUnique({ where: { id: orderId } });
            if (!oldOrder) throw new Error('Order not found');
            await this.checkProjectAuth(ctx, oldOrder.projectId);

            const { processManualRefund } = await import('@/services/orders');
            await processManualRefund(orderId, 'INTERNAL', false, ctx.userId);
            const newOrder = await prisma.order.findUnique({ where: { id: orderId } });
            await this.logAction(ctx, 'REFUND_ORDER', `Refunded order ${orderId}`, orderId.toString(), undefined, oldOrder, newOrder, oldOrder.projectId);
            return this.success(undefined);
        } catch (error: any) {
            return this.error('ORDER_REFUND_FAILED', error.message, error);
        }
    }

    /**
     * Marks an order for failover.
     */
    async failoverOrder(ctx: AdminContext, orderId: number): Promise<AdminServiceResult<any>> {
        try {
            const order = await prisma.order.findUnique({ where: { id: orderId }, select: { projectId: true } });
            if (!order) throw new Error('Order not found');
            await this.checkProjectAuth(ctx, order.projectId);

            const { FailoverService } = await import('@/services/providers/failover.service');
            const result = await FailoverService.failoverOrder(orderId, ctx.userId);
            await this.logAction(ctx, 'UPDATE_ORDER_INTERNAL', `Updated order ${orderId} status/id`, orderId.toString());
            return this.success(result);
        } catch (error: any) {
            return this.error('ORDER_FAILOVER_FAILED', error.message, error);
        }
    }

    /**
     * Bulk cancels orders with refund.
     */
    /**
     * Bulk cancels orders with refund.
     */
    async bulkCancelOrders(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<number>> {
        try {
            const data = BatchCancelOrdersContract.parse(rawData);
            const { processManualRefund } = await import('@/services/orders');
            let count = 0;
            for (const id of data.orderIds) {
                try {
                    await processManualRefund(id, 'INTERNAL', false, ctx.userId);
                    count++;
                } catch (err) {
                    this.logger.error(`Bulk cancel failed for order #${id}`, err);
                }
            }
            await this.logAction(ctx, 'BULK_CANCEL_ORDERS', `Bulk cancelled ${count} orders`);
            return this.success(count);
        } catch (error: any) {
            return this.error('BULK_CANCEL_FAILED', error.message, error);
        }
    }

    /**
     * Calculates manual order price.
     */
    async calculateOrderPrice(ctx: AdminContext, userId: string, serviceId: string, qty: number, projectId?: string): Promise<AdminServiceResult<any>> {
        try {
            const { PricingService } = await import('@/services/finance');
            const details = await PricingService.calculateOrderDetails(userId, serviceId, qty, projectId);
            return this.success({
                basePrice: details.basePrice.toNumber(),
                finalPrice: details.finalPrice.toNumber(),
                discountAmount: details.discountAmount.toNumber(),
                discountPercent: details.discountPercent
            });
        } catch (error: any) {
            return this.error('PRICE_CALC_FAILED', error.message, error);
        }
    }

    /**
     * Creates a manual order.
     */
    /**
     * Creates a manual order.
     */
    async createManualOrder(ctx: AdminContext, data: any): Promise<AdminServiceResult<any>> {
        try {
            const { initiateOrder } = await import('@/services/orders');
            const { PricingService } = await import('@/services/finance');
            
            // 1. Verify User Ownership & Strict Project Mapping (Prevent Cross-Project IDOR)
            const targetUser = await prisma.user.findUnique({
                where: { id: data.userId },
                select: { projectId: true }
            });

            if (!targetUser) {
                return this.error('NOT_FOUND', 'Пользователь не найден');
            }

            if (!this.isAllowed(ctx, targetUser.projectId)) {
                return this.error('FORBIDDEN', `У вас нет доступа к проекту пользователя: ${targetUser.projectId}`);
            }

            // Enforce user's actual project ID over the potentially spoofed payload
            const actualProjectId = targetUser.projectId;

            const details = await PricingService.calculateOrderDetails(data.userId, data.serviceId, data.qty, actualProjectId);

            const order = await initiateOrder({
                userId: data.userId,
                serviceId: data.serviceId,
                projectId: actualProjectId,
                link: data.link,
                qty: data.qty,
                totalPrice: details.finalPrice,
                discountAmount: details.discountAmount,
                isManual: true,
            });
            await this.logAction(ctx, 'CREATE_MANUAL_ORDER', `Created manual order #${order.id} for user ${data.userId}`, order.id.toString(), undefined, null, order, actualProjectId);
            return this.success({ orderId: order.id });
        } catch (error: any) {
            return this.error('ORDER_CREATE_FAILED', error.message, error);
        }
    }

    /**
     * Gets latest orders for a user (Support view).
     */
    async getSupportLatestUserOrders(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any[]>> {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId }, select: { projectId: true } });
            if (user) await this.checkProjectAuth(ctx, user.projectId);

            const orders = await prisma.order.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: { internalService: true }
            });
            return this.success(orders.map(o => ({
                id: o.id,
                serviceName: o.internalService.name,
                status: o.status,
                totalPrice: o.totalPrice.toNumber(),
                amount: o.quantity,
                link: o.link,
                createdAt: o.createdAt.toISOString()
            })));
        } catch (error: any) {
            return this.error('LATEST_ORDERS_FETCH_FAILED', error.message, error);
        }
    }
}

export const adminOrderService = AdminOrderService.getInstance();



