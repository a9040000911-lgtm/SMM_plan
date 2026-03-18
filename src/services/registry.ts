/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

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
        const { PaymentOrchestrator } = await import('@/orchestration/handlers/payment.handler');
        PaymentOrchestrator.init();
    }

    /**
     * Wires Order related events.
     */
    private static async wireOrderEvents() {
        const { OrderOrchestrator } = await import('@/orchestration/handlers/order.handler');
        OrderOrchestrator.init();
    }

    /**
     * Wires generic system events.
     */
    private static async wireSystemEvents() {
        const { SystemOrchestrator } = await import('@/orchestration/handlers/system.handler');
        SystemOrchestrator.init();
    }
}


