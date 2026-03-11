/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { bot } from '@/lib/bot';
import { ConfigService } from '@/lib/config.service';
import { formatAmount } from '@/utils/formatter';

export class AnalyticsService {
  /**
   * Генерирует отчет за указанный период (по умолчанию 24 часа)
   */
  static async getPeriodStats(hours: number = 24) {
    const since = new Date(Date.now() - hours * 3600000);

    // 1. Заказы (только не отмененные)
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: since },
        status: { not: 'CANCELED' }
      }
    });

    // 2. Новые пользователи
    const newUsers = await prisma.user.count({
      where: { createdAt: { gte: since } }
    });

    // 3. Пополнения
    const deposits = await prisma.transaction.aggregate({
      where: {
        createdAt: { gte: since },
        type: 'DEPOSIT',
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });

    // 4. Возвраты (нужны для вычитания из выручки)
    const refunds = await prisma.transaction.aggregate({
      where: {
        createdAt: { gte: since },
        type: 'REFUND',
        status: 'COMPLETED'
      },
      _sum: { amount: true }
    });

    let totalRevenue = new Decimal(0);
    let totalCost = new Decimal(0);

    orders.forEach(o => {
      totalRevenue = totalRevenue.plus(o.totalPrice);
      const cost = o.costPrice ? o.costPrice.mul(o.quantity).div(1000) : new Decimal(0);
      totalCost = totalCost.plus(cost);
    });

    const refundAmount = refunds._sum.amount || new Decimal(0);
    const netRevenue = totalRevenue.minus(refundAmount); // Выручка за вычетом возвратов
    const netProfit = netRevenue.minus(totalCost);

    return {
      periodHours: hours,
      orderCount: orders.length,
      newUsers,
      revenue: netRevenue,
      refunds: refundAmount,
      cost: totalCost,
      profit: netProfit,
      deposits: deposits._sum.amount || new Decimal(0)
    };
  }

  /**
   * Генерирует текстовый график топ-услуг
   */
  static async getTopServicesReport(hours: number = 168) {
    const since = new Date(Date.now() - hours * 3600000);

    const topOrders = await prisma.order.groupBy({
      by: ['internalServiceId'],
      where: {
        createdAt: { gte: since },
        status: { not: 'CANCELED' }
      },
      _count: { id: true },
      _sum: { totalPrice: true },
      orderBy: { _count: { id: 'desc' } },
      take: 7
    });

    if (topOrders.length === 0) return "<i>Данных по заказам за этот период пока нет.</i>";

    let report = `📊 <b>ТОП УСЛУГ ЗА ${hours === 168 ? 'НЕДЕЛЮ' : 'ПЕРИОД'}</b>\n`;
    report += `<i>(по количеству заказов)</i>\n\n`;

    const maxOrders = topOrders[0]._count.id;

    for (const item of topOrders) {
      const service = await prisma.internalService.findUnique({ where: { id: item.internalServiceId } });
      const name = service?.name || item.internalServiceId;
      const count = item._count.id;
      const revenue = item._sum.totalPrice || new Decimal(0);

      const barLength = Math.max(1, Math.round((count / maxOrders) * 10));
      const bar = '▓'.repeat(barLength) + '░'.repeat(10 - barLength);

      report += `<b>${name}</b>\n`;
      report += `<code>${bar}</code> ${count} зак. (${formatAmount(revenue)}₽)\n\n`;
    }

    return report;
  }

  /**
   * Отправляет отчет админу за любой период
   */
  static async sendPeriodReport(hours: number, title: string) {
    const config = await ConfigService.getTelegramConfig();
    const adminId = config.adminId;
    if (!adminId) return;

    try {
      const stats = await this.getPeriodStats(hours);

      const reportMsg =
        `📈 <b>${title}</b>\n` +
        `────────────────────\n\n` +
        `👥 <b>Новых пользователей:</b> ${stats.newUsers}\n` +
        `📦 <b>Заказов создано:</b> ${stats.orderCount}\n\n` +
        `💰 <b>Финансы:</b>\n` +
        `├ Пополнено: <b>${formatAmount(stats.deposits)}₽</b>\n` +
        `├ Чистая выручка: <b>${formatAmount(stats.revenue)}₽</b>\n` +
        `├ Возвращено: <b>${formatAmount(stats.refunds)}₽</b>\n` +
        `├ Себестоимость: <b>${formatAmount(stats.cost)}₽</b>\n` +
        `└ <b>ЧИСТАЯ ПРИБЫЛЬ:</b> <b>${formatAmount(stats.profit)}₽</b>\n\n` +
        `<i>* Выручка и прибыль указаны за вычетом возвратов.</i>`;

      await bot.telegram.sendMessage(adminId, reportMsg, { parse_mode: 'HTML' });
    } catch (error) {
      console.error(`Failed to send report (${title}):`, error);
    }
  }
  /**
   * Обнаруживает "зависшие" или проблемные заказы
   */
  static async getIncidentReport() {
    const stuckThreshold = new Date(Date.now() - 12 * 3600000); // 12 часов

    // 1. Заказы, которые висят в Processing слишком долго
    const stuckOrders = await prisma.order.findMany({
      where: {
        status: 'PROCESSING',
        updatedAt: { lte: stuckThreshold }
      },
      include: { internalService: true },
      take: 10
    });

    // 2. Услуги с высоким процентом отмен (Incident Radar)
    const recentOrdersSince = new Date(Date.now() - 24 * 3600000);
    const ordersByService = await prisma.order.groupBy({
      by: ['internalServiceId'],
      where: { createdAt: { gte: recentOrdersSince } },
      _count: { id: true }
    });

    const highFailureServices = [];
    for (const s of ordersByService) {
      const canceledCount = await prisma.order.count({
        where: {
          internalServiceId: s.internalServiceId,
          createdAt: { gte: recentOrdersSince },
          status: 'CANCELED'
        }
      });

      const failureRate = (canceledCount / s._count.id) * 100;
      if (failureRate > 40 && s._count.id > 5) { // Порог 40% при минимум 5 заказах
        const service = await prisma.internalService.findUnique({ where: { id: s.internalServiceId } });
        highFailureServices.push({
          id: s.internalServiceId,
          name: service?.name || s.internalServiceId,
          rate: Math.round(failureRate),
          count: s._count.id
        });
      }
    }

    return {
      stuckCount: stuckOrders.length,
      stuckExamples: stuckOrders.map(o => ({
        id: o.id.toString(),
        service: o.internalService.name,
        link: o.link
      })),
      highFailureServices
    };
  }

  /**
   * Устаревший метод для совместимости
   */
  static async sendDailyReport() {
    return this.sendPeriodReport(24, 'ОТЧЕТ ЗА 24 ЧАСА');
  }

  /**
   * Forecasts subscriber churn based on service guarantee periods.
   * @param days Number of days ahead to forecast
   */
  static async getChurnForecast(days: number = 30) {
    const today = new Date();
    const forecastEnd = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

    // 1. Find active subscription orders where service has a guarantee
    const activeOrders = await prisma.order.findMany({
      where: {
        status: 'COMPLETED',
        internalService: {
          guaranteeDays: { gt: 0 },
          // Assuming 'SUBSCRIBERS' category or similar. 
          // To be safe, we rely on guaranteeDays > 0 which implies it's churnable.
          category: { in: ['SUBSCRIBERS', 'MEMBERS' as any, 'PARTICIPANTS' as any] }
        }
      },
      select: {
        id: true,
        createdAt: true,
        quantity: true,
        internalService: {
          select: {
            name: true,
            guaranteeDays: true,
            avgDropRate: true
          }
        }
      }
    });

    const forecastMap = new Map<string, number>(); // Date -> Churn Count
    const highRiskServices = new Map<string, { name: string, churn: number }>();

    for (const order of activeOrders) {
      const guaranteeMs = order.internalService.guaranteeDays * 24 * 60 * 60 * 1000;
      const dropDate = new Date(order.createdAt.getTime() + guaranteeMs);

      // Filter out drops that already happened (dropDate < today)
      // Or maybe we want to see them as "Overdue/Immediate Risk"?
      // Let's filter for future within 'days' range OR recent past (risk)
      if (dropDate > today && dropDate <= forecastEnd) {
        const dateKey = dropDate.toISOString().split('T')[0];
        const current = forecastMap.get(dateKey) || 0;

        // Calculate estimated churn amount (Quantity * Drop Rate or 100%?)
        // If DropRate is 0, assume 100% drops after guarantee (worst case) or maybe 10%?
        // Let's use avgDropRate if set, otherwise assume 20% natural churn after guarantee.
        const dropRate = order.internalService.avgDropRate > 0 ? (order.internalService.avgDropRate / 100) : 0.2;
        const churnAmount = Math.ceil(order.quantity * dropRate);

        forecastMap.set(dateKey, current + churnAmount);

        const svcKey = order.internalService.name;
        const svcRisk = highRiskServices.get(svcKey) || { name: svcKey, churn: 0 };
        svcRisk.churn += churnAmount;
        highRiskServices.set(svcKey, svcRisk);
      }
    }

    // Sort by date
    const timeline = Array.from(forecastMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Sort risks
    const risks = Array.from(highRiskServices.values())
      .sort((a, b) => b.churn - a.churn)
      .slice(0, 5); // Changed .take(5) to .slice(0, 5)

    return { timeline, risks, totalProjectedChurn: risks.reduce((a, b) => a + b.churn, 0) };
  }
}
