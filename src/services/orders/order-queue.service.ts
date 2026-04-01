/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers/provider.service';
import { Decimal } from 'decimal.js';
import { BotRegistry } from '@/services/bot/bot-registry';
import { Markup } from 'telegraf';
import { DripFeedService } from '@/services/orders/drip-feed.service';
import { ConfigService } from '@/services/core/config.service';
import { NotificationTemplates } from '@/bot/utils/notification-templates';
import { ProviderOrderResult, OrderWithRelations } from '@/types/orders';
import { OrderRefundService } from './order-refund.service';
import { MarketerSettings } from '@/types/project-settings';
import { createLogger } from '@/lib/logger';
import { encodePublicId } from '@/utils/id-obfuscator';

export class OrderQueueService {
    private static logger = createLogger('OrderQueueService');

    /**
     * Возвращает заказы в обработку (PENDING)
     */
    static async processPendingOrders(specificOrderId?: number) {
        try {
            const latestBalances = await prisma.providerBalanceLog.findMany({
                distinct: ['providerId'],
                orderBy: { createdAt: 'desc' },
                include: { provider: true }
            });

            const balanceMap = new Map<string, Decimal>();
            latestBalances.forEach(log => {
                balanceMap.set(log.provider.name, log.balance);
            });

            const rawPending = await prisma.order.findMany({
                take: 50,
                where: {
                    status: 'PENDING',
                    ...(specificOrderId ? { id: specificOrderId } : {})
                },
                select: { id: true }
            });

            if (rawPending.length === 0) return;

            // Атомарный захват заказов в работу (Race Condition Deduplication)
            // Исключает дублирование отправок внешнему провайдеру при параллельных CRON-запусках
            const pendingIds = rawPending.map(o => o.id);
            const lockResult = await prisma.order.updateMany({
                where: { id: { in: pendingIds }, status: 'PENDING' },
                data: { status: 'PROCESSING' }
            });

            if (lockResult.count === 0) return;

            const pending = await prisma.order.findMany({
                where: { id: { in: pendingIds }, status: 'PROCESSING', externalId: null },
                include: {
                    user: true,
                    project: true,
                    internalService: true
                }
            }) as OrderWithRelations[];

            if (pending.length === 0) return;


            for (const o of pending) {
                try {
                    const mappings = await prisma.internalServiceMapping.findMany({
                        where: {
                            internalServiceId: o.internalServiceId,
                            OR: [
                                { projectId: o.projectId },
                                { projectId: null }
                            ],
                            isActive: true
                        },
                        orderBy: [
                            { projectId: 'desc' },
                            { priority: 'asc' }
                        ],
                        include: { provider: true }
                    });

                    let success = false;
                    let lastErrorResult: any = null;

                    for (const m of mappings) {
                        const providerName = m.provider.name;
                        if (!providerName) continue;

                        const providerBalance = balanceMap.get(providerName) || new Decimal(0);
                        if (providerBalance.lt(10)) continue;

                        const providerSvc = await prisma.providerService.findUnique({
                            where: { id: m.providerServiceId }
                        });
                        if (!providerSvc) continue;

                        const rawPrice = new Decimal(providerSvc.rawPrice as any);
                        const userPaidPer1000 = new Decimal(o.totalPrice as any).mul(1000).div(o.quantity);

                        if (rawPrice.gte(userPaidPer1000)) {
                            this.logger.warn(`[Queue] Skipping ${providerName}: provider price (${rawPrice}) >= user price (${userPaidPer1000})`);
                            continue;
                        }

                        let qtyToOrder = o.quantity;
                        let useNativeDrip = false;
                        let dripParams = undefined;

                        if (o.isDripFeed) {
                            const projectSettings = o.project?.marketerSettings as MarketerSettings | null;
                            const dripDisabled = projectSettings?.isDripFeedDisabled || o.internalService.isDripFeedDisabled || m.provider.isDripFeedDisabled;

                            if (dripDisabled) {
                                this.logger.info(`[Queue] Drip-feed disabled for order ${o.id}. Proceeding with full qty.`);
                            } else if (m.provider.hasNativeDripFeed) {
                                this.logger.info(`[Queue] Using Native Drip-Feed for order ${o.id} via ${providerName}`);
                                useNativeDrip = true;
                                dripParams = { runs: o.runs, interval: o.interval };
                            } else {
                                this.logger.info(`[Queue] Using Internal Drip-Feed for order ${o.id} stage 1`);
                                qtyToOrder = Math.floor(o.quantity / o.runs);
                            }
                        }

                        try {
                            const instance = await ProviderService.getInstance(m.providerId);
                            if (instance) {
                                const { balance } = await instance.getBalance();
                                if (new Decimal(balance).lt(10)) {
                                    this.logger.warn(`[Queue] Skipping ${providerName} due to real-time low balance: ${balance}`);
                                    continue;
                                }
                            }
                        } catch (_e) {
                            this.logger.error(`[Queue] Real-time balance check failed for ${providerName}:`, _e);
                        }

                        const res: ProviderOrderResult = await ProviderService.createOrder(o, qtyToOrder, { providerId: m.providerId, providerServiceId: m.providerServiceId.toString() }, dripParams);

                        if (res.success) {
                            success = true;
                            if (o.isDripFeed && !useNativeDrip && !(o.project?.isDripFeedDisabled) && !o.internalService.isDripFeedDisabled && !m.provider.isDripFeedDisabled) {
                                await DripFeedService.scheduleFirstRun(o, res.externalId || '', res.providerName || '', res.rawData);
                            } else {
                                await prisma.order.update({
                                    where: { id: o.id },
                                    data: {
                                        externalId: res.externalId,
                                        providerName: res.providerName,
                                        status: 'PROCESSING',
                                        providerRawResponse: res.rawData || { info: useNativeDrip ? 'Native Drip-Feed started' : 'Regular order started' }
                                    }
                                });

                                try {
                                    await BotRegistry.get(o.projectId).telegram.sendMessage(
                                        Number(o.user.tgId),
                                        NotificationTemplates.ORDER.PROCESSING_USER(encodePublicId(o.id), o.internalService.name),
                                        { parse_mode: 'HTML' }
                                    );
                                } catch (_e) { /* ignore */ }
                            }
                            break;
                        } else {
                            lastErrorResult = res.rawData || { error: res.error || 'Unknown provider error' };
                        }
                    }

                    if (!success) {
                        this.logger.error(`[Queue] Failed to process order ${o.id} after checking all mappings. Last error:`, lastErrorResult);
                        const errorPayload = lastErrorResult ? { error: 'All providers failed', lastProviderResponse: lastErrorResult } : { error: 'No active provider mappings found' };
                        await OrderRefundService.handleRefund(o, 'CANCELED', 0, errorPayload);
                        try {
                            await BotRegistry.get(o.projectId).telegram.sendMessage(
                                Number(o.user.tgId),
                                NotificationTemplates.ORDER.CANCELLED_USER_GENERIC(encodePublicId(o.id)),
                                {
                                    parse_mode: 'HTML',
                                    ...Markup.inlineKeyboard([[
                                        Markup.button.callback(NotificationTemplates.COMMON.SUPPORT_ORDER_BUTTON(o.id), `support_order_${o.id}`)
                                    ]])
                                }
                            );
                        } catch (_e) { this.logger.error('Failed to send rejection notification'); }
                    }
                } catch (_err: any) {
                    const isNetworkError = _err.message?.includes('PROVIDER_NETWORK_ERROR');
                    this.logger.error(`Error processing pending order ${o.id}${isNetworkError ? ' (NETWORK TIMEOUT)' : ''}:`, _err.message);

                    if (isNetworkError) {
                        await prisma.order.update({
                            where: { id: o.id },
                            data: {
                                status: 'PROCESSING',
                                metadata: {
                                    ...(o.metadata as any || {}),
                                    possiblyCreated: true,
                                    stuckAt: new Date().toISOString(),
                                    lastQueueError: _err.message
                                }
                            }
                        });

                        const telegramConfig = await ConfigService.getTelegramConfig(o.projectId || undefined);
                        if (telegramConfig.adminId) {
                            try {
                                const { bot } = await import('@/services/bot/bot-registry');
                                await bot.telegram.sendMessage(telegramConfig.adminId,
                                    `⚠️ <b>КРИТИЧЕСКИЙ ТАЙМАУТ</b>\n\nЗаказ #${o.id} завис при создании. API провайдера не ответило вовремя.\n\n<b>ВНИМАНИЕ:</b> Не делайте возврат вручную, пока не убедитесь, что заказа нет у провайдера!`,
                                    { parse_mode: 'HTML' }
                                );
                            } catch (e) { /* ignore */ }
                        }
                    } else {
                        try {
                            await OrderRefundService.handleRefund(o, 'CANCELED', 0, { error: 'Internal system error processing order queue', message: _err.message });
                        } catch (refundErr) {
                            this.logger.error(`Failed to refund order ${o.id} after internal error:`, refundErr);
                        }
                    }
                }
            }
        } catch (fatalErr) {
            this.logger.error('[Queue Fatal] Failed to fetch pending orders or balances:', fatalErr);
        }
    }

    static async processDripFeedRun(orderId: number) {
        return await DripFeedService.processRun(orderId);
    }

}


