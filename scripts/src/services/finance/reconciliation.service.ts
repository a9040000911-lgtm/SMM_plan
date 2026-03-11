/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { bot } from '@/lib/bot';
import { ConfigService } from '@/lib/config.service';
import { CurrencyService } from '@/services/finance';
import { LedgerService } from '@/services/finance';

export class ReconciliationService {
  /**
   * Проверяет целостность балансов всех пользователей.
   */
  static async auditAllUsers() {
    const users = await prisma.user.findMany({
      include: {
        _count: { select: { ledgerEntries: true } }
      }
    });

    const discrepancies = [];

    for (const user of users) {
      if (user._count.ledgerEntries === 0 && user.balance.isZero()) continue;

      const audit = await this.auditUser(user.id);
      if (!audit.isConsistent) {
        // --- AUTO-FREEZE LOGIC ---
        // Если расхождение больше 10 руб — блокируем роль до выяснения
        const isCritical = audit.difference.abs().gt(10);

        if (isCritical) {
          await prisma.user.update({
            where: { id: user.id },
            data: { supportNotes: `[AUTO-FREEZE] Financial discrepancy: ${audit.difference} RUB. Audit date: ${new Date().toISOString()}` }
          });
          console.warn(`[Reconciliation] User ${user.id} auto-flagged due to critical discrepancy.`);
        }
        // -------------------------

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

    // Сохраняем результат в системные настройки для дашборда
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
  }

  /**
   * Проверяет конкретного пользователя
   */
  static async auditUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { ledgerEntries: { orderBy: { createdAt: 'asc' } } }
    });

    if (!user) throw new Error('User not found');

    let calculatedBalance = new Decimal(0);

    for (const entry of user.ledgerEntries) {
      let entryAmount = entry.amount;

      // Конвертируем в текущую валюту юзера если нужно
      if (entry.currency !== user.currency) {
        entryAmount = await CurrencyService.convert(entry.amount, entry.currency, user.currency);
      }

      // Используем единую логику знака из LedgerService
      if (LedgerService.isIncome(entry.type)) {
        calculatedBalance = calculatedBalance.plus(entryAmount);
      } else {
        calculatedBalance = calculatedBalance.minus(entryAmount);
      }
    }

    const diff = user.balance.minus(calculatedBalance).abs();
    const isConsistent = diff.lt(0.1); // Допускаем микро-погрешность округления

    return {
      isConsistent,
      actualBalance: user.balance,
      expectedBalance: calculatedBalance,
      difference: user.balance.minus(calculatedBalance)
    };
  }

  private static async notifyAdmin(discrepancies: any[]) {
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

    try {
      await bot.telegram.sendMessage(adminId, report, { parse_mode: 'HTML' });
    } catch (e) {
      console.error('Audit report failed:', e);
    }
  }
}
