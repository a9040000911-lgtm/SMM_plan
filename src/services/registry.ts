/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { eventBus } from './core/event-bus';
import { LoggerService } from '@/lib/logger';

/**
 * ServiceRegistry coordinates the initialization of all services in the correct order.
 * It also wires up event listeners to break circular dependencies.
 */
export class ServiceRegistry {
    private static isInitialized = false;
    private static logger = new LoggerService('ServiceRegistry');

    /**
     * Initializes the service layer. 
     * This should be called once during application startup (e.g., in a main entry point or a root layouts).
     */
    static async init() {
        if (this.isInitialized) return;
        
        this.logger.info('Initializing SMMPlan Service Layer (Phase 11: Event-Driven)...');

        try {
            // 1. Register Event Listeners (WIRING)
            // This is where we break cycles. Instead of Service A calling Service B,
            // we register here that B listens to A's events.
            
            await this.wireFinanceEvents();
            await this.wireOrderEvents();
            await this.wireSystemEvents();

            this.isInitialized = true;
            this.logger.info('Service Layer successfully initialized.');
        } catch (error: any) {
            this.logger.error('FATAL: Service Layer initialization failed:', error);
            throw error;
        }
    }

    /**
     * Wires Finance related events.
     */
    /**
     * Wires Finance related events.
     */
    private static async wireFinanceEvents() {
        eventBus.on('PAYMENT_CONFIRMED', async (payload) => {
            this.logger.info('Wiring: Received PAYMENT_CONFIRMED. Orchestrating order activation...', { txId: payload.txId });
            
            try {
                console.log('[TRACE] Starting orchestration for tx:', payload.txId);
                const { OrderActivationService } = await import('@/services/orders/order-activation.service');
                console.log('[TRACE] OrderActivationService imported');
                const { OrderQueueService } = await import('@/services/orders/order-queue.service');
                console.log('[TRACE] OrderQueueService imported');
                const { PricingService } = await import('@/services/finance/pricing.service');
                console.log('[TRACE] PricingService imported');
                const { prisma } = await import('@/lib/prisma');
                console.log('[TRACE] Prisma imported');
                const { Decimal } = await import('decimal.js');
                console.log('[TRACE] Decimal imported');

                let meta = payload.orderMetadata as any;
                if (typeof meta === 'string') {
                    try { meta = JSON.parse(meta); } catch(e) { console.error('[TRACE] Meta parse fail:', e); return; }
                }
                if (!meta) { console.log('[TRACE] No meta found'); return; }

                console.log('[TRACE] Meta content:', JSON.stringify(meta));
                const processActivation = async (oid: string | number) => {
                    const orderId = typeof oid === 'string' ? parseInt(oid) : oid;
                    if (isNaN(orderId)) return;

                    const existingOrder = await prisma.order.findUnique({
                        where: { id: orderId },
                        include: { internalService: true }
                    });

                    if (existingOrder && existingOrder.status === 'AWAITING_PAYMENT') {
                        const costPrice = existingOrder.internalService.lastProviderPrice
                            ? (existingOrder.internalService.lastProviderPrice as any).mul(existingOrder.quantity).div(1000)
                            : new Decimal(0);

                        await prisma.order.update({
                            where: { id: orderId },
                            data: {
                                status: 'PENDING',
                                costPrice: costPrice
                            }
                        });

                        this.logger.info(`Order ${orderId} activated from AWAITING_PAYMENT status.`);
                    }
                };

                if (meta.orderIds && Array.isArray(meta.orderIds)) {
                    for (const oid of meta.orderIds) {
                        await processActivation(oid);
                    }
                } else if (meta.orderId) {
                    await processActivation(meta.orderId);
                } else if (meta.serviceId && meta.qty && meta.link) {
                    // Quick Order Case
                    const service = await prisma.internalService.findUnique({ where: { id: String(meta.serviceId) } });
                    if (!service) return;

                    const details = await PricingService.calculateOrderDetails(payload.userId, service.id, Number(meta.qty));

                    await OrderActivationService.initiateOrder({
                        userId: payload.userId,
                        serviceId: service.id,
                        projectId: meta.projectId || null,
                        link: meta.link,
                        qty: meta.qty,
                        totalPrice: new Decimal(payload.amount),
                        costPrice: service.lastProviderPrice ? (service.lastProviderPrice as any).mul(meta.qty).div(1000) : undefined,
                        discountAmount: details.discountAmount,
                        promoId: meta.promoId || undefined,
                        isDripFeed: !!meta.dripFeed,
                        dripFeed: meta.dripFeed
                    });
                }

                // Trigger the queue processing
                OrderQueueService.processPendingOrders().catch(e => this.logger.error('Error in deferred queue processing:', e));

            } catch (error: any) {
                this.logger.error('Failed to process PAYMENT_CONFIRMED orchestration:', error);
            }
        });
    }

    /**
     * Wires Order related events.
     */
    private static async wireOrderEvents() {
        eventBus.on('ORDER_COMPLETED', async (payload) => {
            this.logger.info(`Wiring: Order ${payload.orderId} COMPLETED.`);
            // Future: Trigger loyalty reward points or notifications
        });

        eventBus.on('ORDER_FAILED', async (payload) => {
            this.logger.error(`Wiring: Order ${payload.orderId} FAILED: ${payload.reason}`);
            // Future: Trigger automatic refund or support ticket
        });
    }

    /**
     * Wires generic system events.
     */
    private static async wireSystemEvents() {
        eventBus.on('SYSTEM_ALERT', (payload) => {
            if (payload.level === 'ERROR') {
                this.logger.error('CRITICAL SYSTEM ALERT:', payload);
            } else {
                this.logger.warn('SYSTEM ALERT:', payload);
            }
        });
    }
}
