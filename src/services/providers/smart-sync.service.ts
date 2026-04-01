/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { ServiceSyncService } from './sync.service';
import { Decimal } from 'decimal.js';
import { BroadcastService } from '@/services/support/broadcast.service';
import { PricingService } from '@/services/finance/pricing.service';

export class SmartSyncService {
  /**
   * Запускает полную проверку цен и обновление маржи
   */
  static async syncPricesAndMarkup() {
    console.log('[SmartSync] Starting global price synchronization...');

    // 1. Синхронизируем услуги от провайдеров в локальную БД
    await ServiceSyncService.syncAllServices();

    // 2. Получаем все активные маппинги
    const mappings = await prisma.internalServiceMapping.findMany({
      where: { isActive: true },
      include: {
        providerService: true,
        internalService: true,
        provider: true
      }
    });

    // 3. Обработка маппингов группами по услугам
    const uniqueServiceIds = Array.from(new Set(mappings.map(m => m.internalServiceId)));


    let updatedCount = 0;
    const alerts: string[] = [];
    const incidents: { type: string, msg: string, providerName: string }[] = [];

    for (const serviceId of uniqueServiceIds) {
      const serviceMappings = mappings.filter(m => m.internalServiceId === serviceId);
      const internalService = serviceMappings[0].internalService;

      // Проверка на скачки цен для каждой маппированной услуги отдельно (Margin Guard)
      let shouldDisable = false;
      for (const mapping of serviceMappings) {
        const currentCost = mapping.providerService.rawPrice;
        const oldCost = internalService.lastProviderPrice || new Decimal(0);

        if (!currentCost.equals(oldCost) && oldCost.gt(0)) {
          const priceDiffPercent = currentCost.sub(oldCost).div(oldCost).mul(100).toNumber();

          if (priceDiffPercent > 50) {
            shouldDisable = true;
            const alertMsg = `🚨 <b>Margin Guard</b>\nУслуга: <code>${BroadcastService.escapeHtml(internalService.name)}</code>\nПричина: Цена закупки (провайдер ${BroadcastService.escapeHtml(mapping.provider.name)}) выросла на <b>${priceDiffPercent.toFixed(1)}%</b>\nДействие: Услуга ОТКЛЮЧЕНА.`;
            incidents.push({ type: 'MARGIN_GUARD', msg: alertMsg, providerName: mapping.provider.name });
            alerts.push(alertMsg);
            break;
          }
        }
      }

      if (shouldDisable) {
        await prisma.internalService.update({ where: { id: serviceId }, data: { isActive: false } });
        continue;
      }

      // --- AUTO RE-MARKUP & SMART ROTATION ---
      const syncResult = await PricingService.syncInternalServicePrice(serviceId);

      if ('priceUpdated' in syncResult && syncResult.priceUpdated) {
        updatedCount++;
        const alertMsg = `💰 <b>Price Adjusted</b>\nУслуга: <code>${BroadcastService.escapeHtml(internalService.name)}</code>\nНовая цена: <b>${syncResult.newPrice}₽</b>\nПричина: Повышение цен у провайдеров.`;
        incidents.push({ type: 'PRICE_UPDATE', msg: alertMsg, providerName: 'System' });
      }

      // Проверка на убыточность (Loss Prevention)
      const avgCostForSafety = syncResult.avgCost || new Decimal(0);
      const safetyPrice = PricingService.getSafetyPrice(avgCostForSafety);
      if (avgCostForSafety.gt(0) && internalService.pricePer1000.lt(safetyPrice)) {
        await prisma.internalService.update({ where: { id: serviceId }, data: { isActive: false } });
        const alertMsg = `❌ <b>LOSS PREVENTION</b>\nУслуга: <code>${BroadcastService.escapeHtml(internalService.name)}</code>\nПричина: Средняя себестоимость (${avgCostForSafety.toFixed(4)}₽) слишком близка к рознице (${internalService.pricePer1000}₽) после наценки.\nДействие: Услуга ОТКЛЮЧЕНА.`;
        incidents.push({ type: 'LOSS_PREVENTION', msg: alertMsg, providerName: 'System' });
        alerts.push(alertMsg);
        continue;
      }

      // Умная ротация (Smart Rotation)
      if (syncResult.Cheaper) {
        // Если есть провайдер дешевле текущего (priority 1), меняем приоритеты
        const currentPrimaryMapping = serviceMappings.find(m => m.priority === 1);
        const cheapestMapping = await prisma.internalServiceMapping.findFirst({
          where: { internalServiceId: serviceId, provider: { name: syncResult.cheapestProvider } }
        });

        if (cheapestMapping && currentPrimaryMapping && cheapestMapping.id !== currentPrimaryMapping.id) {
          await prisma.internalServiceMapping.update({ where: { id: currentPrimaryMapping.id }, data: { priority: 2 } });
          await prisma.internalServiceMapping.update({ where: { id: cheapestMapping.id }, data: { priority: 1 } });

          const avgCostForCalc = syncResult.avgCost || new Decimal(0);
          const alertMsg = `🔄 <b>SMART ROTATION</b>\nУслуга: <code>${BroadcastService.escapeHtml(internalService.name)}</code>\nДействие: Переключено на <b>${BroadcastService.escapeHtml(syncResult.cheapestProvider || 'Unknown')}</b>\nСредняя себестоимость: <b>${avgCostForCalc.toFixed(4)}₽</b> за 1000 ед.`;
          incidents.push({ type: 'SMART_ROTATION', msg: alertMsg, providerName: syncResult.cheapestProvider || 'Unknown' });
        }
      }
    }

    // --- BATCH NOTIFICATION LOGIC ---
    if (incidents.length > 5) {
      // Group by type and provider
      const grouped = incidents.reduce((acc, curr) => {
        const key = `${curr.type}:${curr.providerName}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(curr);
        return acc;
      }, {} as Record<string, typeof incidents>);

      for (const [key, group] of Object.entries(grouped)) {
        const [type, provider] = key.split(':');

        // If group is small, send individually
        if (group.length <= 3) {
          for (const item of group) await BroadcastService.notifyAdmin(item.msg);
          continue;
        }

        // Summary message
        let emoji = '⚠️';
        let title = 'MASS UPDATE';
        if (type === 'MARGIN_GUARD') { emoji = '🚨'; title = 'MASS MARGIN ALERT'; }
        if (type === 'PRICE_UPDATE') { emoji = '💰'; title = 'MASS PRICE ADJUSTMENT'; }
        if (type === 'LOSS_PREVENTION') { emoji = '❌'; title = 'MASS LOSS PREVENTION'; }
        if (type === 'SMART_ROTATION') { emoji = '🔄'; title = 'MASS ROTATION'; }

        const summaryMsg = `${emoji} <b>${title}</b>\n\n` +
          `Провайдер: <b>${provider}</b>\n` +
          `Затронуто услуг: <b>${group.length}</b>\n\n` +
          `<i>Система автоматически обработала эти изменения, чтобы не спамить уведомлениями.</i>`;

        await BroadcastService.notifyAdmin(summaryMsg);
      }
    } else {
      // Send individually if few
      for (const item of incidents) {
        await BroadcastService.notifyAdmin(item.msg);
      }
    }

    console.log(`[SmartSync] Finished. Updated: ${updatedCount}, Alerts: ${alerts.length}`);
    return { updatedCount, alerts };
  }
}


