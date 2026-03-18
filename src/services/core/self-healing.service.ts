/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { AnalyticsService } from '@/services/users/analytics.service';
import { BroadcastService } from '@/services/support/broadcast.service';
import { OrderRefundService } from '@/services/orders/order-refund.service';
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
        isDripFeed: false
      },
      include: { user: true, internalService: true }
    });

    if (stuckOrders.length > 0) {
      console.log(`[Self-Healing] Found ${stuckOrders.length} stuck PENDING orders.`);

      for (const order of stuckOrders) {
        await OrderRefundService.handleRefund(order as any, OrderStatus.CANCELED, 0);

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
        status: 'CANCELED',
        refundedAmount: 0,
        totalPrice: { gt: 0 }
      },
      include: { user: true, internalService: true }
    });

    for (const order of failedOrders) {
      await OrderRefundService.handleRefund(order as any, OrderStatus.CANCELED, 0);
    }
  }

  /**
   * Находит активные услуги с нулевой ценой закупки, отключает их и уведомляет админа
   */
  static async reconcileZeroPriceServices() {
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
      await prisma.internalService.updateMany({
        where: { id: { in: zeroPriceServices.map(s => s.id) } },
        data: { isActive: false }
      });

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

      const list = zeroPriceServices.map(s => `• <b>${s.name}</b> (<code>${s.id}</code>)`).join('\n');
      const alertMsg =
        `🛡 <b>SELF-HEALING: PROFIT GUARD</b>\n` +
        `────────────────────\n` +
        `Услуги отключены из-за 0 закупки:\n\n${list}`;

      await BroadcastService.notifyAdmin(alertMsg);
    }
  }
}


