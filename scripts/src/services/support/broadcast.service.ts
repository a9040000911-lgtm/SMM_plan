/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { bot } from '@/lib/bot';
import { ConfigService } from '@/lib/config.service';
import { prisma } from '@/lib/prisma';

export class BroadcastService {
  // private static adminId = process.env.ADMIN_TG_ID; // Removed static init

  static async getAdminId() {
    return (await ConfigService.getTelegramConfig()).adminId;
  }

  /**
   * Экранирует HTML спецсимволы для безопасной отправки в Telegram
   */
  static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Отправить новость всем пользователям
   */
  static async sendNews(newsId: string) {
    const news = await prisma.news.findUnique({ where: { id: newsId } });
    if (!news) return { success: false, error: 'News not found' };

    const users = await prisma.user.findMany({
      where: { projectId: news.projectId || undefined, tgId: { not: null } },
      select: { tgId: true }
    });

    let successCount = 0;
    let failCount = 0;

    const message = `📰 <b>${BroadcastService.escapeHtml(news.title)}</b>\n\n${BroadcastService.escapeHtml(news.content)}`;

    for (const user of users) {
      if (!user.tgId) continue;
      try {
        if (news.imageUrl) {
          await bot.telegram.sendPhoto(Number(user.tgId), news.imageUrl, {
            caption: message,
            parse_mode: 'HTML'
          });
        } else {
          await bot.telegram.sendMessage(Number(user.tgId), message, {
            parse_mode: 'HTML'
          });
        }
        successCount++;
      } catch (_e) {
        failCount++;
      }
      // Small delay to avoid hitting limits too hard
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    return { success: true, successCount, failCount };
  }

  /**
   * Отправить критическое уведомление администратору
   */
  static async notifyAdmin(message: string) {
    const adminId = await this.getAdminId();
    if (!adminId || !bot?.telegram) return;
    try {
      await bot.telegram.sendMessage(Number(adminId), message, { parse_mode: 'HTML' });
    } catch (_e) {
      console.error('[Broadcast] Failed to notify admin:', _e);
    }
  }

  /**
   * Отправить сервисное уведомление пользователю
   */
  static async notifyUser(tgId: bigint, message: string, projectId?: string | null) {
    if (!tgId) return;

    try {
      const { BotRegistry } = await import('@/lib/bot');
      const botInstance = BotRegistry.get(projectId);

      if (!botInstance?.telegram) return;

      await botInstance.telegram.sendMessage(Number(tgId), message, { parse_mode: 'HTML' });
    } catch (_e) {
      console.error('[Broadcast] Failed to notify user:', _e);
      // Игнорируем ошибки (напр. бот заблокирован)
    }
  }
}
