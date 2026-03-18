/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Platform, Category, Provider, ProviderService } from '@/generated/client';
import { PricingService } from '@/services/finance/pricing.service';
import { TIERS, TierDefinition } from '@/configs/ranking-tiers';
import { PLATFORM_KEYWORDS } from './smart-analyzer.logic';

export class SmartRankerService {
  /**
   * Запускает процесс ранжирования сервисов на основе заданных тиров.
   */
  static async runSmartRanking() {
    console.log('🚀 Starting Smart Ranking Engine (Stability Mode)...');

    const allProviderServices = await prisma.providerService.findMany({
      include: { provider: true }
    });
    console.log(`Loaded ${allProviderServices.length} raw services from providers.`);

    let updatedCount = 0;
    let keptCount = 0;

    for (const tier of TIERS) {
      const isKept = await this.processTier(tier, allProviderServices);
      if (isKept) keptCount++;
      else updatedCount++;
    }

    // Автоматический поиск реакций Telegram
    const reactionsCount = await this.discoverTelegramReactions(allProviderServices);
    updatedCount += reactionsCount;

    console.log(`\n✅ Ranking Complete. Stable: ${keptCount}, Updated/Created: ${updatedCount}.`);
  }

  private static async processTier(tier: TierDefinition, allProviderServices: (ProviderService & { provider: Provider })[]): Promise<boolean> {
    // --- STABILITY CHECK ---
    const existingService = await prisma.internalService.findUnique({
      where: { id: tier.code },
      include: {
        providerMappings: {
          where: { isActive: true },
          include: { providerService: true, provider: true }
        }
      }
    });

    if (existingService && existingService.providerMappings.length > 0) {
      const currentMapping = existingService.providerMappings[0];
      if (currentMapping.providerService) {
        console.log(`🔒 [Keep] ${tier.name} is stable on ${currentMapping.provider.name} (ID: ${currentMapping.providerServiceId}).`);
        return true;
      }
    }

    // 1. Фильтрация кандидатов
    const candidates = this.filterCandidates(tier, allProviderServices);

    if (candidates.length === 0) {
      console.warn(`⚠️ No candidates found for Tier: ${tier.name} (${tier.code})`);
      return false;
    }

    // 2. Выбор победителя (самый дешевый)
    candidates.sort((a, b) => a.rawPrice.toNumber() - b.rawPrice.toNumber());
    const winner = candidates[0];

    console.log(`🏆 [New/Update] Winner for ${tier.code}: ${winner.provider.name} | ${winner.name} | ${winner.rawPrice}`);

    // 3. Создание/Обновление InternalService
    await this.updateInternalService(tier, winner);
    return false;
  }

  private static filterCandidates(tier: TierDefinition, allProviderServices: any[]) {
    return allProviderServices.filter(s => {
      const name = s.name.toLowerCase();
      const price = s.rawPrice.toNumber();

      const requiredPlatformWords = PLATFORM_KEYWORDS[tier.platform];
      if (requiredPlatformWords && !requiredPlatformWords.some(w => name.includes(w))) {
        return false;
      }

      if (price < tier.filters.minPrice || price > tier.filters.maxPrice) return false;

      if (tier.filters.mustContain && !tier.filters.mustContain.some(w => name.includes(w.toLowerCase()))) {
        return false;
      }

      if (tier.filters.mustNotContain && tier.filters.mustNotContain.some(w => name.includes(w.toLowerCase()))) {
        return false;
      }

      return true;
    });
  }

  private static async updateInternalService(tier: TierDefinition, winner: any) {
    const finalPrice = await PricingService.calculateRetailPrice(winner.rawPrice, {
      category: tier.category,
      projectId: 'global'
    });

    const winnerRaw = winner.rawData as any;
    const serviceData = {
      platform: tier.platform,
      category: tier.category,
      name: tier.name,
      description: tier.description,
      geo: tier.name.includes('🇷🇺') || tier.name.includes('РФ') ? 'RU' : 'WW',
      pricePer1000: finalPrice,
      minQty: Math.max(Number(winnerRaw.min || 10), 10),
      maxQty: Math.min(Number(winnerRaw.max || 100000), 1000000),
      unitName: 'шт.',
      priceUnit: 1000,
      targetType: tier.targetType,
      isPrivate: false,
      isActive: true,
      lastProviderPrice: winner.rawPrice
    };

    const { SmartAnalyzerService } = await import('./smart-analyzer.service');

    await prisma.$transaction(async (tx) => {
      const categoryObj = await SmartAnalyzerService.resolveCategory(tx, tier.platform, tier.category, tier.targetType, null);

      await tx.internalService.upsert({
        where: { id: tier.code },
        update: {
          ...serviceData,
          serviceCategory: { connect: { id: categoryObj.id } }
        },
        create: {
          id: tier.code,
          ...serviceData,
          serviceCategory: { connect: { id: categoryObj.id } }
        }
      });
    });

    await prisma.internalServiceMapping.deleteMany({
      where: { internalServiceId: tier.code }
    });

    await prisma.internalServiceMapping.create({
      data: {
        internalServiceId: tier.code,
        providerServiceId: winner.id,
        providerId: winner.providerId,
        priority: 1,
        isActive: true
      }
    });
  }

  /**
   * Автоматически находит уникальные реакции Telegram и создаёт для них услуги.
   */
  private static async discoverTelegramReactions(allProviderServices: (ProviderService & { provider: Provider })[]): Promise<number> {
    console.log('🔍 Discovering all unique Telegram Reactions...');
    const reactionCandidates = allProviderServices.filter(s =>
      s.provider.name !== 'internal' &&
      (s.name.toLowerCase().includes('reaction') || s.name.toLowerCase().includes('реакц')) &&
      (s.name.toLowerCase().includes('tg') || s.name.toLowerCase().includes('telegram'))
    );

    const reactionGroups: Record<string, any[]> = {};
    reactionCandidates.forEach(s => {
      const normName = s.name
        .replace(/.*\[.*?\]/g, '')
        .replace(/\(.*\)/g, '')
        .replace(/Telegram|TG|Реакции|Reactions/gi, '')
        .trim()
        .toLowerCase();

      if (!normName) return;
      if (!reactionGroups[normName]) reactionGroups[normName] = [];
      reactionGroups[normName].push(s);
    });

    let count = 0;
    for (const [normName, group] of Object.entries(reactionGroups)) {
      group.sort((a, b) => a.rawPrice.toNumber() - b.rawPrice.toNumber());
      const winner = group[0];
      const serviceId = `TG_REACT_${normName.toUpperCase().replace(/\s+/g, '_')}`;

      await this.updateReactionService(serviceId, winner);
      count++;
    }
    return count;
  }

  private static async updateReactionService(serviceId: string, winner: any) {
    const cleanName = winner.name.replace(/.*\[.*?\]/g, '').replace(/\(.*\)/g, '').trim();
    const winnerRaw = winner.rawData as any;

    const serviceData = {
      platform: Platform.TELEGRAM,
      category: Category.REACTIONS,
      name: `⚡️ TG Реакция: ${cleanName}`,
      description: `Стабильные реакции на пост. ${winner.name}`,
      geo: 'WW',
      pricePer1000: await PricingService.calculateRetailPrice(winner.rawPrice, {
        category: Category.REACTIONS,
        projectId: 'global'
      }),
      minQty: Math.max(Number(winnerRaw.min || 10), 10),
      maxQty: Math.min(Number(winnerRaw.max || 100000), 1000000),
      unitName: 'шт.',
      priceUnit: 1000,
      targetType: 'POST' as any,
      isPrivate: false,
      isActive: true,
      lastProviderPrice: winner.rawPrice
    };

    const { SmartAnalyzerService } = await import('./smart-analyzer.service');

    await prisma.$transaction(async (tx) => {
      const categoryObj = await SmartAnalyzerService.resolveCategory(tx, Platform.TELEGRAM, Category.REACTIONS, 'POST', null);

      await tx.internalService.upsert({
        where: { id: serviceId },
        update: {
          ...serviceData,
          serviceCategory: { connect: { id: categoryObj.id } }
        },
        create: {
          id: serviceId,
          ...serviceData,
          serviceCategory: { connect: { id: categoryObj.id } }
        }
      });
    });

    await prisma.internalServiceMapping.deleteMany({ where: { internalServiceId: serviceId } });
    await prisma.internalServiceMapping.create({
      data: {
        internalServiceId: serviceId,
        providerServiceId: winner.id,
        providerId: winner.providerId,
        priority: 1,
        isActive: true
      }
    });
  }
}


