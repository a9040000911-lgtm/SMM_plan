/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TelegramAuth } from '@/lib/telegram/auth';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
  let transaction: any = null;
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('tma ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!BOT_TOKEN) return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    const auth = TelegramAuth.validateTMAData(authHeader.split('tma ')[1], BOT_TOKEN);
    if (!auth.isValid || !auth.data?.user) return NextResponse.json({ error: 'Auth failed' }, { status: 403 });

    const rawBody = await req.json();
    const { z } = await import('zod');
    const tmaPaymentSchema = z.object({
      amount: z.union([z.number(), z.string()]).transform(Number).refine(val => !isNaN(val) && val >= 10, { message: 'Минимальная сумма пополнения 10₽' })
    }).passthrough();

    const parsed = tmaPaymentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { amount } = parsed.data;

    const tgId = BigInt(auth.data.user.id);
    const user = await prisma.user.findFirst({ where: { tgId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Создаем запись транзакции в базе
    transaction = await prisma.transaction.create({
      data: {
        projectId: user.projectId,
        userId: user.id,
        amount: amount,
        type: 'DEPOSIT',
        provider: 'YOOKASSA',
        status: 'PENDING',
        metadata: {
          source: 'BOT'
        }
      }
    });

    // Получаем провайдера из настроек проекта
    if (!user.projectId) {
      return NextResponse.json({ error: 'User has no project assigned' }, { status: 400 });
    }

    try {
      // Используем фабрику для получения провайдера
      const { PaymentProviderFactory } = await import('@/services/payments/payment-provider.factory');
      const provider = await PaymentProviderFactory.getProviderForProject(user.projectId);

      // Создаем платеж через унифицированный интерфейс
      const result = await provider.createPayment(
        user.projectId,
        amount,
        transaction.id,
        `Пополнение баланса Smmplan (User: ${user.username || user.tgId})`,
        user.email || undefined
      );

      // Обновляем транзакцию ID от платежного провайдера
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { externalId: result.id }
      });

      return NextResponse.json({ success: true, url: result.confirmationUrl });

    } catch (providerError: any) {
      // Обновляем статус транзакции на FAILED при ошибке провайдера
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: 'ERROR',
          metadata: {
            ...transaction.metadata as object,
            error: providerError.message,
            failedAt: new Date().toISOString()
          }
        }
      });

      return NextResponse.json({
        error: 'Payment Provider Error'
      }, { status: 502 });
    }


  } catch (error: any) {
    console.error('[API Payments Error]:', error);

    // Если транзакция была создана, но произошла ошибка - помечаем её как FAILED
    if (transaction && transaction.id) {
      try {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'ERROR',
            metadata: {
              ...(transaction.metadata || {}),
              error: error.message || 'Payment init failed',
              failedAt: new Date().toISOString()
            }
          }
        });
      } catch (cleanupError) {
        console.error('[Transaction cleanup error]:', cleanupError);
      }
    }

    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


