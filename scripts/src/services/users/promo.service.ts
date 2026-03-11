/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';

export class PromoService {
  /**
   * Выдает промокод пользователю
   */
  /**
   * Выдает промокод пользователю
   */
  static async issuePromo(userId: string, tgId: number, percent: number, reason: string, projectId?: string | null, tx?: any) {
    const db = tx || prisma;
    const code = `PROMO${percent}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    try {
      const promo = await db.promoCode.create({
        data: {
          code,
          discountPercent: percent,
          description: reason,
        }
      });

      await db.userPromo.create({
        data: {
          userId,
          promoCodeId: promo.id
        }
      });

      const { BotRegistry } = await import('@/lib/bot');
      await BotRegistry.get(projectId).telegram.sendMessage(
        tgId,
        `🎁 <b>Вам начислен промокод на скидку ${percent}%!</b>\n\n` +
        `Код: <code>${code}</code>\n` +
        `Причина: ${reason}\n\n` +
        `Вы можете применить его при следующем заказе.`,
        { parse_mode: 'HTML' }
      );

      return code;
    } catch (error) {
      console.error('[Promo issue error]', error);
      return null;
    }
  }

  /**
   * Проверяет промокод
   */
  static async validatePromo(code: string, userId: string) {
    const promo = await prisma.promoCode.findFirst({
      where: { code: code.toUpperCase(), isActive: true }
    });

    if (!promo) return { valid: false, error: 'Промокод не найден' };

    const usageCount = await prisma.userPromo.count({
      where: { userId, promoCodeId: promo.id, usedAt: { not: null } }
    });

    if (usageCount > 0) return { valid: false, error: 'Уже использован' };

    return { valid: true, promo };
  }

  /**
   * Триггер: Новый клиент (5%)
   */
  static async checkNewClient(userId: string, tgId: number, tx?: any) {
    const db = tx || prisma;
    const existing = await db.userPromo.findFirst({
      where: { userId, promoCode: { discountPercent: 5 } }
    });
    if (!existing) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { projectId: true } });
      await this.issuePromo(userId, tgId, 5, 'Приветственный бонус для нового клиента', user?.projectId, db);
    }
  }

  /**
   * Триггер: Пополнение на 2000+ (10%)
   */
  static async checkLargeDeposit(userId: string, tgId: number, amount: number, tx?: any) {
    const db = tx || prisma;
    if (amount >= 2000) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { projectId: true } });
      await this.issuePromo(userId, tgId, 10, 'Бонус за крупное пополнение', user?.projectId, tx);
    }
  }

  /**
   * Триггер: Траты 10000+ (10%)
   */
  static async checkLoyaltySpend(userId: string, tgId: number, totalSpent: number, tx?: any) {
    // Deprecated for automation rules
    await this.processAutomationRules('SPEND_GTE', { userId, tgId, value: totalSpent }, tx);
  }

  /**
   * Process dynamic automation rules for rewards
   */
  static async processAutomationRules(trigger: string, context: { userId: string, tgId?: number, value: number, projectId?: string }, tx?: any) {
    const db = tx || prisma;
    const rules = await db.settings.findFirst({
      where: { key: 'REWARD_RULES_JSON', projectId: context.projectId || null }
    });

    if (!rules) return;

    try {
      const parsedRules = JSON.parse(rules.value) as Array<{
        trigger: string;
        conditionValue: number;
        rewardType: 'PROMO_ISSUE' | 'BALANCE_ADD';
        rewardValue: number;
        description: string;
      }>;

      for (const rule of parsedRules) {
        if (rule.trigger !== trigger) continue;
        if (context.value < rule.conditionValue) continue;

        // Idempotency Check using LoyaltyLog
        const logId = `${trigger}:${rule.conditionValue}`;
        const existingLog = await db.loyaltyLog.findFirst({
          where: { userId: context.userId, trigger: logId }
        });

        if (existingLog) continue;

        // Apply Reward
        if (rule.rewardType === 'PROMO_ISSUE') {
          const promoCode = await this.issuePromo(context.userId, 0, rule.rewardValue, `${rule.description} (Auto)`, context.projectId, db);

          if (promoCode) {
            await this.createLoyaltyLog(context.userId, context.projectId, logId, `PROMO:${promoCode}`, rule.rewardValue, db); // Using rewardValue as approximation of value, though for promo it's %
            if (context.tgId) {
              const { BotRegistry } = await import('@/lib/bot');
              await BotRegistry.get(context.projectId).telegram.sendMessage(context.tgId, `🎁 <b>Бонус!</b>\nВы получили промокод за достижение: ${rule.description}`, { parse_mode: 'HTML' }).catch(() => { });
            }
          }

        } else if (rule.rewardType === 'BALANCE_ADD' && context.projectId) {
          await db.user.update({
            where: { id: context.userId },
            data: { balance: { increment: rule.rewardValue } }
          });

          await this.createLoyaltyLog(context.userId, context.projectId, logId, `BALANCE:+${rule.rewardValue}`, rule.rewardValue, db);

          if (context.tgId) {
            const { BotRegistry } = await import('@/lib/bot');
            await BotRegistry.get(context.projectId).telegram.sendMessage(context.tgId, `🎉 <b>Бонус!</b>\nВы получили +${rule.rewardValue}₽ на баланс за достижение: ${rule.description}`, { parse_mode: 'HTML' }).catch(() => { });
          }
        }
      }
    } catch (e) {
      console.error('Failed to process automation rules:', e);
    }
  }

  static async createLoyaltyLog(userId: string, projectId: string | undefined, trigger: string, reward: string, value: number, tx?: any) {
    const db = tx || prisma;
    try {
      await db.loyaltyLog.create({
        data: {
          userId,
          projectId,
          trigger,
          reward,
          value,
        }
      });
    } catch (e) {
      console.error('Failed to create loyalty log (possible duplicate race condition):', e);
    }
  }
}
