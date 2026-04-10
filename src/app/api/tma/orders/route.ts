/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProjectTMAData } from '@/utils/tma-auth';
import { SafetyService } from '@/services/users';
import { bot } from '@/services/bot/bot-registry';
import { formatAmount } from '@/utils/formatter';
import { LedgerService } from '@/services/finance';
import { OrderQueueService } from '@/services/orders/order-queue.service';

export async function POST(req: NextRequest) {
  try {
    // 1. АВТОРИЗАЦИЯ
    const auth = await validateProjectTMAData(req);

    if (!auth.isValid || !auth.data?.user) {
      return NextResponse.json({ error: `Auth failed: ${auth.error}` }, { status: 403 });
    }

    const tgId = BigInt(auth.data.user.id);
    const user = await prisma.user.findFirst({ where: { tgId } });

    if (!user) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }

    // 2. ВАЛИДАЦИЯ ВХОДЯЩИХ ДАННЫХ
    const body = await req.json();
    const { serviceId, link, quantity } = body;

    if (!serviceId || !link || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid order parameters' }, { status: 400 });
    }

    // 3. SAFETY CHECK (Margin Guard & Price Check)
    const safety = await SafetyService.validateOrder(serviceId, quantity, user.projectId!);
    if (!safety.valid) {
      return NextResponse.json({
        error: 'Order validation failed',
        reason: safety.reason
      }, { status: 422 });
    }

    // 4. РАСЧЕТ СТОИМОСТИ
    const service = await prisma.internalService.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const { PricingService } = await import('@/services/finance/pricing.service');
    const details = await PricingService.calculateOrderDetails(user.id, serviceId, quantity);
    const total = details.finalPrice;

    // Проверка баланса
    if (user.balance.lt(total)) {
      return NextResponse.json({
        error: 'Insufficient funds',
        required: total.toNumber(),
        current: user.balance.toNumber()
      }, { status: 402 });
    }

    // 5. СОЗДАНИЕ ЗАКАЗА (ТРАНЗАКЦИЯ)
    const order = await prisma.$transaction(async (tx) => {
      // Атомарное списание баланса с проверкой (защита от Race Condition)
      const updateResult = await tx.user.updateMany({
        where: { id: user.id, balance: { gte: total } },
        data: {
          balance: { decrement: total },
          spent: { increment: total }
        }
      });

      if (updateResult.count === 0) throw new Error('Insufficient funds or race condition');

      // ЗАПИСЬ В LEDGER
      await LedgerService.record(tx, user.id, total, 'WITHDRAWAL', service.id, `Заказ через приложение: ${service.name}`);

      const ord = await tx.order.create({
        data: {
          projectId: user.projectId,
          userId: user.id,
          internalServiceId: service.id,
          link: link,
          quantity: quantity,
          totalPrice: total,
          discountAmount: discountAmount,
          costPrice: service.lastProviderPrice,
          status: 'PENDING'
        }
      });

      await tx.transaction.create({
        data: {
          projectId: user.projectId,
          userId: user.id,
          amount: total,
          type: 'ORDER_PAYMENT',
          provider: 'INTERNAL',
          status: 'COMPLETED',
          metadata: { tma: true, orderId: ord.id }
        }
      });

      return ord;
    });

    // 6. УВЕДОМЛЕНИЕ
    try {
      const { BotRegistry } = await import('@/services/bot/bot-registry');
      const projectBot = BotRegistry.get(auth.project?.id || user.projectId);
      const targetBot = projectBot || bot;

      await targetBot.telegram.sendMessage(Number(tgId),
        `🚀 <b>Заказ из приложения!</b>\n\n` +
        `Услуга: ${service.name}\n` +
        `Сумма: <b>${formatAmount(total)}₽</b>\n` +
        `ID: <code>${order.id}</code>\n\n` +
        `<i>Статус выполнения можно отследить в разделе "Мои заказы".</i>`,
        { parse_mode: 'HTML' }
      );
    } catch (_e) { console.error('Failed to send TMA order notification'); }

    // Trigger asynchronous non-blocking background queue execution instantly
    process.nextTick(() => {
      OrderQueueService.processPendingOrders().catch(e => console.error('[TMA OrderQueue Error]', e));
    });

    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error: any) {
    console.error('[API TMA Orders Error]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


