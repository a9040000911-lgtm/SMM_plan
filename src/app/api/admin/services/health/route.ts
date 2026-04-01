/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/services/users';

export const dynamic = 'force-dynamic';

import { sanitizeData } from '@/utils/service-sanitizer';

export async function GET() {
  try {
    const [orders, incidents] = await Promise.all([
      prisma.order.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
        select: {
          internalServiceId: true,
          status: true,
          totalPrice: true,
          costPrice: true,
          providerName: true
        }
      }),
      AnalyticsService.getIncidentReport()
    ]);

    const stats: Record<string, any> = {};

    orders.forEach(o => {
      if (!stats[o.internalServiceId]) {
        stats[o.internalServiceId] = {
          id: o.internalServiceId,
          total: 0,
          completed: 0,
          canceled: 0,
          revenue: 0,
          cost: 0,
          provider: o.providerName
        };
      }

      const s = stats[o.internalServiceId];
      s.total++;
      if (o.status === 'COMPLETED') s.completed++;
      if (o.status === 'CANCELED') s.canceled++;
      
      s.revenue += Number(o.totalPrice);
      s.cost += Number(o.costPrice || 0);
    });

    // Преобразуем в массив и считаем проценты
    const healthData = Object.values(stats).map(s => ({
      ...s,
      successRate: s.total > 0 ? (s.completed / s.total) * 100 : 100,
      profit: s.revenue - s.cost
    })).sort((a, b) => a.successRate - b.successRate); // Сначала самые проблемные

    return NextResponse.json(sanitizeData({
      health: healthData,
      incidents
    }));
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


