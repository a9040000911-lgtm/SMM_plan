/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';

export interface MLPrediction {
  dailyBurnRate: number;
  confidence: number; // Точность модели в %
  projectedDepletionDate: Date;
  isLearning: boolean;
  historyCount?: number;
  expendituresCount?: number;
  details?: string[];
}

export class MLForecasterService {
  /**
   * Обучает модель на основе истории трат и возвращает прогноз.
   */
  static async predictProviderBurn(providerId: string): Promise<MLPrediction> {
    // 1. Собираем всю историю логов (для обучения модели)
    const logs = await prisma.providerBalanceLog.findMany({
      where: { providerId },
      orderBy: { createdAt: 'asc' }
    });

    if (logs.length < 10) {
      return {
        dailyBurnRate: 0,
        confidence: 0,
        projectedDepletionDate: new Date(),
        isLearning: true,
        historyCount: logs.length,
        expendituresCount: 0,
        details: ['Недостаточно данных истории (< 10 записей).']
      };
    }

    // 2. Извлекаем "Чистые траты" (игнорируем пополнения)
    const expenditures: { delta: number; interval: number }[] = [];
    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1];
      const curr = logs[i];
      const delta = prev.balance.toNumber() - curr.balance.toNumber();

      // Если дельта положительная — это расход. Отрицательная — пополнение.
      if (delta > 0) {
        const timeDiff = curr.createdAt.getTime() - prev.createdAt.getTime();
        expenditures.push({ delta, interval: timeDiff });
      }
    }

    if (expenditures.length < 5) {
      return {
        dailyBurnRate: 0,
        confidence: 10,
        projectedDepletionDate: new Date(),
        isLearning: true,
        historyCount: logs.length,
        expendituresCount: expenditures.length,
        details: ['Недостаточно событий расхода (< 5) для обучения модели.']
      };
    }

    // 3. Линейная регрессия: находим средний расход в миллисекунду
    // y = mx (где y - расход, x - время)
    const totalDelta = expenditures.reduce((acc, e) => acc + e.delta, 0);
    const totalInterval = expenditures.reduce((acc, e) => acc + e.interval, 0);

    const msBurnRate = totalDelta / totalInterval;
    const dailyBurnRate = msBurnRate * (1000 * 60 * 60 * 24);

    // 4. Оценка уверенности (Confidence)
    // Считаем стандартное отклонение трат. Если траты стабильны - уверенность выше.
    const avgDelta = totalDelta / expenditures.length;
    const variance = expenditures.reduce((acc, e) => acc + Math.pow(e.delta - avgDelta, 2), 0) / expenditures.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / avgDelta) * 100));

    // 5. Прогноз даты обнуления
    const currentBalance = logs[logs.length - 1].balance.toNumber();
    const msToLive = currentBalance / msBurnRate;
    const projectedDepletionDate = new Date(Date.now() + msToLive);

    return {
      dailyBurnRate,
      confidence: Math.round(confidence),
      projectedDepletionDate,
      isLearning: false,
      historyCount: logs.length,
      expendituresCount: expenditures.length,
      details: [
        `История: ${logs.length} записей`,
        `Расходных событий: ${expenditures.length}`,
        `Стабильность (StdDev): ${stdDev.toFixed(4)}`,
        confidence < 50 ? 'Низкая уверенность: мало данных или высокая волатильность' : 'Высокая уверенность'
      ]
    };
  }

  /**
   * Прогнозирует время выполнения услуги на основе последних данных.
   * Использует Weighted Moving Average (WMA), чтобы недавние задержки влияли сильнее.
   */
  static async predictCompletionTime(internalServiceId: string): Promise<{ avgSeconds: number; confidence: number }> {
    const lastOrders = await prisma.order.findMany({
      where: {
        internalServiceId,
        status: 'COMPLETED',
        updatedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Последняя неделя
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: { createdAt: true, updatedAt: true }
    });

    if (lastOrders.length < 5) return { avgSeconds: 0, confidence: 0 };

    // Считаем время выполнения в секундах
    const durations = lastOrders.map(o => (o.updatedAt.getTime() - o.createdAt.getTime()) / 1000);

    // Расчет WMA (недавние заказы имеют больший вес)
    let weightedSum = 0;
    let weightSum = 0;
    durations.forEach((d, i) => {
      const weight = durations.length - i; // Первый (самый новый) получает максимальный вес
      weightedSum += d * weight;
      weightSum += weight;
    });

    const wma = weightedSum / weightSum;

    // Расчет уверенности (на основе волатильности / стандартного отклонения)
    const variance = durations.reduce((acc, d) => acc + Math.pow(d - wma, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(100, 100 - (stdDev / wma) * 100));

    return {
      avgSeconds: Math.round(wma),
      confidence: Math.round(confidence)
    };
  }
}
