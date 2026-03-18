/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { ProviderService } from '@/services/providers/provider.service';
import { Decimal } from 'decimal.js';
import { bot } from '@/services/bot/bot-registry';
import { ConfigService } from '@/services/core/config.service';
import { SettingsService } from '@/services/core/settings.service';
import { Markup } from 'telegraf';

export class AutoRefillService {
    /**
     * Пытается автоматически восстановить (докрутить) заказ, если обнаружен отток.
     * @param orderId ID заказа, который просел
     * @param dropAmount Количество списанных единиц
     */
    static async triggerRefill(orderId: number, dropAmount: number) {
        // 0. Глобальный выключатель безопасности
        const shieldEnabled = await SettingsService.get('ENABLE_AUTO_REFILL') === 'true';
        if (!shieldEnabled) {
            console.log('[Churn Shield] System is globally disabled.');
            return;
        }

        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId.toString()) },
            include: {
                user: true,
                project: true,
                internalService: {
                    include: {
                        providerMappings: {
                            where: { isActive: true },
                            orderBy: { priority: 'asc' },
                            include: { provider: true }
                        }
                    }
                }
            }
        });

        if (!order || dropAmount <= 0) return;

        // Защита: Рефилл только для проектов с включенным Маркетологом
        const settings = order.project?.marketerSettings as any;
        const isProtected = settings?.isVipFailoverEnabled || settings?.isNaturalRecoveryEnabled;

        if (!isProtected) {
            console.log(`[Churn Shield] Project ${order.projectId} is not protected. Skipping.`);
            return;
        }

        // --- PHASE 1: NATIVE REFILL (FREE) ---
        if (order.externalId) {
            console.log(`[Churn Shield] Attempting Native Refill for order ${order.id}...`);
            try {
                const refillRes = await ProviderService.refillOrder(order.id);
                if (refillRes.success) {
                    console.log(`[Churn Shield] Native Refill request sent successfully for ${order.id}`);
                    return;
                }
                console.log(`[Churn Shield] Native Refill failed or not supported: ${refillRes.error}`);
            } catch (err) {
                console.error(`[Churn Shield] Native Refill error:`, err);
            }
        }

        // --- PHASE 2: HUMAN-IN-THE-LOOP (APPROVAL) ---
        const telegramConfig = await ConfigService.getTelegramConfig(order.projectId || undefined);
        const adminId = telegramConfig.adminId;

        if (adminId) {
            console.log(`[Churn Shield] Approval required for VIP refill: Order ${order.id}`);

            await bot.telegram.sendMessage(adminId,
                `🛡 <b>SHIELD APPROVAL REQUIRED</b>\n\n` +
                `Зафиксирован отток: <b>-${dropAmount}</b>\n` +
                `Заказ: <code>#${order.id}</code>\n` +
                `Услуга: ${order.internalService.name}\n\n` +
                `⚠️ <b>Нативная докрутка недоступна.</b> Требуется платный перезапуск для восстановления счетчика.`,
                {
                    parse_mode: 'HTML',
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback(`✅ Одобрить докрутку (${dropAmount})`, `approve_refill_${order.id}_${dropAmount}`)],
                        [Markup.button.callback('❌ Игнорировать', `cancel_refill_${order.id}`)]
                    ])
                }
            ).catch(console.error);
            return;
        }

        console.warn(`[Churn Shield] Admin not configured for approval. Refill aborted for safety.`);
    }

    /**
     * Выполняет фактическую докрутку (вызывается после одобрения админом)
     */
    static async executeRefillAfterApproval(orderId: number, dropAmount: number) {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(orderId.toString()) },
            include: {
                user: true,
                project: true,
                internalService: {
                    include: {
                        providerMappings: {
                            where: { isActive: true },
                            orderBy: { priority: 'asc' },
                            include: { provider: true }
                        }
                    }
                }
            }
        });

        if (!order) return;

        const mappings = order.internalService.providerMappings;
        let success = false;

        for (const mapping of mappings) {
            try {
                const providerSvc = await prisma.providerService.findUnique({
                    where: { id: mapping.providerServiceId }
                });

                if (!providerSvc) continue;

                const costOfRefill = providerSvc.rawPrice.mul(dropAmount).div(1000);

                // --- PHASE 12: NATURAL RECOVERY (Drip-Feed for Large Refills) ---
                const settings = order.project?.marketerSettings as any;
                const isVip = settings?.isNaturalRecoveryEnabled === true;

                let dripParams: { runs: number, interval: number } | undefined;
                if (isVip && dropAmount >= 100) {
                    const runs = Math.ceil(dropAmount / 50);
                    dripParams = {
                        runs,
                        interval: 60
                    };
                    console.log(`[Natural Recovery] VIP Refill for ${order.id} will be paced: ${runs} runs x 50 every hour.`);
                }

                const res = await ProviderService.createOrder(
                    order,
                    dropAmount,
                    { providerId: mapping.providerId, providerServiceId: mapping.providerServiceId.toString() },
                    dripParams
                );

                if (res.success) {
                    success = true;
                    await prisma.order.create({
                        data: {
                            parentId: order.id,
                            userId: order.userId,
                            projectId: order.projectId,
                            internalServiceId: order.internalServiceId,
                            link: order.link,
                            quantity: dropAmount,
                            totalPrice: new Decimal(0),
                            costPrice: costOfRefill,
                            status: dripParams ? 'PENDING' : 'PROCESSING',
                            isDripFeed: !!dripParams,
                            runs: dripParams?.runs || 1,
                            interval: dripParams?.interval || 0,
                            externalId: res.externalId,
                            providerName: res.providerName,
                            providerRawResponse: res.rawData || { info: 'Shield Refill' }
                        }
                    });

                    if (isVip && dripParams) {
                        const telegramConfig = await ConfigService.getTelegramConfig(order.projectId || undefined);
                        if (telegramConfig.adminId) {
                            await bot.telegram.sendMessage(telegramConfig.adminId,
                                `🕊 <b>NATURAL RECOVERY STARTED</b>\n\n` +
                                `Заказ: <code>#${order.id}</code>\n` +
                                `Объем: <b>${dropAmount}</b>\n` +
                                `Режим: <b>Плавный</b> (${dripParams.runs} эт. по 60 мин)\n\n` +
                                `<i>Имитируем органику для безопасности проекта ${order.project?.name}.</i>`,
                                { parse_mode: 'HTML' }
                            ).catch(() => { });
                        }
                    }

                    break;
                }
            } catch (err) {
                console.error(`[Churn Shield] Execute failed:`, err);
            }
        }
        return success;
    }
}


