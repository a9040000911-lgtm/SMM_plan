/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 *
 * TMA Orders API — Unified through OrderActivationService (L-01 / L-09 audit fix).
 * Previously created orders directly via prisma.$transaction(), bypassing
 * B2B billing, PricingGuard, promo tracking, and loyalty checks.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProjectTMAData } from '@/utils/tma-auth';
import { SafetyService } from '@/services/users';
import { OrderActivationService } from '@/services/orders/order-activation.service';
import { OrderQueueService } from '@/services/orders/order-queue.service';

export async function POST(req: NextRequest) {
  try {
    // 1. АВТОРИЗАЦИЯ (unchanged — TMA-specific auth stays here)
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

    // 4. РАСЧЕТ СТОИМОСТИ (через unified PricingService)
    const service = await prisma.internalService.findUnique({ where: { id: serviceId } });
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 });

    const { PricingService } = await import('@/services/finance/pricing.service');
    const details = await PricingService.calculateOrderDetails(user.id, serviceId, quantity, user.projectId);
    const total = details.finalPrice;

    // Проверка баланса
    if (user.balance.lt(total)) {
      return NextResponse.json({
        error: 'Insufficient funds',
        required: total.toNumber(),
        current: user.balance.toNumber()
      }, { status: 402 });
    }

    // 5. СОЗДАНИЕ ЗАКАЗА — через UNIFIED OrderActivationService (L-01 FIX)
    // This ensures: B2B billing, PricingGuard, promo tracking, loyalty checks,
    // correct costPrice calculation (L-09 FIX), and consistent ledger entries.
    const order = await OrderActivationService.initiateOrder({
      userId: user.id,
      serviceId: serviceId,
      projectId: user.projectId,
      link: link,
      qty: quantity,
      totalPrice: total,
      discountAmount: details.discountAmount,
      promoId: details.promoId,
      tgId: Number(tgId),
      username: auth.data.user.username || user.username || undefined,
    });

    // 6. Trigger asynchronous background queue execution
    process.nextTick(() => {
      OrderQueueService.processPendingOrders().catch(e => console.error('[TMA OrderQueue Error]', e));
    });

    return NextResponse.json({ success: true, orderId: order.id });

  } catch (error: any) {
    console.error('[API TMA Orders Error]:', error);

    // Provide specific error messages for known errors
    if (error.message === 'B2B_INSUFFICIENT_FUNDS') {
      return NextResponse.json({ error: 'Organization balance insufficient' }, { status: 402 });
    }
    if (error.message === 'SERVICE_UNAVAILABLE') {
      return NextResponse.json({ error: 'Service is currently unavailable' }, { status: 503 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
