/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { bot } from '@/lib/bot';

export class RetentionService {
  /**
   * Запускает ежедневную проверку "заснувших" пользователей
   */
  static async runDailyCheck() {
    console.log('--- RUNNING RETENTION CHECK ---');
    
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Сценарий 1: "Первопроходец" без заказов (через 3 дня после рег)
    const newPioneersNoOrders = await prisma.user.findMany({
      where: {
        isEarlyBird: true,
        orders: { none: {} },
        lastNotificationAt: null,
        createdAt: { lte: threeDaysAgo }
      }
    });

    for (const u of newPioneersNoOrders) {
      await this.sendNudge(u.id, Number(u.tgId), 
        `💎 <b>Ваш статус Первопроходца активен!</b>\n\nВы один из первых 300 пользователей с <b>постоянной скидкой 20%</b>. \n\n🚀 Самое время сделать свой первый заказ и убедиться в качестве! Если нужна помощь с выбором — просто отправьте ссылку на канал.`
      );
    }

    // Сценарий 2: Перестал заказывать (7 дней тишины)
    const inactivePioneers = await prisma.user.findMany({
      where: {
        isEarlyBird: true,
        lastNotificationAt: { lte: sevenDaysAgo }, // Не уведомляли неделю
        orders: {
            some: { createdAt: { lte: sevenDaysAgo } } // Последний заказ был давно
        }
      },
      include: {
          orders: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    for (const u of inactivePioneers) {
        // Проверяем, что последний заказ реально был больше 7 дней назад
        const lastOrder = u.orders[0];
        if (lastOrder && new Date(lastOrder.createdAt) <= sevenDaysAgo) {
            await this.sendNudge(u.id, Number(u.tgId), 
                `👋 <b>Мы скучаем!</b>\n\nВаша скидка 20% скучает без дела. В магазине появились новые услуги и обновленные тарифы на подписчиков. \n\n📈 Загляните в @smmplan_bot, чтобы продолжить рост!`
            );
        }
    }
  }

  private static async sendNudge(userId: string, tgId: number, text: string) {
    try {
      await bot.telegram.sendMessage(tgId, text, { parse_mode: 'HTML' });
      await prisma.user.update({
        where: { id: userId },
        data: { lastNotificationAt: new Date() }
      });
      console.log(`[Retention] Nudge sent to user ${tgId}`);
    } catch (err) {
      console.error(`[Retention] Failed to nudge ${tgId}:`, err);
    }
  }
}
