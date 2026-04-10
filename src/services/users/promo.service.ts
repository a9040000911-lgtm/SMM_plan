/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';

export class PromoService {
  /**
   * Выдает промокод пользователю
   */
  /**
   * Выдает промокод пользователю
   */
  static async issuePromo(userId: string, tgId: number | bigint, percent: number, reason: string, projectId?: string | null, tx?: any) {
    const db = tx || prisma;
    const code = `PROMO${percent}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    try {
      const promo = await db.promoCode.create({
        data: {
          code,
          discountPercent: percent,
          description: reason,
          projectId: projectId || null,
        }
      });

      await db.userPromo.create({
        data: {
          userId,
          promoCodeId: promo.id
        }
      });

      const { BotRegistry } = await import('@/services/bot/bot-registry');
      await BotRegistry.get(projectId).telegram.sendMessage(
        tgId.toString(),
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
  static async validatePromo(code: string, userId: string, projectId?: string | null) {
    const whereClause: any = { code: code.toUpperCase(), isActive: true };
    if (projectId) {
      whereClause.OR = [{ projectId: projectId }, { projectId: null }];
    }

    const promo = await prisma.promoCode.findFirst({
      where: whereClause
    });

    if (!promo) return { valid: false, error: 'Промокод не найден' };

    // L-08 FIX: Check expiration date
    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return { valid: false, error: 'Промокод истёк' };
    }

    // L-08 FIX: Check global usage limit
    if (promo.maxUses !== null && promo.currentUses >= promo.maxUses) {
      return { valid: false, error: 'Лимит использований исчерпан' };
    }

    const userPromo = await prisma.userPromo.findUnique({
      where: { userId_promoCodeId: { userId, promoCodeId: promo.id } }
    });

    if (userPromo && userPromo.usedAt) {
      return { valid: false, error: 'Уже использован' };
    }

    return { valid: true, promo };
  }

  /**
   * Триггер: Новый клиент (5%)
   */
  static async checkNewClient(userId: string, tgId: number | bigint, tx?: any) {
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
  static async checkLargeDeposit(userId: string, tgId: number | bigint, amount: number, tx?: any) {
    const db = tx || prisma;
    if (amount >= 2000) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { projectId: true } });
      await this.issuePromo(userId, tgId, 10, 'Бонус за крупное пополнение', user?.projectId, tx);
    }
  }

  /**
   * Триггер: Траты 10000+ (10%)
   */
  static async checkLoyaltySpend(userId: string, tgId: number | bigint, totalSpent: Decimal | number, tx?: any) {
    // Deprecated for automation rules
    await this.processAutomationRules('SPEND_GTE', { userId, tgId, value: new Decimal(totalSpent) as any }, tx);
  }

  /**
   * Process dynamic automation rules for rewards
   */
  static async processAutomationRules(trigger: string, context: { userId: string, tgId?: number | bigint, value: Decimal | number, projectId?: string }, tx?: any) {
    const db = tx || prisma;
    const value = new Decimal(context.value);
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
        if (value.lt(rule.conditionValue)) continue;

        // Idempotency Check using SystemLog
        const logAction = `${trigger}:${rule.conditionValue}`;
        const existingLog = await db.systemLog.findFirst({
          where: { userId: context.userId, type: 'LOYALTY', action: logAction }
        });

        if (existingLog) continue;

        // Apply Reward
        if (rule.rewardType === 'PROMO_ISSUE') {
          const promoCode = await this.issuePromo(context.userId, 0, rule.rewardValue, `${rule.description} (Auto)`, context.projectId, db);

          if (promoCode) {
            await this.createLoyaltyLog(context.userId, context.projectId, logAction, `PROMO:${promoCode}`, rule.rewardValue, db); // Using rewardValue as approximation of value, though for promo it's %
            if (context.tgId) {
              const { BotRegistry } = await import('@/services/bot/bot-registry');
              await BotRegistry.get(context.projectId).telegram.sendMessage(context.tgId.toString(), `🎁 <b>Бонус!</b>\nВы получили промокод за достижение: ${rule.description}`, { parse_mode: 'HTML' }).catch(() => { });
            }
          }

        } else if (rule.rewardType === 'BALANCE_ADD' && context.projectId) {
          await db.user.update({
            where: { id: context.userId },
            data: { balance: { increment: rule.rewardValue } }
          });

          await this.createLoyaltyLog(context.userId, context.projectId, logAction, `BALANCE:+${rule.rewardValue}`, rule.rewardValue, db);

          if (context.tgId) {
            const { BotRegistry } = await import('@/services/bot/bot-registry');
            await BotRegistry.get(context.projectId).telegram.sendMessage(context.tgId.toString(), `🎉 <b>Бонус!</b>\nВы получили +${rule.rewardValue}₽ на баланс за достижение: ${rule.description}`, { parse_mode: 'HTML' }).catch(() => { });
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
      await db.systemLog.create({
        data: {
          userId,
          projectId,
          type: 'LOYALTY',
          action: trigger,
          details: reward,
          metadata: { value }
        }
      });
    } catch (e) {
      console.error('Failed to create loyalty log (possible duplicate race condition):', e);
    }
  }
}


