/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/services/users';
import { BroadcastService } from '@/services/support';
import { handleRefund } from '@/services/orders/order-processor.service';
import { OrderStatus, TransactionStatus } from '@/generated/client';

export class SelfHealingService {
  /**
   * Главный метод запуска всех проверок "самолечения"
   */
  static async runAllChecks() {
    console.log('[Self-Healing] Starting all reliability checks...');

    try {
      await this.autoMuteUnstableServices();
      await this.recoverStuckOrders();
      await this.cleanupStuckTransactions();
      await this.autoRefundFailedOrders();
      await this.reconcileZeroPriceServices();
    } catch (error: any) {
      console.error('[Self-Healing] Critical error during runAllChecks:', error.message);
    }
  }

  /**
   * Анализирует инциденты и автоматически отключает услуги с критическим процентом отмен
   */
  static async autoMuteUnstableServices() {
    console.log('[Self-Healing] Running instability check...');

    const report = await AnalyticsService.getIncidentReport();
    const actions = [];

    for (const service of report.highFailureServices) {
      if (service.rate >= 70 && service.count >= 5) {
        // Пробуем найти альтернативного провайдера (mapping с более низким приоритетом)
        const mappings = (await prisma.internalServiceMapping.findMany({
          where: { internalServiceId: service.id, isActive: true },
          orderBy: { priority: 'asc' },
          include: { provider: true }
        })) as any[];

        if (mappings.length > 1) {
          // Повышаем приоритет следующего провайдера
          const currentPrimary = mappings[0];
          await prisma.internalServiceMapping.update({
            where: { id: currentPrimary.id },
            data: { priority: 99 }
          });

          await prisma.adminLog.create({
            data: {
              adminId: 'system-self-healing',
              action: 'AUTO_SWITCH',
              targetId: service.id,
              details: `Switched priority for ${service.name}. Old primary ${currentPrimary.provider.name} failed too much (${service.rate}%)`
            }
          });
          actions.push({ ...service, action: 'SWITCHED' });
        } else {
          // Отключаем услугу
          await prisma.internalService.update({
            where: { id: service.id },
            data: { isActive: false }
          });

          await prisma.adminLog.create({
            data: {
              adminId: 'system-self-healing',
              action: 'AUTO_MUTE',
              targetId: service.id,
              details: `Service auto-muted (no alternatives) due to ${service.rate}% failure rate`
            }
          });
          actions.push({ ...service, action: 'MUTED' });
        }
      }
    }

    if (actions.length > 0) {
      const list = actions.map(s =>
        `${s.action === 'SWITCHED' ? '🔄' : '🔴'} <b>${s.name}</b> (${s.rate}% Fail -> ${s.action})`
      ).join('\n');

      const alertMsg =
        `🛡 <b>SELF-HEALING REPORT</b>\n` +
        `────────────────────\n` +
        `Меры по стабилизации:\n\n${list}`;

      await BroadcastService.notifyAdmin(alertMsg);
    }

    return actions;
  }

  /**
   * Находит заказы, которые "застряли" в статусе PENDING слишком долго
   */
  static async recoverStuckOrders() {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60000);

    const stuckOrders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: { lt: fifteenMinsAgo },
        isDripFeed: false // Drip-feed обрабатывается отдельно
      }
    });

    if (stuckOrders.length > 0) {
      console.log(`[Self-Healing] Found ${stuckOrders.length} stuck PENDING orders.`);

      for (const order of stuckOrders) {
        // Маркируем как ERROR, чтобы воркеры не пытались бесконечно его пинать, 
        // или чтобы admin мог увидеть проблему.
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELED, // Лучше отменить и вернуть деньги
          }
        });

        await handleRefund(order, OrderStatus.CANCELED, 0);

        await prisma.adminLog.create({
          data: {
            adminId: 'system-self-healing',
            action: 'AUTO_REFUND_STUCK',
            targetId: order.id.toString(),
            details: `Order stuck in PENDING for >15m. Auto-refunded.`
          }
        });
      }
    }
  }

  /**
   * Очищает старые незавершенные транзакции пополнения
   */
  static async cleanupStuckTransactions() {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60000);

    const count = await prisma.transaction.updateMany({
      where: {
        status: TransactionStatus.PENDING,
        type: 'DEPOSIT',
        createdAt: { lt: twoHoursAgo }
      },
      data: {
        status: TransactionStatus.ERROR
      }
    });

    if (count.count > 0) {
      console.log(`[Self-Healing] Cleaned up ${count.count} old PENDING transactions.`);
    }
  }

  /**
   * Автоматически возвращает деньги за заказы со статусом ERROR
   */
  static async autoRefundFailedOrders() {
    const failedOrders = await prisma.order.findMany({
      where: {
        status: 'CANCELED', // В нашей системе ERROR часто переходит в CANCELED для возврата
        refundedAmount: 0,
        totalPrice: { gt: 0 }
      }
    });

    for (const order of failedOrders) {
      // handleRefund уже безопасно проверяет двойные возвраты
      await handleRefund(order, OrderStatus.CANCELED, 0);
    }
  }

  /**
   * Находит активные услуги с нулевой ценой закупки, отключает их и уведомляет админа
   */
  static async reconcileZeroPriceServices() {
    console.log('[Self-Healing] Reconciling zero price services...');

    const zeroPriceServices = await prisma.internalService.findMany({
      where: {
        isActive: true,
        OR: [
          { lastProviderPrice: 0 },
          { lastProviderPrice: null }
        ]
      },
      select: { id: true, name: true }
    });

    if (zeroPriceServices.length > 0) {
      // 1. Disable these services
      await prisma.internalService.updateMany({
        where: { id: { in: zeroPriceServices.map(s => s.id) } },
        data: { isActive: false }
      });

      // 2. Log to AdminLog for each
      for (const svc of zeroPriceServices) {
        await prisma.adminLog.create({
          data: {
            adminId: 'system-self-healing',
            action: 'AUTO_MUTE',
            targetId: svc.id,
            details: `Service auto-muted due to 0.00 provider price (Profit Guard v2 protection)`
          }
        });
      }

      // 3. Notify Admin
      const list = zeroPriceServices
        .map(s => `• <b>${s.name}</b> (<code>${s.id}</code>)`)
        .join('\n');

      const alertMsg =
        `🛡 <b>SELF-HEALING: PROFIT GUARD</b>\n` +
        `────────────────────\n` +
        `Следующие услуги были <b>АВТОМАТИЧЕСКИ ОТКЛЮЧЕНЫ</b> из-за нулевой цены закупки:\n\n` +
        `${list}\n\n` +
        `<i>Продажи заблокированы для предотвращения убытков.</i>`;

      await BroadcastService.notifyAdmin(alertMsg);
      console.log(`[Self-Healing] Auto-muted ${zeroPriceServices.length} zero-price services.`);
    }
  }
}
