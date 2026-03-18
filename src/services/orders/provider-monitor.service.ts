/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { bot } from '@/services/bot/bot-registry';
import { SettingsService } from '@/services/core/settings.service';
import { PredictionService } from '@/services/users/prediction.service';
import { NotificationTemplates } from '@/bot/utils/notification-templates';

export class ProviderMonitorService {
    /**
     * Мониторинг баланса провайдеров
     */
    static async monitorProviderBalance() {
        const forecasts = await PredictionService.getProviderForecasts();
        const criticalProviders = forecasts.filter(f => f.status === 'CRITICAL');

        if (criticalProviders.length > 0) {
            const staff = await prisma.user.findMany({
                where: { role: { in: ['ADMIN', 'SUPPORT'] } },
                select: { tgId: true }
            });

            const muteUntil = await SettingsService.get('BALANCE_ALERT_MUTED_UNTIL');
            const isMuted = muteUntil && new Date(muteUntil) > new Date();

            if (staff.length > 0 && !isMuted) {
                const providerList = criticalProviders.map(p => `⚠️ <b>${p.providerName}</b> (осталось ~${p.daysLeft} дн.)`).join('\n');
                const alertMsg = NotificationTemplates.FINANCE.PROVIDER_BALANCE_CRITICAL_ADMIN(providerList);

                for (const s of staff) {
                    try {
                        await bot.telegram.sendMessage(Number(s.tgId), alertMsg, { parse_mode: 'HTML' });
                    } catch (_e) {
                        console.error(`Failed to send alert to ${s.tgId}`);
                    }
                }
            }
        }

        return forecasts;
    }
}


