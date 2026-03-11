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
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('tma ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!BOT_TOKEN) return NextResponse.json({ error: 'Server config error' }, { status: 500 });
    const auth = TelegramAuth.validateTMAData(authHeader.split('tma ')[1], BOT_TOKEN);
    if (!auth.isValid || !auth.data?.user) return NextResponse.json({ error: 'Auth failed' }, { status: 403 });

    const _body = await req.json();
    const { amount } = _body;

    if (!amount || amount < 10) {
      return NextResponse.json({ error: 'Минимальная сумма пополнения 10₽' }, { status: 400 });
    }

    const tgId = BigInt(auth.data.user.id);
    const user = await prisma.user.findFirst({ where: { tgId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Создаем запись транзакции в базе
    const transaction = await prisma.transaction.create({
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
        error: 'Payment Provider Error',
        message: providerError.message
      }, { status: 502 });
    }


  } catch (error: any) {
    console.error('[API Payments Error]:', error);

    // Если транзакция была создана, но произошла ошибка - помечаем её как FAILED
    try {
      const _body = await req.json();
      const authHeader = req.headers.get('Authorization');
      if (authHeader?.startsWith('tma ') && BOT_TOKEN) {
        const auth = TelegramAuth.validateTMAData(authHeader.split('tma ')[1], BOT_TOKEN);
        if (auth.isValid && auth.data?.user) {
          const tgId = BigInt(auth.data.user.id);
          const user = await prisma.user.findFirst({ where: { tgId } });

          if (user) {
            // Находим последнюю PENDING транзакцию этого пользователя и помечаем как FAILED
            const pendingTx = await prisma.transaction.findFirst({
              where: {
                userId: user.id,
                status: 'PENDING',
                type: 'DEPOSIT'
              },
              orderBy: { createdAt: 'desc' }
            });

            if (pendingTx) {
              await prisma.transaction.update({
                where: { id: pendingTx.id },
                data: {
                  status: 'ERROR',
                  metadata: {
                    ...pendingTx.metadata as object,
                    error: error.message,
                    failedAt: new Date().toISOString()
                  }
                }
              });
            }
          }
        }
      }
    } catch (cleanupError) {
      console.error('[Transaction cleanup error]:', cleanupError);
    }

    return NextResponse.json({ error: 'Internal error', message: error.message }, { status: 500 });
  }
}
