/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProjectTMAData } from '@/utils/tma-auth';

export async function GET(req: NextRequest) {
  try {
    let tgId: bigint | null = null;
    let authProject: any = null;

    const auth = await validateProjectTMAData(req);
    if (auth.isValid && auth.data?.user) {
      tgId = BigInt(auth.data.user.id);
      // eslint-disable-next-line unused-imports/no-unused-vars
      authProject = auth.project;
    }

    // Если нет авторизации, берем первого пользователя для тестов в браузере
    let user;
    if (tgId) {
      user = await prisma.user.findFirst({
        where: { tgId },
        include: {
          orders: { orderBy: { createdAt: 'desc' }, take: 10, include: { internalService: true } },
          _count: { select: { referrals: true } }
        }
      });
    } else {
      user = await prisma.user.findFirst({
        include: {
          orders: { orderBy: { createdAt: 'desc' }, take: 10, include: { internalService: true } },
          _count: { select: { referrals: true } }
        }
      });
    }

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // --- ПРОВЕРКА И ЗАКРЕПЛЕНИЕ СТАТУСА "ПЕРВОПРОХОДЕЦ" ---
    const userCount = await prisma.user.count({ where: { createdAt: { lte: user.createdAt } } });

    if (!user.isEarlyBird && userCount <= 300) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isEarlyBird: true }
      });
      user.isEarlyBird = true;
    }

    const earlyBirdDiscount = user.isEarlyBird ? 20 : 0;

    // Реферальная ссылка
    const botUsername = process.env.BOT_USERNAME || 'smmplan_bot';
    const referralLink = `https://t.me/${botUsername}?start=${user.id}`;

    // Получаем текущий % комиссии из настроек
    const refSetting = await prisma.settings.findUnique({
      where: { projectId_key: { projectId: 'global', key: 'REFERRAL_PERCENT' } }
    });
    const refPercent = refSetting ? parseInt(refSetting.value) : 10;

    // Расчет уровня лояльности
    const spent = user.spent.toNumber();
    let loyalty = { name: '🥉 BRONZE', discount: 0 + earlyBirdDiscount };

    if (spent >= 50000) loyalty = { name: '💎 DIAMOND', discount: 10 + earlyBirdDiscount };
    else if (spent >= 15000) loyalty = { name: '🥇 GOLD', discount: 7 + earlyBirdDiscount };
    else if (spent >= 5000) loyalty = { name: '🥈 SILVER', discount: 3 + earlyBirdDiscount };

    return NextResponse.json({
      id: user.id,
      balance: user.balance.toNumber(),
      spent: spent,
      referralLink,
      loyalty: {
        ...loyalty,
        isEarlyBird: user.isEarlyBird,
        pioneerIndex: userCount // Номер регистрации
      },
      referrals: {
        count: user._count.referrals,
        earnings: user.referralEarnings.toNumber(),
        percent: refPercent
      },
      orders: user.orders.map(o => ({
        id: o.id,
        service: o.internalService.name,
        status: o.status,
        amount: o.totalPrice.toNumber(),
        createdAt: o.createdAt
      }))
    });

  } catch (error) {
    console.error('[API TMA User Error]:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}


