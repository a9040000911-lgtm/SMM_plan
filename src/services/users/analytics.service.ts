/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { bot } from '@/services/bot/bot-registry';
import { ConfigService } from '@/services/core/config.service';
import { formatAmount } from '@/utils/formatter';
import { DashboardStats } from '../types';


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
   * Aggregates stats specifically for the user dashboard.
   */
  static async getUserDashboardStats(userId: string): Promise<DashboardStats> {
    const [activeCount, completedCount, totalSpentAgg] = await Promise.all([
      prisma.order.count({ 
        where: { userId, status: { in: ['PENDING', 'PROCESSING', 'IN_PROGRESS'] } } 
      }),
      prisma.order.count({ 
        where: { userId, status: 'COMPLETED' } 
      }),
      prisma.order.aggregate({ 
        where: { userId }, 
        _sum: { totalPrice: true } 
      }),
    ]);

    return {
      activeCount,
      completedCount,
      totalSpent: totalSpentAgg._sum.totalPrice?.toNumber() || 0
    };
  }

  /**
   * Fetches latest orders for a specific user.
   */
  static async getRecentOrders(userId: string, limit: number = 5) {
    return await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { internalService: { select: { name: true, socialPlatform: { select: { slug: true } } } } }
    });
  }
}


