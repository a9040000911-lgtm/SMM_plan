/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { bot } from '@/lib/bot';
import { ConfigService } from '@/lib/config.service';
import { CurrencyService } from './currency.service';
import { LedgerService } from './ledger.service';
import { safeAdminExecute } from '../utils';
import { AdminContext, AdminServiceResult } from '../types';

export class ReconciliationService {
  /**
   * Проверяет целостность балансов всех пользователей.
   */
  static async auditAllUsers(ctx?: AdminContext): Promise<AdminServiceResult<any[]>> {
    const systemCtx: AdminContext = ctx || { userId: 'system', role: 'ADMIN', isGlobalAdmin: true, allowedProjects: [] };
    return safeAdminExecute(systemCtx, 'AUDIT_ALL_USERS', async () => {
        const users = await prisma.user.findMany({
          include: {
            _count: { select: { ledgerEntries: true } }
          }
        });

        const discrepancies = [];

        for (const user of users) {
          if (user._count.ledgerEntries === 0 && user.balance.isZero()) continue;

          // auditUser теперь возвращает данные, а не кидает ошибку
          const audit = await this.auditUserInternal(user.id);
          if (!audit.isConsistent) {
            const isCritical = audit.difference.abs().gt(10);

            if (isCritical) {
              await prisma.user.update({
                where: { id: user.id },
                data: { supportNotes: `[AUTO-FREEZE] Financial discrepancy: ${audit.difference} RUB. Audit date: ${new Date().toISOString()}` }
              });
              console.warn(`[Reconciliation] User ${user.id} auto-flagged due to critical discrepancy.`);
            }

            discrepancies.push({
              userId: user.id,
              username: user.username || user.tgId?.toString(),
              currency: user.currency,
              isCritical,
              ...audit
            });
          }
        }

        if (discrepancies.length > 0) {
          await this.notifyAdmin(discrepancies);
        }

        await prisma.settings.upsert({
          where: { projectId_key: { projectId: 'global', key: 'LAST_FINANCIAL_AUDIT' } },
          update: {
            value: JSON.stringify({
              timestamp: new Date().toISOString(),
              discrepanciesCount: discrepancies.length
            })
          },
          create: {
            projectId: 'global',
            key: 'LAST_FINANCIAL_AUDIT',
            value: JSON.stringify({
              timestamp: new Date().toISOString(),
              discrepanciesCount: discrepancies.length
            })
          }
        });

        return discrepancies;
    });
  }

  /**
   * Внутренний метод без обертки для использования в циклах
   */
  private static async auditUserInternal(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ledgerEntries: { orderBy: { createdAt: 'asc' } } }
    });

    if (!user) throw new Error(`User ${userId} not found`);

    let calculatedBalance = new Decimal(0);

    for (const entry of user.ledgerEntries) {
      let entryAmount = entry.amount;

      if (entry.currency !== user.currency) {
        // Добавляем fallback для CurrencyService.convert
        try {
            entryAmount = await CurrencyService.convert(entry.amount, entry.currency, user.currency);
        } catch (e) {
            console.error(`[Reconciliation] Currency conversion failed for user ${userId}:`, e);
            // Продолжаем с 0 или пропускаем, чтобы не вешать весь процесс
        }
      }

      if (LedgerService.isIncome(entry.type)) {
        calculatedBalance = calculatedBalance.plus(entryAmount);
      } else {
        calculatedBalance = calculatedBalance.minus(entryAmount);
      }
    }

    const diff = user.balance.minus(calculatedBalance).abs();
    const isConsistent = diff.lt(0.1);

    return {
      isConsistent,
      actualBalance: user.balance,
      expectedBalance: calculatedBalance,
      difference: user.balance.minus(calculatedBalance)
    };
  }

  /**
   * Публичный метод с оберткой
   */
  static async auditUser(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any>> {
      return safeAdminExecute(ctx, 'AUDIT_USER', () => this.auditUserInternal(userId));
  }

  private static async notifyAdmin(discrepancies: any[]) {
    try {
        const config = await ConfigService.getTelegramConfig();
        const adminId = config.adminId;
        if (!adminId) return;

        let report = `🚨 <b>FINANCIAL INTEGRITY ALERT</b>\n`;
        report += `Обнаружено расхождений: <b>${discrepancies.length}</b>\n\n`;

        for (const d of discrepancies.slice(0, 5)) {
          report += `👤 <b>${d.username}</b>\n`;
          report += `└ В базе: <code>${d.actualBalance}</code>\n`;
          report += `└ По логам: <code>${d.expectedBalance}</code>\n`;
          report += `└ Разница: <b>${d.difference}</b>\n\n`;
        }

        await bot.telegram.sendMessage(adminId, report, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('Audit report failed:', e);
    }
  }
}
