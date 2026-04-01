/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { TelegramAuth } from '@/lib/telegram/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'No auth' }, { status: 401 });

    const [type, data] = authHeader.split(' ');
    if (type !== 'tma') return NextResponse.json({ error: 'Invalid auth type' }, { status: 401 });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ error: 'Server error' }, { status: 500 });

    const auth = TelegramAuth.validateTMAData(data, botToken);
    if (!auth.isValid || !auth.data?.user) return NextResponse.json({ error: 'Invalid TMA auth' }, { status: 401 });

    const tgId = BigInt(auth.data.user.id);
    const user = await prisma.user.findFirst({ where: { tgId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        internalService: {
          select: {
            name: true,
            socialPlatform: { select: { slug: true } }
          }
        }
      }
    });

    const mappedOrders = orders.map(o => ({
      ...o,
      internalService: {
        ...o.internalService,
        platform: o.internalService.socialPlatform?.slug?.toUpperCase() || 'OTHER'
      }
    }));

    return NextResponse.json({ orders: mappedOrders });
  } catch (e: any) {
    console.error('Orders List API Error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}


