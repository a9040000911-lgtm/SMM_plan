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

export async function getServicesHealthStats() {
  await verifyAdmin();

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: dayAgo } },
    select: {
      internalServiceId: true,
      status: true,
      totalPrice: true,
      costPrice: true,
      quantity: true
    }
  });

  const healthMap: Record<string, { success: number, total: number, rate: number, profit: number }> = {};

  orders.forEach(order => {
    const id = order.internalServiceId;
    if (!healthMap[id]) healthMap[id] = { success: 0, total: 0, rate: 100, profit: 0 };
    
    if (order.status === 'COMPLETED') healthMap[id].success += 1;
    if (order.status !== 'PENDING') healthMap[id].total += 1;

    // Считаем прибыль только по не отмененным заказам (или по всем, но учитывая себестоимость)
    if (order.status !== 'CANCELED') {
        const cost = order.costPrice ? Number(order.costPrice) * (order.quantity / 1000) : 0;
        healthMap[id].profit += Number(order.totalPrice) - cost;
    }
  });

  // Рассчитываем % успеха
  Object.keys(healthMap).forEach(id => {
    const s = healthMap[id];
    s.rate = s.total > 0 ? Math.round((s.success / s.total) * 100) : 100;
  });

  return healthMap;
}
