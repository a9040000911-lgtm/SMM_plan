/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Decimal } from 'decimal.js';
import { LedgerEntryType, Currency } from '@/generated/client';
import { prisma } from '@/lib/prisma';
import { ServiceResult } from '../types';

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

  /**
   * Возвращает баланс пользователя.
   */
  static async getUserBalance(userId: string): Promise<ServiceResult<number>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      });
      if (!user) throw new Error('Пользователь не найден');
      return { success: true, data: user.balance.toNumber() };
    } catch (error: any) {
      return { success: false, error: { code: 'BALANCE_FETCH_FAILED', message: error.message } };
    }
  }

  /**
   * Возвращает историю баланса (Ledger Entries).
   */
  static async getUserLedger(userId: string): Promise<ServiceResult<any[]>> {
    try {
      const entries = await prisma.ledgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return { success: true, data: entries };
    } catch (error: any) {
      return { success: false, error: { code: 'LEDGER_FETCH_FAILED', message: error.message } };
    }
  }

  /**
   * Возвращает список платежей (Transactions).
   */
  static async getUserPayments(userId: string): Promise<ServiceResult<any[]>> {
    try {
      const payments = await prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });
      return { success: true, data: payments };
    } catch (error: any) {
      return { success: false, error: { code: 'TRANSACTIONS_FETCH_FAILED', message: error.message } };
    }
  }
}
