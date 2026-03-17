/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';

import { ProviderService } from '@/services/providers/provider.service';
import { MLForecasterService, MLPrediction } from './ml-forecaster.service';

export interface ProviderForecast {
  providerName: string;
  currentBalance: number;
  dailyBurnRate: number;
  daysLeft: number;
  recommendedTopUp: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  ml: MLPrediction;
  latency?: number;
  avgSpeed?: number; // в часах (среднее время выполнения)
  apiHealth?: 'UP' | 'DOWN' | 'SLOW';
}

export class PredictionService {
  static async getProviderForecasts(): Promise<ProviderForecast[]> {
    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    const forecasts: ProviderForecast[] = [];

    for (const provider of providers) {
      const latestLog = await prisma.providerBalanceLog.findFirst({
        where: { providerId: provider.id },
        orderBy: { createdAt: 'desc' }
      });

      const currentBalance = latestLog?.balance.toNumber() || 0;

      // ИСПОЛЬЗУЕМ ML МОДЕЛЬ
      const ml = await MLForecasterService.predictProviderBurn(provider.id);

      // ПРОВЕРЯЕМ HEALTH API & LATENCY
      const pingResult = await ProviderService.pingProvider(provider.id);

      // РАССЧИТЫВАЕМ СКОРОСТЬ (Execution Speed)
      const recentOrders = await prisma.order.findMany({
        where: { providerName: provider.name, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { createdAt: true, updatedAt: true }
      });

      let avgSpeed = 0;
      if (recentOrders.length > 0) {
        const totalMs = recentOrders.reduce((acc, o) => acc + (o.updatedAt.getTime() - o.createdAt.getTime()), 0);
        avgSpeed = (totalMs / recentOrders.length) / 3600000; // в часы
      }

      const daysLeft = ml.dailyBurnRate > 0 ? currentBalance / ml.dailyBurnRate : 999;
      const recommendedTopUp = ml.dailyBurnRate > 0 ? Math.max(0, (ml.dailyBurnRate * 30) - currentBalance) : 0;

      let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
      if (daysLeft <= 2 || !pingResult.success) status = 'CRITICAL';
      else if (daysLeft <= 5 || pingResult.latency > 2000) status = 'WARNING';

      forecasts.push({
        providerName: provider.name,
        currentBalance,
        dailyBurnRate: ml.dailyBurnRate,
        daysLeft: Math.round(daysLeft),
        recommendedTopUp: Math.ceil(recommendedTopUp),
        status,
        ml,
        latency: pingResult.latency,
        avgSpeed: parseFloat(avgSpeed.toFixed(2)),
        apiHealth: !pingResult.success ? 'DOWN' : (pingResult.latency > 1500 ? 'SLOW' : 'UP')
      });
    }

    return forecasts;
  }

  /**
   * Прогноз дохода на основе текущих заказов
   */
  static async getRevenueForecast() {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: monthStart },
        status: { not: 'CANCELED' }
      },
      select: { totalPrice: true, createdAt: true }
    });

    const totalCurrentRevenue = orders.reduce((acc, o) => acc + o.totalPrice.toNumber(), 0);
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    // Линейный прогноз: (Среднее в день) * Кол-во дней в месяце
    const projectedRevenue = (totalCurrentRevenue / dayOfMonth) * daysInMonth;

    return {
      current: totalCurrentRevenue,
      projected: Math.round(projectedRevenue),
      growth: ((projectedRevenue / totalCurrentRevenue) - 1) * 100
    };
  }
}
