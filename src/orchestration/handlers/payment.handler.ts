/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { eventBus } from '@/services/core/event-bus';
import { LoggerService } from '@/lib/logger';
import { Decimal } from 'decimal.js';
import { TransactionGuard } from '@/services/security/transaction-guard';

export class PaymentOrchestrator {
    private static logger = new LoggerService('PaymentOrchestrator');

    /**
     * Initializes the listener for PAYMENT_CONFIRMED events.
     */
    static init() {
        eventBus.on('PAYMENT_CONFIRMED', async (payload) => {
            this.handlePaymentConfirmed(payload);
        });
    }

    private static async handlePaymentConfirmed(payload: any) {
        this.logger.info(`Orchestrating PAYMENT_CONFIRMED for tx: ${payload.txId}`, { txId: payload.txId });

        try {
            // 1. DYNAMIC IMPORTS to avoid cycles and early resolution issues
            const { OrderActivationService } = await import('@/services/orders/order-activation.service');
            const { OrderQueueService } = await import('@/services/orders/order-queue.service');
            const { PricingService } = await import('@/services/finance/pricing.service');

            // 2. PAYLOAD SECURITY CHECK (Step 4 of Roadmap)
            let meta = payload.orderMetadata as any;
            if (typeof meta === 'string') {
                try { meta = JSON.parse(meta); } catch(_e) { return; }
            }
            if (!meta) return;

            const verification = await TransactionGuard.verify(
                payload.txId, 
                payload.userId, 
                payload.amount, 
                meta.projectId || null
            );

            if (!verification.valid) {
                this.logger.error(`Security alert: PAYMENT_CONFIRMED ignored due to verification failure: ${verification.reason}`, { txId: payload.txId });
                return;
            }

            // 3. ORCHESTRATION LOGIC
            const processActivation = async (oid: string | number) => {
                const orderId = typeof oid === 'string' ? parseInt(oid) : oid;
                if (isNaN(orderId)) return;

                const existingOrder = await prisma.order.findUnique({
                    where: { id: orderId },
                    include: { internalService: true }
                });

                if (existingOrder && existingOrder.status === 'AWAITING_PAYMENT') {
                    const costPrice = existingOrder.internalService.lastProviderPrice
                        ? new Decimal(existingOrder.internalService.lastProviderPrice as any).mul(existingOrder.quantity).div(1000)
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
                // Quick Order Case (re-calculating price for safety)
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
                    costPrice: service.lastProviderPrice ? new Decimal(service.lastProviderPrice as any).mul(meta.qty).div(1000) : undefined,
                    discountAmount: details.discountAmount,
                    promoId: meta.promoId || undefined,
                    isDripFeed: !!meta.dripFeed,
                    dripFeed: meta.dripFeed
                });
            }

            // 4. TRIGGER ASYNC QUEUE
            OrderQueueService.processPendingOrders().catch(_e => this.logger.error('Error in deferred queue processing:', _e));

        } catch (error: any) {
            this.logger.error('Failed to process PAYMENT_CONFIRMED orchestration:', error.message || error);
        }
    }
}


