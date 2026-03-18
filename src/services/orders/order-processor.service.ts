/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Decimal } from 'decimal.js';
import { OrderStatus } from '@/generated/client';
import { OrderActivationService } from './order-activation.service';
import { PaymentConfirmationService } from './payment-confirmation.service';
import { OrderQueueService } from './order-queue.service';
import { OrderSyncService } from './order-sync.service';
import { ProviderMonitorService } from './provider-monitor.service';
import { OrderRefundService } from './order-refund.service';


/**
 * Основной фасад для работы с заказами.
 * Делегирует выполнение специализированным сервисам (Queue, Refund, Payment, Monitor, Activation).
 * @deprecated Use specific services directly: OrderActivationService, OrderQueueService, etc.
 */
export class OrderProcessor {
  /**
   * Создает заказ в базе данных, списывает баланс и уведомляет админов.
   */
  static async initiateOrder(data: {
    userId: string,
    serviceId: string,
    projectId: string | null,
    link: string,
    qty: number,
    inviteLink?: string,
    totalPrice: Decimal,
    costPrice?: Decimal,
    discountAmount?: Decimal,
    promoId?: string,
    isDripFeed?: boolean,
    dripFeed?: any,
    tgId?: number,
    username?: string,
    unitName?: string,
    isManual?: boolean
  }, tx?: any) {
    return OrderActivationService.initiateOrder(data, tx);
  }

  // --- ДЕЛЕГИРОВАНИЕ ---

  static async confirmPayment(paymentId: string) {
    return PaymentConfirmationService.confirmPayment(paymentId);
  }

  static async syncPaymentsStatus() {
    return PaymentConfirmationService.syncPaymentsStatus();
  }

  static async processPendingOrders(specificOrderId?: number) {
    return OrderQueueService.processPendingOrders(specificOrderId);
  }

  static async processDripFeedRun(orderId: number) {
    return OrderQueueService.processDripFeedRun(orderId);
  }

  static async tryAutoRefill(orderId: number) {
    return OrderSyncService.tryAutoRefill(orderId);
  }

  static async syncOrdersStatus(orderIds?: number[]) {
    return OrderSyncService.syncAllActive(orderIds);
  }

  static async monitorProviderBalance() {
    return ProviderMonitorService.monitorProviderBalance();
  }

  static async handleRefund(o: any, newS: OrderStatus, rem: number, providerRawResponse?: any) {
    return OrderRefundService.handleRefund(o, newS, rem, providerRawResponse);
  }

  static async processManualRefund(orderId: number, type: 'INTERNAL' | 'EXTERNAL', addBonus: boolean = false, adminId?: string) {
    return OrderRefundService.processManualRefund(orderId, type, addBonus, adminId);
  }
}

// ЭКСПОРТ СТАРЫХ ФУНКЦИЙ ДЛЯ СОВМЕСТИМОСТИ
export const initiateOrder = OrderProcessor.initiateOrder;
export const confirmPayment = OrderProcessor.confirmPayment;
export const processPendingOrders = OrderProcessor.processPendingOrders;
export const syncOrdersStatus = OrderProcessor.syncOrdersStatus;
export const monitorProviderBalance = OrderProcessor.monitorProviderBalance;
export const handleRefund = OrderProcessor.handleRefund;
export const processManualRefund = OrderProcessor.processManualRefund;
export const tryAutoRefill = OrderProcessor.tryAutoRefill;
export const processDripFeedRun = OrderProcessor.processDripFeedRun;
export const syncPaymentsStatus = OrderProcessor.syncPaymentsStatus;


