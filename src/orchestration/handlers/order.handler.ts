/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { eventBus } from '@/services/core/event-bus';
import { LoggerService } from '@/lib/logger';

export class OrderOrchestrator {
    private static logger = new LoggerService('OrderOrchestrator');

    static init() {
        eventBus.on('ORDER_COMPLETED', async (payload) => {
            this.handleOrderCompleted(payload);
        });

        eventBus.on('ORDER_FAILED', async (payload) => {
            this.handleOrderFailed(payload);
        });
    }

    private static async handleOrderCompleted(payload: any) {
        this.logger.info(`Orchestration: Order ${payload.orderId} COMPLETED.`);
        // Note: Loyalty points are currently handled by LoyaltyService events if any, 
        // or we can add post-processing here (e.g., sending achievement notification).
    }

    private static async handleOrderFailed(payload: any) {
        this.logger.error(`Orchestration: Order ${payload.orderId} FAILED: ${payload.reason}`, { orderId: payload.orderId });
        
        try {
            // Check if automatic refund is needed
            // const { OrderRefundService } = await import('@/services/orders/order-refund.service');
            // await OrderRefundService.processAutoRefund(payload.orderId);
        } catch (_e) {
            this.logger.error('Failed to import OrderRefundService for failure handling');
        }
    }
}


