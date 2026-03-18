/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { PricingService } from '@/services/finance';
import { bot } from '@/services/bot/bot-registry';
import axios from 'axios';
import { autoMonitoringQueue } from '@/services/core/queues';
import { createLogger } from '@/lib/logger';
import { OrderActivationService } from './order-activation.service';
import { NotificationTemplates } from '@/bot/utils/notification-templates';
import { BotRegistry } from '@/services/bot/bot-registry';

export class AutoMonitoringService {
  private static logger = createLogger('AutoMonitoringService');

  /**
   * Получает ID последнего поста из публичного превью канала
   */
  private static async fetchLastPostId(channelLink: string): Promise<string | null> {
    try {
      const username = channelLink.split('/').pop()?.replace('@', '');
      if (!username) return null;

      const response = await axios.get(`https://t.me/s/${username}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const html = response.data;
      const matches = html.match(/data-post="${username}\/(\d+)"/g);
      if (matches && matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        const id = lastMatch.match(/\/(\d+)"/)?.[1];
        return id || null;
      }
      return null;
    } catch (e) {
      this.logger.error(`[Auto-Monitor] Fetch error for ${channelLink}:`, e);
      return null;
    }
  }

  /**
   * Проверяет все активные подписки на наличие новых постов
   */
  static async checkNewPosts() {
    const active = await prisma.autoMonitoring.findMany({
      where: {
        isActive: true,
        postsProcessed: { lt: prisma.autoMonitoring.fields.postsLimit }
      },
      include: {
        user: true,
        internalService: true,
        project: true
      }
    });

    this.logger.info(`[Auto-Monitor] Checking ${active.length} active monitors...`);

    for (const task of active) {
      try {
        const currentLastId = await this.fetchLastPostId(task.link);

        if (currentLastId && currentLastId !== task.lastPostId) {
          this.logger.info(`[Auto-Monitor] New post detected in ${task.link}: ID ${currentLastId}`);

          if (task.lastPostId) {
            const postUrl = `https://t.me/${task.link.split('/').pop()}/${currentLastId}`;

            // --- PHASE 12: SMART PACING (Delayed Processing from Project Settings) ---
            const settings = task.project?.marketerSettings as any;
            const projectDelay = settings?.defaultDelayMinutes || 0;
            const delay = (task.delayMinutes || projectDelay || 0) * 60 * 1000;

            await autoMonitoringQueue.add(
              `post-${task.id}-${currentLastId}`,
              { taskId: task.id, postUrl },
              { delay }
            );

            this.logger.info(`[Auto-Monitor] Scheduled processing for ${postUrl} with delay ${task.delayMinutes || projectDelay}m`);
          }

          await prisma.autoMonitoring.update({
            where: { id: task.id },
            data: { lastPostId: currentLastId }
          });
        }
      } catch (e) {
        this.logger.error(`[Auto-Monitor] Task ${task.id} failed:`, e);
      }
    }
  }

  /**
   * Запускает заказ для нового найденного поста
   */
  static async processNewPost(taskId: string, postUrl: string) {
    const task = await prisma.autoMonitoring.findUnique({
      where: { id: taskId },
      include: { user: true, internalService: true, project: true }
    });

    if (!task || !task.isActive) return;

    const details = await PricingService.calculateOrderDetails(task.user.id, task.internalServiceId, task.quantity, task.projectId);

    if (task.user.balance.lt(details.finalPrice)) {
      await prisma.autoMonitoring.update({ where: { id: task.id }, data: { isActive: false } });
      await bot.telegram.sendMessage(
        Number(task.user.tgId),
        `⚠️ <b>Авто-пилот приостановлен!</b>\n\nНедостаточно средств для обработки нового поста в канале <code>${task.link}</code>.\nПополните баланс и включите его снова в разделе "Мои заказы".`,
        { parse_mode: 'HTML' }
      ).catch(() => { });
      return;
    }

    // Use OrderActivationService to ensure full business logic:
    // LedgerEntry, PromoService loyalty bonuses, ManagedChannel linking, admin notification.
    const order = await OrderActivationService.initiateOrder({
      userId: task.userId,
      serviceId: task.internalServiceId,
      projectId: task.projectId,
      link: postUrl,
      qty: task.quantity,
      totalPrice: details.finalPrice,
      tgId: Number(task.user.tgId),
      isDripFeed: task.isDripFeed,
      dripFeed: task.isDripFeed && task.dripRuns
        ? { runs: task.dripRuns, interval: task.dripInterval || 0 }
        : undefined,
      isManual: false,
    });

    // Update post counter
    await prisma.autoMonitoring.update({
      where: { id: task.id },
      data: { postsProcessed: { increment: 1 } }
    });

    // Notify user via project-specific bot
    await BotRegistry.get(task.projectId).telegram.sendMessage(
      Number(task.user.tgId),
      `🤖 <b>Авто-пилот: Обнаружен новый пост!</b>\n────────────────────\n🔗 Ссылка: ${postUrl}\n${NotificationTemplates.ORDER.CREATED_USER(order.id, task.internalService.name)}`,
      { parse_mode: 'HTML' }
    ).catch(() => { });
  }
}


