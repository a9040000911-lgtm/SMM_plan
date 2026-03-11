/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Decimal } from 'decimal.js';
import { LedgerEntryType, Currency } from '@/generated/client';

export class LedgerService {
  /**
   * Определяет, является ли тип операции приходом или расходом.
   * true = приход (+), false = расход (-)
   */
  static isIncome(type: LedgerEntryType): boolean {
    const incomes: LedgerEntryType[] = [
      'DEPOSIT',
      'REFUND',
      'REFERRAL_BONUS',
      'LOYALTY_BONUS'
    ];
    return incomes.includes(type);
  }

  /**
   * Записывает финансовую операцию в Ledger.
   * Должна вызываться внутри Prisma Transaction.
   */
  static async record(
    tx: any,
    userId: string,
    amount: Decimal,
    type: LedgerEntryType,
    referenceId?: string,
    description?: string,
    currencyOverride?: Currency
  ) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { projectId: true, balance: true, currency: true }
    });

    if (!user) throw new Error('User not found for ledger record');

    const balanceBefore = user.balance;
    const currency = currencyOverride || user.currency;

    // Используем централизованную логику знака
    const balanceAfter = this.isIncome(type)
      ? balanceBefore.plus(amount)
      : balanceBefore.minus(amount);

    return await tx.ledgerEntry.create({
      data: {
        projectId: user.projectId,
        userId,
        amount,
        currency,
        balanceBefore,
        balanceAfter,
        type,
        referenceId,
        description
      }
    });
  }
}
