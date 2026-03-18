/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { eventBus } from '@/services/core/event-bus';
import { LoggerService } from '@/lib/logger';
import { ConfigService } from '@/services/core/config.service';

export class SystemOrchestrator {
    private static logger = new LoggerService('SystemOrchestrator');

    static init() {
        eventBus.on('SYSTEM_ALERT', async (payload) => {
            if (payload.level === 'ERROR') {
                this.logger.error('CRITICAL SYSTEM ALERT:', payload);
                await this.notifyAdmins(payload);
            } else {
                this.logger.warn('SYSTEM ALERT:', payload);
            }
        });
    }

    private static async notifyAdmins(_payload: any) {
        try {
            const config = await ConfigService.getTelegramConfig();
            if (config?.adminId) {
                // Future: Use specific bot for system alerts if needed
                // For now use default bot
                // await BotRegistry.get().telegram.sendMessage(...)
            }
        } catch (e) {
            this.logger.error('Failed to notify admins about system alert', e);
        }
    }
}


