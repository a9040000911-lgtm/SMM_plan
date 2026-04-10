/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { EventEmitter } from 'events';
import { LoggerService } from '@/lib/logger';
import { ServiceEvents } from '../types';

/**
 * ServiceEventBus provides a centralized, non-circular way for services to communicate.
 * It uses Node.js EventEmitter but with strict typing and error boundaries.
 */
class ServiceEventBus {
    private bus: EventEmitter;
    private logger: LoggerService;

    constructor() {
        this.bus = new EventEmitter();
        this.logger = new LoggerService('EventBus');
        
        // Potential warning for too many listeners if architecture grows too complex
        this.bus.setMaxListeners(50);
    }

    /**
     * Publishes an event to the bus.
     */
    emit<K extends keyof ServiceEvents>(event: K, payload: ServiceEvents[K]): void {
        this.logger.info(`Emitting event: [${event}]`, payload);
        this.bus.emit(event, payload);
    }

    /**
     * Subscribes to an event with an error boundary.
     */
    on<K extends keyof ServiceEvents>(event: K, handler: (payload: ServiceEvents[K]) => void | Promise<void>): void {
        this.bus.on(event, async (payload) => {
            let attempt = 0;
            const maxAttempts = 3;
            // [FIX 3.5] Retry logic for failed event handlers
            while (attempt < maxAttempts) {
                try {
                    await handler(payload);
                    return; // Success, exit retry loop
                } catch (error: any) {
                    attempt++;
                    
                    const isLastAttempt = attempt >= maxAttempts;
                    
                    this.logger[isLastAttempt ? 'error' : 'warn'](`Error in handler for event [${event}] (Attempt ${attempt}/${maxAttempts}):`, {
                        error: error.message,
                        stack: error.stack,
                        payload
                    });
                    
                    if (isLastAttempt) {
                        // If it's not a SYSTEM_ALERT event itself, emit an alert
                        if (event !== 'SYSTEM_ALERT') {
                            this.emit('SYSTEM_ALERT', {
                                level: 'ERROR',
                                message: `Event handler failure for ${event} after ${maxAttempts} attempts`,
                                details: { error: error.message }
                            });
                        }
                    } else {
                        // Exponential backoff: 1s, then 2s
                        await new Promise(res => setTimeout(res, attempt * 1000));
                    }
                }
            }
        });
    }

    /**
     * Clears all listeners (useful for testing).
     */
    reset(): void {
        this.bus.removeAllListeners();
    }
}

// Singleton instance
export const eventBus = new ServiceEventBus();


