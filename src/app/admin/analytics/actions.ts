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

export async function getDashboardChartsData() {
  await verifyAdmin();

  // 1. Данные по выручке за последние 14 дней
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const transactions = await prisma.transaction.findMany({
    where: {
      type: 'DEPOSIT',
      status: 'COMPLETED',
      createdAt: { gte: fourteenDaysAgo }
    },
    select: { amount: true, createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  // Агрегируем по дням
  const dailyRevenue: Record<string, number> = {};
  transactions.forEach(tx => {
    const day = tx.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    dailyRevenue[day] = (dailyRevenue[day] || 0) + tx.amount.toNumber();
  });

  const revenueChart = Object.entries(dailyRevenue).map(([date, value]) => ({ date, value }));

  // 2. Данные по популярности категорий (Pie Chart)
  const categoryStats = await prisma.order.groupBy({
    by: ['internalServiceId'],
    _count: { id: true },
    where: { status: 'COMPLETED' }
  });

  // Получаем маппинг сервисов к категориям
  const activeServices = await prisma.internalService.findMany({
    where: { id: { in: categoryStats.map(s => s.internalServiceId) } },
    select: { id: true, category: true }
  });

  const categoryMap: Record<string, number> = {};
  categoryStats.forEach(stat => {
    const service = activeServices.find(s => s.id === stat.internalServiceId);
    if (service) {
      categoryMap[service.category] = (categoryMap[service.category] || 0) + stat._count.id;
    }
  });

  const categoryChart = Object.entries(categoryMap).map(([name, value]) => ({ name: name, value }));

  return { revenueChart, categoryChart };
}
