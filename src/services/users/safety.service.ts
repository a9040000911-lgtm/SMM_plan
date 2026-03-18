/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { ProviderService } from '@/services/providers/provider.service';
import { bot } from '@/services/bot/bot-registry';
import { ConfigService } from '@/services/core/config.service';

import { PricingService } from '@/services/finance/pricing.service';

export class SafetyService {
  /**
   * Проверяет безопасность сделки перед оформлением заказа.
   * Real-time Margin Guard: ВСЕГДА запрашивает актуальную цену у провайдера перед заказом.
   */
  static async validateOrder(serviceId: string, quantity: number, projectId: string): Promise<{ valid: boolean; reason?: string }> {
    const [service, project] = await Promise.all([
      prisma.internalService.findUnique({
        where: { id: serviceId },
        include: {
          providerMappings: { where: { isActive: true }, orderBy: { priority: 'asc' }, take: 1 }
        }
      }),
      prisma.project.findUnique({
        where: { id: projectId },
        select: { safetySettings: true, name: true }
      })
    ]);

    if (!service) return { valid: false, reason: 'Service not found' };

    // --- ФИНАНСОВАЯ БЕЗОПАСНОСТЬ ПРОЕКТА ---
    if (project?.safetySettings) {
      const settings = project.safetySettings as any;
      const currentPricePer1000 = await PricingService.getServicePrice(serviceId, projectId);
      const orderAmount = currentPricePer1000.mul(quantity).div(1000).toNumber();

      // 1. Лимит на один заказ (если включен)
      if (settings.maxSingleOrderEnabled && settings.maxSingleOrder && orderAmount > settings.maxSingleOrder) {
        return { valid: false, reason: `Слишком большая сумма заказа (лимит проекта: ${settings.maxSingleOrder}₽). Попробуйте меньшее количество.` };
      }

      // 2. Суточный лимит проекта (если включен)
      if (settings.maxDailyProjectSpendEnabled && settings.maxDailyProjectSpend) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todaySpend = await prisma.order.aggregate({
          where: { projectId, createdAt: { gte: startOfDay }, status: { not: 'CANCELED' } },
          _sum: { totalPrice: true }
        });

        const currentTotal = (todaySpend._sum.totalPrice?.toNumber() || 0) + orderAmount;
        if (currentTotal > settings.maxDailyProjectSpend) {
          return { valid: false, reason: 'Проект временно превысил суточный лимит трат. Попробуйте завтра.' };
        }
      }
    }
    // ----------------------------------------

    if (service.pricePer1000.equals(0)) return { valid: true }; // Free test skip

    const mapping = service.providerMappings[0];
    if (!mapping) return { valid: false, reason: 'Safety Check: No active provider' };

    // 1. ПОЛУЧАЕМ АКТУАЛЬНУЮ ЦЕНУ НА МОМЕНТ ЗАКАЗА (REAL-TIME)
    let costPer1000: Decimal;

    try {
      console.log(`[Margin Guard] Order initiation for ${serviceId}. Fetching real-time provider price...`);

      const storedService = await prisma.providerService.findUnique({
        where: { id: mapping.providerServiceId }
      });

      if (!storedService) {
        return { valid: false, reason: 'Safety Check: Provider service definition missing' };
      }

      const liveServices = await ProviderService.getProviderServices(mapping.providerId);

      if (!liveServices || !Array.isArray(liveServices)) {
        throw new Error('Invalid response from provider service');
      }

      const liveSvc = liveServices.find((s: any) => String(s.service) === String(storedService.externalId));

      if (liveSvc) {
        costPer1000 = new Decimal(liveSvc.rate);
        // Обновляем в нашей базе для актуальности каталога
        await prisma.providerService.update({
          where: { id: storedService.id },
          data: { rawPrice: costPer1000, lastSeenAt: new Date() }
        });
        // Также обновляем кэшированную цену в самой услуге
        await prisma.internalService.update({
          where: { id: serviceId },
          data: { lastProviderPrice: costPer1000 }
        });
      } else {
        console.warn(`[Margin Guard] Service ${mapping.providerServiceId} not found in provider's live list.`);
        return { valid: false, reason: 'Услуга временно недоступна у поставщика.' };
      }
    } catch (e: any) {
      console.error('[Margin Guard] Failed to fetch live price during order:', e);

      // [RESILIENCE] Fallback to cached price if provider is unreachable or disabled
      if (service.lastProviderPrice && !service.lastProviderPrice.equals(0)) {
        console.warn(`[Margin Guard] Falling back to cached price for ${serviceId}: ${service.lastProviderPrice}`);
        costPer1000 = service.lastProviderPrice;
      } else {
        // If we have NO cached price and the provider is down, we must block to be safe
        return { valid: false, reason: 'Провайдер временно недоступен, а актуальная цена неизвестна.' };
      }
    }

    // 2. ПРОВЕРКА РЕНТАБЕЛЬНОСТИ (Strict Margin Guard)
    const minRequiredPrice = await PricingService.calculateRetailPrice(costPer1000);

    // Если цена продажи НИЖЕ чем текущая закупка * множитель
    if (service.pricePer1000.lt(minRequiredPrice)) {
      // ЭКСТРЕННОЕ ОТКЛЮЧЕНИЕ УСЛУГИ (чтобы другие не пытались заказать)
      await prisma.internalService.update({
        where: { id: serviceId },
        data: { isActive: false }
      });

      // Уведомляем админа мгновенно (показываем цену за штуку для наглядности розницы)
      const config = await ConfigService.getTelegramConfig();
      const adminId = config.adminId;
      if (adminId) {
        const { NotificationTemplates } = await import('@/bot/utils/notification-templates');
        const liveUnit = PricingService.getPricePerUnit(costPer1000);
        const myUnit = PricingService.getPricePerUnit(service.pricePer1000);
        const reqUnit = PricingService.getPricePerUnit(minRequiredPrice);

        await bot.telegram.sendMessage(adminId,
          NotificationTemplates.ORDER.MARGING_GUARD_ADMIN(service.name, serviceId, liveUnit, myUnit, reqUnit),
          { parse_mode: 'HTML' }
        ).catch(console.error);
      }

      return { valid: false, reason: 'Технические работы на линии (обновление цен). Повторите попытку через 5 минут.' };
    }

    return { valid: true };
  }

  /**
   * Real-time price check for "Warn & Adjust" flow in UI.
   */
  static async checkPriceSync(serviceId: string): Promise<{ liveCost: Decimal; requiredPrice: Decimal; priceChanged: boolean }> {
    const service = await prisma.internalService.findUnique({
      where: { id: serviceId },
      include: { providerMappings: { where: { isActive: true }, orderBy: { priority: 'asc' }, take: 1 } }
    });

    if (!service || !service.providerMappings[0]) {
      throw new Error('Service or mapping not found');
    }

    const mapping = service.providerMappings[0];
    const storedService = await prisma.providerService.findUnique({
      where: { id: mapping.providerServiceId }
    });

    if (!storedService) throw new Error('Provider service definition not found');

    const liveServices = await ProviderService.getProviderServices(mapping.providerId);
    const liveSvc = liveServices.find((s: any) => String(s.service) === String(storedService.externalId));

    if (!liveSvc) throw new Error('Service unavailable at provider');

    const liveCost = new Decimal(liveSvc.rate);
    const syncResult = await PricingService.syncInternalServicePrice(serviceId, undefined, liveCost);
    const finalRetailPrice = syncResult.newPrice || await PricingService.calculateRetailPrice(liveCost);

    return { liveCost, requiredPrice: finalRetailPrice as Decimal, priceChanged: syncResult.priceUpdated || false };
  }

  /**
   * Централизованная проверка: выгодна ли услуга при текущей цене закупки.
   * Сравнивает текущую цену продажи с минимально допустимой (себестоимость + наценка).
   */
  static async isServiceProfitable(serviceId: string, currentCost?: Decimal): Promise<{
    profitable: boolean;
    retailPrice: Decimal;
    minRequiredPrice: Decimal;
    diff: Decimal;
  }> {
    const service = await prisma.internalService.findUnique({ where: { id: serviceId } });
    if (!service) throw new Error(`Service ${serviceId} not found`);

    const cost = currentCost || service.lastProviderPrice || new Decimal(0);
    const minRequiredPrice = await PricingService.calculateRetailPrice(cost);
    const profitable = service.pricePer1000.gte(minRequiredPrice);

    return {
      profitable,
      retailPrice: service.pricePer1000,
      minRequiredPrice,
      diff: service.pricePer1000.sub(minRequiredPrice)
    };
  }
}


