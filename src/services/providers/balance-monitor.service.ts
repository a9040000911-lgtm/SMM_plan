/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export class BalanceMonitorService {
    /**
     * Проверяет и логирует балансы всех активных провайдеров.
     * Также пытается автоматически обнаружить внешние пополнения.
     */
    static async checkAndLogAllBalances() {
        const { ProviderService } = await import('./provider.service');
        const providers = await prisma.provider.findMany({ where: { isEnabled: true, NOT: { name: { startsWith: '[MOCK]' } } } });

        for (const provider of providers) {
            const instance = await ProviderService.getInstance(provider.id);
            if (!instance) continue;

            try {
                const { balance } = await instance.getBalance();
                const newBalance = new Decimal(balance);

                const lastLog = await prisma.providerBalanceLog.findFirst({
                    where: { providerId: provider.id },
                    orderBy: { createdAt: 'desc' }
                });

                if (lastLog) {
                    const oldBalance = lastLog.balance;
                    const delta = newBalance.minus(oldBalance);

                    if (delta.greaterThan(0)) {
                        await this.detectExternalTopUp(provider, lastLog.createdAt, delta);
                    }
                }

                await prisma.providerBalanceLog.create({
                    data: { providerId: provider.id, balance: newBalance },
                });
            } catch (error: any) {
                console.error(`[BalanceMonitor] ${provider.name} update failed:`, error.message);
            }
        }
    }

    /**
     * Пытается определить, было ли пополнение баланса внешним (не через нашу систему).
     */
    private static async detectExternalTopUp(provider: any, since: Date, delta: Decimal) {
        const refundedOrders = await prisma.order.findMany({
            where: {
                providerName: provider.name,
                status: { in: ['CANCELED', 'PARTIAL'] },
                updatedAt: { gte: since }
            },
            select: { costPrice: true, refundedAmount: true }
        });

        const expectedRefund = refundedOrders.reduce((acc, o) => {
            const amount = o.refundedAmount?.toNumber() || o.costPrice?.toNumber() || 0;
            return acc.plus(amount);
        }, new Decimal(0));

        const manualPayments = await prisma.providerPayment.findMany({
            where: {
                providerId: provider.id,
                createdAt: { gte: since },
                type: { in: ['REFUND', 'ADJUSTMENT', 'TOPUP'] }
            }
        });

        const manualTopUps = manualPayments.reduce((acc, p) => acc.plus(p.amount), new Decimal(0));

        const unexplainedIncrease = delta.minus(expectedRefund.plus(manualTopUps));

        const meta = provider.metadata as any;
        const threshold = (meta?.balanceCurrency || meta?.currency) === 'USD' ? 10 : 1000;

        if (unexplainedIncrease.toNumber() > threshold) {
            console.log(`[BalanceMonitor] Auto-detected TopUp for ${provider.name}: +${unexplainedIncrease.toFixed(2)}`);

            await prisma.providerPayment.create({
                data: {
                    providerId: provider.id,
                    amount: unexplainedIncrease,
                    type: 'TOPUP',
                    description: `Auto-detected Top Up (Unexplained balance increase)`,
                    createdBy: 'system'
                }
            });
        }
    }

    /**
     * Проверяет балансы на критические уровни и отправляет уведомления в Telegram.
     */
    static async checkBalancesForAlerts() {
        const mutedUntil = await prisma.settings.findFirst({
            where: { key: 'BALANCE_ALERT_MUTED_UNTIL', projectId: null }
        });
        if (mutedUntil && new Date(mutedUntil.value) > new Date()) return;

        const rates = await import('@/services/finance/currency.service').then(m => m.CurrencyService.getRates());
        const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
        const { bot } = await import('@/services/bot/bot-registry');
        const { Markup } = await import('telegraf');
        const { redis } = await import('@/lib/redis');

        const employees = await prisma.user.findMany({
            where: { role: { in: ['ADMIN', 'SUPPORT', 'SEO'] }, tgId: { not: null } },
            select: { tgId: true }
        });

        const { ProviderService } = await import('./provider.service');

        for (const provider of providers) {
            const instance = await ProviderService.getInstance(provider.id);
            if (!instance) continue;

            try {
                const { balance } = await instance.getBalance();
                const balanceNum = parseFloat(balance.toString());
                const thresholdRUB = (provider as any).balanceThreshold ? parseFloat((provider as any).balanceThreshold.toString()) : 1000;

                const p = provider as any;
                const currency = (p.pricesCurrency && p.pricesCurrency !== 'RUB') ? p.pricesCurrency : (p.balanceCurrency || p.metadata?.balanceCurrency || p.metadata?.currency || 'RUB');

                let thresholdConverted = thresholdRUB;
                if (currency === 'USD') thresholdConverted = thresholdRUB / (rates.USD || 92);
                else if (currency === 'EUR') thresholdConverted = thresholdRUB / (rates.EUR || 100);

                if (balanceNum < thresholdConverted) {
                    await this.sendBalanceAlert(provider, balanceNum, thresholdConverted, thresholdRUB, currency, employees, bot, Markup, redis);
                }

                // Financial Security Check
                await this.checkFinancialSecurity(provider, employees, bot, redis);

            } catch (error: any) {
                console.error(`[BalanceMonitor] Alert check failed for ${provider.name}:`, error.message);
            }
        }
    }

    private static async sendBalanceAlert(provider: any, balance: number, threshold: number, thresholdRUB: number, currency: string, employees: any[], bot: any, Markup: any, redis: any) {
        const today = new Date().toISOString().split('T')[0];
        const key = `alert:${provider.id}:${today}`;
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, 86400);

        if (count <= 3) {
            const symbol = currency === 'USD' ? '$' : (currency === 'EUR' ? '€' : '₽');
            const thresholdInfo = currency !== 'RUB' ? `${threshold.toFixed(2)}${symbol} (~${thresholdRUB}₽)` : `${thresholdRUB}${symbol}`;

            const msg = `⚠️ <b>НИЗКИЙ БАЛАНС: ${provider.name}</b>\n\n` +
                `💰 Текущий баланс: <b>${balance.toFixed(2)}${symbol}</b>\n` +
                `📉 Порог: ${thresholdInfo}\n\n` +
                `<i>Пожалуйста, пополните счет провайдера (${count}/3 уведомление).</i>`;

            const keyboard = Markup.inlineKeyboard([[Markup.button.callback('🔕 Не уведомлять 6 часов', 'admin_mute_balance')]]);

            for (const emp of employees) {
                await bot.telegram.sendMessage(Number(emp.tgId), msg, { parse_mode: 'HTML', ...keyboard }).catch(() => { });
            }
        }
    }

    private static async checkFinancialSecurity(provider: any, employees: any[], bot: any, redis: any) {
        try {
            const { FinancialSecurityService } = await import('@/services/security/financial-security.service');
            const report = await FinancialSecurityService.getProviderSlippage(provider.id, 7);

            if (report.status === 'CRITICAL') {
                const key = `alert:security:${provider.id}`;
                if (!(await redis.get(key))) {
                    const msg = `🚨 <b>КРИТИЧЕСКАЯ УГРОЗА: ${provider.name}</b>\n\n` +
                        `Обнаружена аномальная утечка средств!\n\n` +
                        `📉 Расхождение: <b>${report.slippage.toFixed(2)} ${report.currency}</b>\n` +
                        `<i>Возможно использование API ключа третьими лицами!</i>`;

                    for (const emp of employees) {
                        await bot.telegram.sendMessage(Number(emp.tgId), msg, { parse_mode: 'HTML' }).catch(() => { });
                    }
                    await redis.set(key, '1', 'EX', 14400);
                }
            }
        } catch (e) {
            console.error(`[BalanceMonitor] Security check failed:`, e);
        }
    }

    /**
     * Проверяет доступность API и измеряет задержку (Latency).
     */
    static async pingProvider(providerId: string): Promise<{ success: boolean; latency: number; error?: string }> {
        const { ProviderService } = await import('./provider.service');
        const instance = await ProviderService.getInstance(providerId);
        if (!instance) return { success: false, latency: 0, error: 'Provider not found or disabled' };

        const start = Date.now();
        try {
            await instance.getBalance();
            const latency = Date.now() - start;
            return { success: true, latency };
        } catch (e: any) {
            return { success: false, latency: Date.now() - start, error: e.message };
        }
    }
}


