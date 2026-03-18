/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProjectTMAData } from '@/utils/tma-auth';
import { bot } from '@/services/bot/bot-registry';
import { formatAmount } from '@/utils/formatter';
import { MassOrderService } from '@/services/orders';
import { OrderQueueService } from '@/services/orders/order-queue.service';

export async function POST(req: NextRequest) {
    try {
        const auth = await validateProjectTMAData(req);

        if (!auth.isValid || !auth.data?.user) {
            return NextResponse.json({ error: `Auth failed: ${auth.error}` }, { status: 403 });
        }

        const tgId = BigInt(auth.data.user.id);
        const user = await prisma.user.findFirst({ where: { tgId } });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const body = await req.json();
        const { entries, text } = body;

        let orderEntries = entries;
        if (text) {
            orderEntries = MassOrderService.parseText(text);
        }

        if (!orderEntries || orderEntries.length === 0) {
            return NextResponse.json({ error: 'No valid orders' }, { status: 400 });
        }

        const result = await MassOrderService.processMassOrder(user.id, user.projectId, orderEntries);

        // Notification
        try {
            const { BotRegistry } = await import('@/services/bot/bot-registry');
            const projectBot = BotRegistry.get(auth.project?.id || user.projectId);
            const targetBot = projectBot || bot;

            await targetBot.telegram.sendMessage(Number(tgId),
                `✅ <b>Массовый заказ из приложения!</b>\n\n` +
                `📦 Создано заказов: <b>${result.orderCount}</b>\n` +
                `💰 Итого: <b>${formatAmount(result.totalAmount)}₽</b>\n` +
                `🆔 Batch ID: <code>${result.batchId.split('-')[0].toUpperCase()}</code>`,
                { parse_mode: 'HTML' }
            );
        } catch (_e) { console.error('TMA Mass Order Notify Failed'); }

        // Trigger asynchronous non-blocking background queue execution instantly
        process.nextTick(() => {
            OrderQueueService.processPendingOrders().catch(e => console.error('[TMA Mass OrderQueue Error]', e));
        });

        return NextResponse.json({ success: true, ...result });

    } catch (error: any) {
        console.error('[TMA Mass Order Error]:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}


