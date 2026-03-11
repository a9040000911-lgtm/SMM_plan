/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Platform, Category } from '@/generated/client';

import { prisma } from '../lib/prisma';
import { TelegramCatalog } from '../configs/catalog/telegram';
import { VKCatalog } from '../configs/catalog/vk';
import { InstagramCatalog } from '../configs/catalog/instagram';
import { TwitchCatalog } from '../configs/catalog/twitch';
import { YouTubeCatalog } from '../configs/catalog/youtube';
import { TikTokCatalog } from '../configs/catalog/tiktok';
import { LikeeCatalog } from '../configs/catalog/likee';
import { DiscordCatalog } from '../configs/catalog/discord';
import { Decimal } from 'decimal.js';
import { PricingService } from '../services/finance/pricing.service';

// const prisma = new PrismaClient();

async function syncCatalog() {
  console.log('--- СИНХРОНИЗАЦИЯ: ГЛОБАЛЬНЫЙ КАТАЛОГ (8 ПЛАТФОРМ) ---');

  // Cache for provider IDs
  const providerCache = new Map<string, string>();
  const allProviders = await prisma.provider.findMany();
  allProviders.forEach(p => providerCache.set(p.name, p.id));

  const catalogs = [
    { platform: Platform.TELEGRAM, items: TelegramCatalog },
    { platform: Platform.VK, items: VKCatalog },
    { platform: Platform.INSTAGRAM, items: InstagramCatalog },
    { platform: Platform.TWITCH, items: TwitchCatalog },
    { platform: Platform.YOUTUBE, items: YouTubeCatalog },
    { platform: Platform.TIKTOK, items: TikTokCatalog },
    { platform: Platform.LIKEE, items: LikeeCatalog },
    { platform: Platform.DISCORD, items: DiscordCatalog }
  ];

  for (const catalog of catalogs) {
    const platform = catalog.platform;
    console.log(`\nPlatform: ${platform}`);

    for (const item of catalog.items) {
      try {
        let rawPrice = new Decimal(0);
        const mainProvider = item.providers.find(p => p.priority === 1);

        if (mainProvider) {
          const providerId = providerCache.get(mainProvider.providerName);
          if (providerId) {
            const ps = await prisma.providerService.findFirst({
              where: { externalId: mainProvider.providerServiceId.toString(), providerId: providerId }
            });
            if (ps) rawPrice = ps.rawPrice;
          }
        }

        // 1. ОПРЕДЕЛЯЕМ ЦЕНУ ЗА 1000 ЧЕРЕЗ ЦЕНТРАЛЬНЫЙ СЕРВИС
        let finalPricePer1000: Decimal;

        if (item.fixedPricePer1000) {
          // Если указана фиксированная цена за 1000, то цена за 1 шт = fixedPrice / 1000
          finalPricePer1000 = new Decimal(item.fixedPricePer1000);
          // Safety Floor
          const safetyPrice = PricingService.getSafetyPrice(rawPrice);
          if (finalPricePer1000.lt(safetyPrice)) {
            finalPricePer1000 = safetyPrice;
          }
        } else {
          // Используем автоматическую лестницу наценок
          finalPricePer1000 = await PricingService.calculateRetailPrice(rawPrice, {
            category: item.category
          });
        }

        // 2. РАСЧЕТ ЦЕНЫ ЗА 1 ШТ (ЭТАЛОН)
        // Если это буст или пакет, то конфиг все равно дает цену за 1000 "единиц" (дней/пакетов) в поле fixedPricePer1000? 
        // Судя по конфигу Telegram: Буст за 11000 руб/день -> 11000000.00. 
        // Это значит 11000000 / 1000 = 11000 за 1 день. 
        // Значит нам ВСЕГДА нужно делить на 1000, чтобы получить цену за 1 ед.
        let pricePerOne = finalPricePer1000.div(1000);

        if (pricePerOne.lt(0.01)) {
          pricePerOne = new Decimal(0.01);
        } else {
          pricePerOne = new Decimal(pricePerOne.toFixed(2, Decimal.ROUND_CEIL));
        }

        const finalDbPricePer1000 = pricePerOne.mul(1000);
        const priceUnit = (item.category === Category.BOOSTS || (item.metadata as any)?.type === 'set') ? 1 : 1000; // This line was moved from above
        const unitLabel = priceUnit === 1 ? ((item.category === Category.BOOSTS) ? 'день' : 'пакет') : 'шт.';

        const { SmartAnalyzerService } = await import('../services/providers/smart-analyzer.service');
        const service = await prisma.$transaction(async (tx) => {
          const categoryObj = await SmartAnalyzerService.resolveCategory(tx, platform, item.category, item.targetType || 'ALL', null);

          return tx.internalService.upsert({
            where: { id: item.id },
            update: {
              slug: item.slug,
              platform: platform,
              category: item.category,
              serviceCategory: { connect: { id: categoryObj.id } },
              targetType: item.targetType || 'ALL',
              name: item.name,
              description: item.description || '',
              metadata: item.metadata || {},
              geo: (item.metadata as any)?.geo || 'Mixed',
              pricePer1000: finalDbPricePer1000,
              lastProviderPrice: rawPrice,
              minQty: priceUnit === 1 ? 1 : 100,
              maxQty: 100000,
              isActive: true,
              unitName: unitLabel,
              priceUnit: priceUnit,
            },
            create: {
              id: item.id,
              slug: item.slug,
              platform: platform,
              category: item.category,
              serviceCategory: { connect: { id: categoryObj.id } },
              targetType: item.targetType || 'ALL',
              name: item.name,
              description: item.description || '',
              metadata: item.metadata || {},
              geo: (item.metadata as any)?.geo || 'Mixed',
              pricePer1000: finalDbPricePer1000,
              lastProviderPrice: rawPrice,
              minQty: priceUnit === 1 ? 1 : 100,
              maxQty: 100000,
              isActive: true,
              unitName: unitLabel,
              priceUnit: priceUnit,
            }
          });
        });

        await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: service.id } });
        for (const p of item.providers) {
          const providerId = providerCache.get(p.providerName);
          if (providerId) {
            const ps = await prisma.providerService.findFirst({
              where: { externalId: p.providerServiceId.toString(), providerId: providerId }
            });

            if (ps) {
              await prisma.internalServiceMapping.create({
                data: {
                  internalServiceId: service.id,
                  providerServiceId: ps.id,
                  providerId: providerId,
                  priority: p.priority,
                  isActive: true
                }
              });
            }
          }
        }
        console.log(`[OK] ${item.id}: ${item.name}`);
      } catch (err) {
        console.error(`[ERROR] Failed to sync service ${item.id}:`, err);
      }
    }
  }

  console.log('--- ГЛОБАЛЬНАЯ СИНХРОНИЗАЦИЯ ЗАВЕРШЕНА ---');
}

syncCatalog().catch(console.error).finally(() => prisma.$disconnect());
