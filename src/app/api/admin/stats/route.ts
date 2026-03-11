/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';
import { getActiveProjectId } from '@/utils/project-resolver';
import { PricingService } from '@/services/finance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = await getActiveProjectId();
    const where = projectId === 'all' ? {} : { projectId: projectId || undefined };

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const [
      userCount,
      orderCount,
      canceledCount,
      pendingPaymentsCount,
      processingOrders,
      totalRevenue,
      stuckOrdersCount,
      openTicketsCount,
      newTicketsCount,
      latestOrders,
      pricingAnalytics
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.order.count({ where }),
      prisma.order.count({ where: { ...where, status: 'CANCELED' } }),
      prisma.transaction.count({ where: { ...where, type: 'DEPOSIT', status: 'PENDING' } }),
      prisma.order.count({ where: { ...where, status: 'PROCESSING' } }),
      prisma.transaction.aggregate({
        where: { ...where, type: 'DEPOSIT', status: 'COMPLETED' },
        _sum: { amount: true }
      }),
      prisma.order.count({
        where: {
          ...where,
          status: 'PROCESSING',
          updatedAt: { lt: twoHoursAgo }
        }
      }),
      prisma.supportTicket.count({ where }),
      prisma.supportTicket.count({
        where: {
          ...where,
          status: 'OPEN',
          messages: { some: { sender: 'USER' } }
        }
      }),
      prisma.order.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { internalService: true, user: true }
      }),
      PricingService.getMarkupAnalytics()
    ]);

    // Получаем детали "зависших" заказов для радара
    const stuckOrdersDetails = await prisma.order.findMany({
      where: {
        ...where,
        status: 'PROCESSING',
        updatedAt: { lt: twoHoursAgo }
      },
      take: 10,
      include: { internalService: true, user: true },
      orderBy: { updatedAt: 'asc' }
    });

    // Получаем статус последней финансовой сверки (глобальная настройка)
    const auditSetting = await prisma.settings.findFirst({
      where: { key: 'LAST_FINANCIAL_AUDIT', projectId: projectId || null }
    });
    let financialAudit = { timestamp: null, discrepanciesCount: 0 };
    if (auditSetting?.value) {
      try {
        financialAudit = JSON.parse(auditSetting.value);
      } catch (e) {
        console.error('Failed to parse LAST_FINANCIAL_AUDIT:', e);
      }
    }

    // Helper to handle BigInt and Decimal serialization
    const serialize = (data: any) => {
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'bigint') return value.toString();
        // Handle Prisma/decimal.js Decimal objects
        if (value && typeof value === 'object' && (value.constructor?.name === 'Decimal' || value._isDecimal)) {
          return value.toString();
        }
        return value;
      }));
    };

    const responseData = serialize({
      userCount,
      orderCount,
      canceledCount,
      pendingPaymentsCount,
      processingOrders,
      stuckOrdersCount,
      stuckOrders: stuckOrdersDetails,
      revenue: totalRevenue._sum.amount ? Number(totalRevenue._sum.amount) : 0,
      financialAudit,
      openTicketsCount,
      newTicketsCount,
      latestOrders,
      pricingAnalytics
    });

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
