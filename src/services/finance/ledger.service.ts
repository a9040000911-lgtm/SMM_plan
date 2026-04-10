/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { Decimal } from 'decimal.js';
import { LedgerEntryType, Currency, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ServiceResult } from '../types';
import { UserRepository } from '../repositories/user.repository';

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
    tx: Prisma.TransactionClient,
    userId: string,
    amount: Decimal,
    type: LedgerEntryType,
    referenceId?: string,
    description?: string,
    _currencyOverride?: Currency,
    balanceAfterOverride?: Decimal
  ) {
    const user = await UserRepository.findById(userId, tx);

    if (!user) throw new Error('User not found for ledger record');

    const balanceAfter = balanceAfterOverride || (this.isIncome(type) ? user.balance.plus(amount) : user.balance.minus(amount));
    const balanceBefore = balanceAfterOverride 
      ? (this.isIncome(type) ? balanceAfterOverride.minus(amount) : balanceAfterOverride.plus(amount))
      : user.balance;

    return await tx.ledgerEntry.create({
      data: {
        projectId: user.projectId,
        userId,
        amount,
        type: type,
        referenceId: referenceId || `LEDGER_${Date.now()}`,
        description,
        balanceBefore,
        balanceAfter
      }
    });
  }

  /**
   * Возвращает баланс пользователя.
   */
  static async getUserBalance(userId: string): Promise<ServiceResult<number>> {
    try {
      const user = await UserRepository.findById(userId);
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


