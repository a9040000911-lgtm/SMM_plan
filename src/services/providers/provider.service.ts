/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Provider, Order } from '@prisma/client';
import { IProvider } from './base-provider';
import { VexboostProvider } from './vexboost.provider';
import { StreamPromotionProvider } from './stream-promotion.provider';
import { UniversalProvider } from './universal.provider';
import { ProviderOrderResult, ProviderStatusResult } from '@/types/orders';
import { CryptoService } from '@/services/core/crypto.service';
import { createLogger } from '@/lib/logger';
import { IntelligenceEngine } from '@/services/intelligence/intelligence.engine';
import { Decimal } from 'decimal.js';

const providerMap: { [key: string]: new (config: Provider) => IProvider } = {
  vexboost: VexboostProvider,
  'stream-promotion': StreamPromotionProvider,
  'perfect-panel': UniversalProvider,
};

export class ProviderService {
  private static logger = createLogger('ProviderService');

  public static async getInstance(providerId: string, projectId?: string | null): Promise<IProvider | null> {
    let providerConfig = await prisma.provider.findUnique({
      where: { id: providerId, isEnabled: true },
    });

    if (!providerConfig) {
      this.logger.error(`Provider ID ${providerId} not found or is disabled.`);
      return null;
    }

    // --- OVERRIDE LOGIC ---
    // If the provider found is global (no projectId), check if there's a project-specific one with same name
    if (!providerConfig.projectId && projectId) {
      const localOverride = await prisma.provider.findFirst({
        where: {
          projectId: projectId,
          name: providerConfig.name,
          isEnabled: true
        }
      });
      if (localOverride) {
        // this.logger.info(`[ProviderService] Overriding global provider ${providerConfig.name} with local one for project ${projectId}`);
        providerConfig = localOverride;
      }
    }

    // Use providerConfig.type to determine the driver
    const type = providerConfig.type.toLowerCase();

    // --- DECRYPT API KEY ---
    providerConfig.apiKey = CryptoService.decrypt(providerConfig.apiKey);

    // Inject defaults for perfect-panel if metadata is missing key fields
    if (type === 'perfect-panel') {
      const meta = (providerConfig.metadata as any) || {};
      providerConfig.metadata = {
        method: 'POST',
        requestType: 'form',
        keyField: 'key',
        actionField: 'action',
        ...meta
      };
    }

    const ProviderClass = providerMap[type];
    if (ProviderClass) {
      return new ProviderClass(providerConfig);
    }

    return new UniversalProvider(providerConfig);
  }

  static async getProviderServices(providerId: string) {
    const instance = await this.getInstance(providerId);
    if (!instance) throw new Error(`Provider ID ${providerId} not found or disabled`);
    return await instance.getServices();
  }

  static async createOrder(order: Order & { inviteLink?: string | null }, quantity?: number, specificMapping?: { providerId: string; providerServiceId: string } | null, dripParams?: { runs: number, interval: number }): Promise<ProviderOrderResult> {
    const qty = quantity ?? order.quantity;
    const initialLink = order.inviteLink ? `${order.link}, ${order.inviteLink}` : order.link;

    const internalService = await prisma.internalService.findUnique({
      where: { id: order.internalServiceId },
      select: {
          socialPlatform: { select: { slug: true } },
          serviceCategory: { select: { categoryType: true } }
      }
    });

    const category = internalService?.serviceCategory?.categoryType as string | undefined;
    const platform = internalService?.socialPlatform?.slug?.toUpperCase() as string | undefined;

    const extraParams: any = {
      comments: order.comments || undefined,
      ...(dripParams ? { runs: dripParams.runs, interval: dripParams.interval } : {})
    };

    if (specificMapping) {
      const providerInfo = await prisma.provider.findUnique({ where: { id: specificMapping.providerId } });
      const instance = await this.getInstance(specificMapping.providerId);
      if (!instance || !providerInfo) throw new Error(`Provider ${specificMapping.providerId} unavailable`);

      const intelResult = await IntelligenceEngine.analyzeLink(initialLink);
      const adaptedLink = IntelligenceEngine.formatForProvider(intelResult, providerInfo.name);

      // --- LINK VALIDATION (Intelligence Engine already covers most, but keep custom logic if needed) ---
      if (platform === 'TELEGRAM' && category === 'REFERRALS') {
        if (!adaptedLink.includes('start=')) {
          throw new Error(`[Intelligence] Ошибка: ссылка для "Рефералы в бот" должна содержать '?start='`);
        }
      }

      const result = await instance.createOrder(specificMapping.providerServiceId, adaptedLink, qty, extraParams);

      // Логика сбора статистики
      if (!result.success && (result.error?.toLowerCase().includes('already in progress') || result.error?.toLowerCase().includes('duplicate'))) {
        await this.recordProviderIncident(specificMapping.providerId, 'OVERLAP_REJECTION');
      }

      return {
        ...result,
        providerName: providerInfo.name || 'Unknown'
      };
    }

    const mappings = await prisma.internalServiceMapping.findMany({
      where: {
        internalServiceId: order.internalServiceId,
        isActive: true,
        OR: [
          { projectId: order.projectId },
          { projectId: null }
        ]
      },
      orderBy: [
        { projectId: 'desc' }, // Project-specific first (since null is "less" than string in desc order? No, NULLS LAST is default or we handle it)
        { priority: 'asc' }
      ],
    });

    if (mappings.length === 0) throw new Error(`No active provider mapping for ${order.internalServiceId}`);

    let lastError = null;

    // Try each mapping in priority order
    for (const mapping of mappings) {
      try {
        // --- SERVICE GUARDIAN CHECK ---
        const { ServiceGuardian } = await import('./service-guardian.service');
        const providerInfo = await prisma.provider.findUnique({ where: { id: mapping.providerId } });
        const instance = await this.getInstance(mapping.providerId, order.projectId);

        if (!instance || !providerInfo) {
          this.logger.warn(`[Failover] Provider ${mapping.providerId} unavailable, skipping...`);
          continue;
        }

        const verification = await ServiceGuardian.verifyService(order.internalServiceId, mapping, instance);
        if (!verification.isValid) {
          if (verification.criticalChange) {
            // Критическое изменение - отключаем услугу и выходим
            await ServiceGuardian.disableService(order.internalServiceId, verification.reason || 'Unknown critical change');
            throw new Error(`[Guardian] Order blocked: ${verification.reason}`);
          } else {
            // Не критично (например, провайдер недоступен временно), пробуем следующий маппинг
            this.logger.warn(`[Guardian] Verification failed for ${mapping.providerId}: ${verification.reason}. Trying next mapping...`);
            continue;
          }
        }
        // ------------------------------

        const intelResult = await IntelligenceEngine.analyzeLink(initialLink);
        const adaptedLink = IntelligenceEngine.formatForProvider(intelResult, providerInfo.name);

        // --- LINK VALIDATION ---
        if (platform === 'TELEGRAM' && category === 'REFERRALS') {
          if (!adaptedLink.includes('start=')) {
            throw new Error(`[Intelligence] Ошибка: ссылка для "Рефералы в бот" должна содержать '?start='`);
          }
        }

        const result = await instance.createOrder(mapping.providerServiceId, adaptedLink, qty, extraParams);

        if (result.success) {
          return {
            ...result,
            providerName: providerInfo.name || 'Unknown'
          };
        } else {
          lastError = result.error;
          if (lastError?.includes('PROVIDER_NETWORK_ERROR')) {
            throw new Error(lastError); // Propagate immediately to stop retries that could cause duplicates
          }
          this.logger.warn(`[Failover] Provider ${mapping.providerId} failed: ${result.error}. Trying next...`);
        }
      } catch (_e: any) {
        if (_e.message.includes('PROVIDER_NETWORK_ERROR')) throw _e;
        lastError = _e.message;
        this.logger.error(`[Failover] Error with provider ${mapping.providerId}:`, _e.message);

        // Если это была ошибка от Гвардиана - не пробуем другие маппинги, так как проблема в самой услуге
        if (_e.message.includes('[Guardian]')) break;
      }
    }

    throw new Error(`All providers failed for ${order.internalServiceId}. Last error: ${lastError}`);
  }

  /**
   * Фиксирует технические инциденты провайдеров для статистики
   */
  private static async recordProviderIncident(providerId: string, type: string) {
    try {
      const provider = await prisma.provider.findUnique({ where: { id: providerId } });
      if (!provider) return;

      const metadata = (provider.metadata as any) || {};
      const stats = metadata.stats || {};
      stats[type] = (stats[type] || 0) + 1;
      metadata.stats = stats;

      await prisma.provider.update({
        where: { id: providerId },
        data: { metadata }
      });
    } catch (e) {
      this.logger.error('[ProviderStats] Failed to record incident:', e);
    }
  }

  static async refillOrder(orderId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order || !order.externalId || !order.providerName) {
      throw new Error('Order not found or has no external provider link');
    }

    // Orders still have providerName as a string, but we should find provider by name or better, store providerId in Order too.
    // For now, let's look up provider by name in the Order table.
    const provider = await prisma.provider.findFirst({
      where: { name: order.providerName }
    });

    if (!provider) throw new Error(`Provider ${order.providerName} not found`);

    const instance = await this.getInstance(provider.id, order.projectId);
    if (!instance || !instance.refillOrder) {
      throw new Error(`Refill not supported by provider ${order.providerName}`);
    }

    return await instance.refillOrder(order.externalId);
  }

  static async getOrderStatus(order: Order): Promise<ProviderStatusResult> {
    if (!order.externalId) throw new Error('No external ID');

    let providerId = order.providerName ? (await prisma.provider.findFirst({ where: { name: order.providerName } }))?.id : null;

    if (!providerId) {
      providerId = (await prisma.internalServiceMapping.findFirst({
        where: { internalServiceId: order.internalServiceId },
        orderBy: { priority: 'asc' }
      }))?.providerId || null;
    }

    if (!providerId) throw new Error('Provider not found for order');

    try {
      const instance = await this.getInstance(providerId, order.projectId);
      if (!instance) throw new Error(`Provider ID ${providerId} unavailable`);

      return await instance.getStatus(order.externalId);
    } catch (e: any) {
      return {
        status: 'CANCELED' as any,
        remains: order.remains || 0,
        error: e.message
      };
    }
  }

  static async getStatuses(providerId: string, externalIds: string[], projectId?: string | null): Promise<Record<string, ProviderStatusResult>> {
    if (externalIds.length === 0) return {};

    try {
      const instance = await this.getInstance(providerId, projectId);
      if (!instance) throw new Error(`Provider ID ${providerId} unavailable`);

      if (instance.getStatuses) {
        return await instance.getStatuses(externalIds);
      }

      // Fallback to individual requests if bulk is not supported
      const results: Record<string, ProviderStatusResult> = {};
      await Promise.all(externalIds.map(async (id) => {
        try {
          results[id] = await instance.getStatus(id);
        } catch (e: any) {
          results[id] = { status: 'CANCELED' as any, remains: 0, error: e.message };
        }
      }));
      return results;
    } catch (e: any) {
      this.logger.error(`[BulkStatus] Provider ${providerId} failed:`, e.message);
      return {};
    }
  }

  static async cancelOrder(order: Order) {
    if (!order.externalId) return { success: false, error: 'No external ID' };

    const providerName = order.providerName;
    if (!providerName) return { success: false, error: 'No provider assigned' };

    const provider = await prisma.provider.findFirst({ where: { name: providerName } });
    if (!provider) return { success: false, error: `Provider ${providerName} not found` };

    const instance = await this.getInstance(provider.id, order.projectId);
    if (!instance) return { success: false, error: 'Provider unavailable' };

    // Большинство SMM API не поддерживают отмену через API, но мы попробуем
    if ('cancelOrder' in instance && typeof (instance as any).cancelOrder === 'function') {
      return await (instance as any).cancelOrder(order.externalId);
    }

    return { success: false, error: 'Provider does not support API cancellation' };
  }

  /**
   * Pings a provider to check API health and latency.
   */
  static async pingProvider(providerId: string): Promise<{ success: boolean; latency: number }> {
    const start = Date.now();
    try {
      const instance = await this.getInstance(providerId);
      if (!instance) return { success: false, latency: 0 };
      await instance.getBalance();
      return { success: true, latency: Date.now() - start };
    } catch (_e) {
      return { success: false, latency: Date.now() - start };
    }
  }

  /**
   * Checks balances for all providers and logs alerts if low.
   */
  static async checkBalancesForAlerts(): Promise<void> {
    const providers = await prisma.provider.findMany({ where: { isEnabled: true } });
    for (const provider of providers) {
      try {
        const instance = await this.getInstance(provider.id);
        if (!instance) continue;
        const balanceInfo = await instance.getBalance();
        
        await prisma.providerBalanceLog.create({
          data: {
            providerId: provider.id,
            balance: new Decimal(balanceInfo.balance)
          }
        });

        // Simple alert logic can be added here or in a separate observer
      } catch (e) {
        this.logger.error(`Failed to check balance for ${provider.name}:`, e);
      }
    }
  }
}




