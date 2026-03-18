/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { CurrencyService } from '../finance/currency.service';
import { IProvider } from './base-provider';

export type GuardianCheckResult = {
    isValid: boolean;
    reason?: string;
    actualPrice?: Decimal;
    oldPrice?: Decimal;
    priceDeltaPercent?: number;
    criticalChange: boolean;
};

export class ServiceGuardian {
    /**
     * Проверяет, не изменились ли условия у провайдера для конкретной услуги.
     */
    static async verifyService(internalServiceId: string, mapping: any, providerInstance: IProvider): Promise<GuardianCheckResult> {
        try {
            // 1. Получаем сохраненную услугу провайдера из нашей БД
            const storedService = await prisma.providerService.findUnique({
                where: { id: mapping.providerServiceId },
                include: { provider: true }
            });

            if (!storedService) {
                return { isValid: false, reason: 'Stored provider service not found in DB', criticalChange: false };
            }

            // 2. Используем переданный экземпляр
            const providerServices = await providerInstance.getServices();
            const remoteService = providerServices.find(s => String(s.service) === String(storedService.externalId));

            if (!remoteService) {
                return { isValid: false, reason: 'Service not found at provider', criticalChange: true };
            }

            // 3. Проверка изменения метаданных (имя)
            if (this.isNameMismatched(storedService.name, remoteService.name)) {
                return {
                    isValid: false,
                    reason: `Service name mismatch: Expected "${storedService.name}" but got "${remoteService.name}"`,
                    criticalChange: true
                };
            }

            // 4. Проверка цены с учетом валюты
            const rates = await CurrencyService.getRates();
            const meta = storedService.provider.metadata as any;
            const providerCurrency = meta?.pricesCurrency || meta?.currency || (storedService.provider.type === 'stream-promotion' ? 'USD' : 'RUB');

            const currentRawRate = new Decimal(remoteService.rate);
            const rateToRub = rates[providerCurrency] || 1;
            const currentPriceRub = currentRawRate.mul(rateToRub);

            const storedPriceRub = storedService.rawPrice;

            const delta = currentPriceRub.minus(storedPriceRub);
            const deltaPercent = storedPriceRub.isZero() ? 0 : delta.div(storedPriceRub).mul(100).toNumber();

            // Логика порогов (User Rule: <20% - OK, >20% - Critical)
            if (deltaPercent > 20) {
                return {
                    isValid: false,
                    reason: `Price spike detected: +${deltaPercent.toFixed(1)}%`,
                    actualPrice: currentPriceRub,
                    oldPrice: storedPriceRub,
                    priceDeltaPercent: deltaPercent,
                    criticalChange: true
                };
            }

            return {
                isValid: true,
                actualPrice: currentPriceRub,
                oldPrice: storedPriceRub,
                priceDeltaPercent: deltaPercent,
                criticalChange: false
            };
        } catch (error: any) {
            console.error('[ServiceGuardian] Verification error:', error.message);
            return { isValid: false, reason: `Verification failed: ${error.message}`, criticalChange: false };
        }
    }

    /**
     * Simple check if name changed significantly
     */
    private static isNameMismatched(oldName: string, newName: string): boolean {
        const cleanOld = oldName.toLowerCase().replace(/[^a-zа-я0-9]/g, '');
        const cleanNew = newName.toLowerCase().replace(/[^a-zа-я0-9]/g, '');

        // Если имена сильно отличаются или одно содержит "DISABLED/OFF/STOP"
        if (cleanNew.includes('off') || cleanNew.includes('disabled') || cleanNew.includes('stop')) return true;

        // Простая проверка на вхождение (можно улучшить до Левенштейна)
        if (cleanOld.length > 5 && cleanNew.length > 5) {
            // Это очень грубая проверка, но она защитит от подмены "Views" на "Likes"
            const keywords = ['like', 'view', 'sub', 'follow', 'react', 'лайк', 'просмотр', 'подпис'];
            const oldType = keywords.find(k => cleanOld.includes(k));
            const newType = keywords.find(k => cleanNew.includes(k));

            if (oldType && newType && oldType !== newType) return true;
        }

        return false;
    }

    /**
   * Уведомляет администратора о незначительном изменении цены, которое мы приняли
   */
    static async notifyMinorPriceChange(internalServiceId: string, deltaPercent: number, oldPrice: Decimal, newPrice: Decimal) {
        try {
            const service = await prisma.internalService.findUnique({
                where: { id: internalServiceId },
                select: { name: true }
            });

            const msg = `⚠️ <b>ИЗМЕНЕНИЕ ЦЕНЫ (Service Guardian)</b>\n\n` +
                `🛠 Услуга: <b>${service?.name || 'Unknown'}</b>\n` +
                `📈 Рост: <code>+${deltaPercent.toFixed(1)}%</code>\n` +
                `💰 Было: ${oldPrice.toFixed(2)}₽\n` +
                `🏷 Стало: <b>${newPrice.toFixed(2)}₽</b>\n\n` +
                `<i>Заказ выполнен, наценка уменьшена. Рекомендуется обновить цены в каталоге.</i>`;

            const employees = await prisma.user.findMany({
                where: { role: 'ADMIN', tgId: { not: null } },
                select: { tgId: true }
            });

            const { bot } = await import('@/services/bot/bot-registry');
            for (const emp of employees) {
                if (emp.tgId) {
                    await bot.telegram.sendMessage(Number(emp.tgId), msg, { parse_mode: 'HTML' }).catch(() => { });
                }
            }
        } catch (err: any) {
            console.error('[ServiceGuardian] Minor notification failed:', err.message);
        }
    }

    /**
     * Отключает внутреннюю услугу и уведомляет администратора через Telegram и логи
     */
    static async disableService(internalServiceId: string, reason: string) {
        try {
            const { bot } = await import('@/services/bot/bot-registry');
            const service = await prisma.internalService.update({
                where: { id: internalServiceId },
                data: { isActive: false },
                select: { name: true, platform: true }
            });

            console.warn(`[ServiceGuardian] Service ${internalServiceId} DISABLED. Reason: ${reason}`);

            // 1. Уведомление в логи (без ID админа, так как действие системное)
            await prisma.adminLog.create({
                data: {
                    adminId: 'system',
                    action: 'SERVICE_AUTO_DISABLED',
                    targetId: internalServiceId,
                    details: `Service "${service.name}" (${service.platform}) auto-disabled. Reason: ${reason}`
                }
            });

            // 2. Уведомление в Telegram администраторам
            const employees = await prisma.user.findMany({
                where: {
                    role: { in: ['ADMIN', 'SUPPORT'] },
                    tgId: { not: null }
                },
                select: { tgId: true }
            });

            if (employees.length > 0) {
                const msg = `🚨 <b>УСЛУГА ОТКЛЮЧЕНА (Service Guardian)</b>\n\n` +
                    `🛠 Услуга: <b>${service.name}</b>\n` +
                    `🆔 ID: <code>${internalServiceId}</code>\n` +
                    `⚠️ Причина: <i>${reason}</i>\n\n` +
                    `<i>Пожалуйста, проверьте соответствие услуги у провайдера.</i>`;

                for (const emp of employees) {
                    if (emp.tgId) {
                        await bot.telegram.sendMessage(Number(emp.tgId), msg, { parse_mode: 'HTML' }).catch(() => { });
                    }
                }
            }
        } catch (err: any) {
            console.error('[ServiceGuardian] Failed to disable service or notify:', err.message);
        }
    }
}


