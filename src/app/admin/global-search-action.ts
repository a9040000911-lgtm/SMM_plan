'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session) throw new Error('Unauthorized');
}

export async function globalSearchAction(query: string) {
  await verifyAdmin();
  const isNumeric = /^\d+$/.test(query);
  if (!query || query.length < 2) return { users: [], orders: [], tickets: [], services: [], providers: [] };
  const [users, orders, tickets, services, providers] = await Promise.all([
    // Поиск пользователей
    prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          isNumeric ? { tgId: BigInt(query) } : undefined
        ].filter(Boolean) as any
      },
      take: 5,
      select: { id: true, username: true, role: true }
    }),
    // Поиск заказов
    prisma.order.findMany({
      where: {
        OR: [
          ...(isNumeric ? [{ id: parseInt(query) }] : []),
          { externalId: { contains: query, mode: 'insensitive' } },
          { link: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: { id: true, status: true, totalPrice: true }
    }),
    // Поиск тикетов
    prisma.supportTicket.findMany({
      where: {
        OR: [
          { subject: { contains: query, mode: 'insensitive' } },
          { id: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 5,
      select: { id: true, subject: true, status: true }
    }),
    // Поиск услуг (NEW)
    prisma.internalService.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { id: { contains: query } }
        ]
      },
      take: 5,
      select: { id: true, name: true, platform: true, isActive: true }
    }),
    // Поиск провайдеров (NEW)
    prisma.provider.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' }
      },
      take: 3,
      select: { id: true, name: true, isEnabled: true }
    })
  ]);

  return {
    users,
    orders: orders.map(o => ({ ...o, totalPrice: o.totalPrice.toString() })),
    tickets,
    services,
    providers
  };
}
