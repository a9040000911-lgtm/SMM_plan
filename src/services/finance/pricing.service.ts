/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { SettingsService } from '@/services/core/settings.service';
import { LoyaltyService } from '@/services/users/loyalty.service';
import { Category } from '@/generated/client';
import { PricingRules } from '@/types/project-settings';

import { MarkupRule, LadderLevel } from '@/services/types';

export class PricingService {
    private static readonly LADDER_SETTINGS_KEY = 'PRICING_LADDER';
    private static readonly CATEGORY_MULTIPLIERS_SETTINGS_KEY = 'CATEGORY_MULTIPLIERS';

    // Константы безопасности
    public static readonly MIN_PROFIT_MARGIN = 1.0; // Железный щит: минимум 100% чистой прибыли (x2 от закупки)
    public static readonly PAYMENT_GATEWAY_FEE = 0.03; // Комиссия платежного шлюза 3%
    public static readonly MAX_MARKUP_MULTIPLIER = 151.0; // Максимальный множитель: 15000% наценки (закупка * 151)

    // Финальная лестница наценок v3.1 (Средняя наценка 1000% / x11)
    private static readonly DEFAULT_LADDER: LadderLevel[] = [
        { threshold: 1, multiplier: 50, fixedMarkup: 0 },    // Дешевле 1р -> x50
        { threshold: 10, multiplier: 11, fixedMarkup: 0 },   // 1-10р -> x11
        { threshold: 50, multiplier: 11, fixedMarkup: 0 },   // 10-50р -> x11
        { threshold: 150, multiplier: 11, fixedMarkup: 0 },  // 50-150р -> x11
        { threshold: Infinity, multiplier: 8, fixedMarkup: 0 } // Свыше 150р -> x8
    ];

    /**
     * Получает текущую лестницу наценок из настроек или возвращает дефолтную
     */
    static async getPricingLadder(projectId?: string | null): Promise<LadderLevel[]> {
        const ladder = await SettingsService.getJson<LadderLevel[]>(this.LADDER_SETTINGS_KEY, projectId);
        return ladder || this.DEFAULT_LADDER;
    }

    /**
     * Обновляет лестницу наценок
     */
    static async updatePricingLadder(ladder: LadderLevel[], projectId?: string | null): Promise<void> {
        // Сортируем по возрастанию порога для корректного поиска
        const sortedLadder = [...ladder].sort((a, b) => a.threshold - b.threshold);
        await SettingsService.set(this.LADDER_SETTINGS_KEY, JSON.stringify(sortedLadder), projectId);
    }

    /**
     * Calculates the retail price based on the Dynamic Multi-tier Ladder strategy.
     * Includes Safety Floor protection.
     */
    static async calculateRetailPrice(
        providerCost: Decimal | number,
        context: {
            providerName?: string;
            category?: Category | string;
            projectId?: string;
        } = {}
    ): Promise<Decimal> {
        const cost = new Decimal(providerCost);
        if (cost.isZero()) return new Decimal(0);

        const costNum = cost.toNumber();

        // 0. ПРОВЕРКА КАТЕГОРИАЛЬНЫХ МНОЖИТЕЛЕЙ (Project-specific rules)
        let multiplier = 0;
        let fixedMarkup = 0;

        if (context.projectId && context.category) {
            const multipliers = await SettingsService.getJson<Record<string, number>>(this.CATEGORY_MULTIPLIERS_SETTINGS_KEY, context.projectId);
            if (multipliers && multipliers[context.category]) {
                multiplier = multipliers[context.category];
            }
        }

        // 1. Если категориальный множитель не найден, используем стандартную "лестницу"
        if (multiplier === 0) {
            const ladder = await this.getPricingLadder(context.projectId);
            // Поиск подходящего уровня лестницы
            const level = ladder.find(l => costNum < l.threshold) || ladder[ladder.length - 1];
            multiplier = level.multiplier;
            fixedMarkup = level.fixedMarkup;
        }

        // 2. Расчет базовой цены
        let price = cost.mul(multiplier).add(fixedMarkup);

        // 2. Добавление буфера платежного шлюза (3%)
        price = price.mul(1 + this.PAYMENT_GATEWAY_FEE);

        // 3. ПРИМЕНЕНИЕ ЛИМИТОВ: ПОЛ (SAFETY FLOOR) И ПОТОЛОК (MAX MARKUP)
        const safetyPrice = this.getSafetyPrice(cost);
        const maxPrice = cost.mul(this.MAX_MARKUP_MULTIPLIER);

        if (price.lt(safetyPrice)) {
            price = safetyPrice;
        } else if (price.gt(maxPrice)) {
            price = maxPrice;
        }

        // --- NEW SAFETY CHECK ---
        if (price.isZero() && cost.gt(0)) {
            price = safetyPrice;
        }

        // 4. Психологическое округление вверх
        const numPrice = price.toNumber();
        if (numPrice > 1000) {
            return new Decimal(Math.ceil(numPrice)).toDecimalPlaces(2, Decimal.ROUND_CEIL);
        }

        return new Decimal(Math.ceil(numPrice * 10) / 10).toDecimalPlaces(2, Decimal.ROUND_CEIL);
    }

    /**
     * Возвращает абсолютную минимальную цену продажи (Себестоимость + Маржа + Шлюз)
     */
    static getSafetyPrice(providerCost: Decimal | number): Decimal {
        const cost = new Decimal(providerCost);
        // Формула: (Закуп + 100% маржи) * 1.03 (шлюз)
        const safetyPrice = cost.mul(1 + this.MIN_PROFIT_MARGIN).mul(1 + this.PAYMENT_GATEWAY_FEE);
        return new Decimal(Math.ceil(safetyPrice.toNumber() * 10) / 10).toDecimalPlaces(2, Decimal.ROUND_CEIL);
    }

    /**
     * Saves new markup rules to the project configuration.
     */
    static async upsertMarkupRule(rule: MarkupRule, projectId?: string) {
        if (!projectId) return;

        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) return;

        let currentRules: MarkupRule[] = (project.pricingRules as PricingRules | null)?.rules || [];

        // Remove existing rule for same scope to replace it
        currentRules = currentRules.filter(r =>
            !(r.providerName === rule.providerName && r.category === rule.category)
        );

        currentRules.push(rule);

        await prisma.project.update({
            where: { id: projectId },
            // @ts-expect-error - Prisma Json handling for custom rules structure
            data: { pricingRules: { rules: currentRules } }
        });
    }

    /**
     * Проверяет и корректирует цены услуг на основе цен провайдеров
     */
    static async syncInternalPrices(projectId?: string) {
        const mappings = await prisma.internalServiceMapping.findMany({
            where: { isActive: true },
            include: {
                internalService: true,
                providerService: true,
                provider: true
            }
        });

        const updates = [];

        for (const mapping of mappings) {
            if (!mapping.providerService) continue;

            const providerPrice = mapping.providerService.rawPrice;
            const currentInternalPrice = mapping.internalService.pricePer1000;

            const newPrice = await this.calculateRetailPrice(providerPrice, {
                providerName: mapping.provider.name,
                category: mapping.internalService.category,
                projectId
            });

            if (currentInternalPrice.lt(newPrice)) {
                await prisma.internalService.update({
                    where: { id: mapping.internalServiceId },
                    data: { pricePer1000: newPrice }
                });

                await prisma.adminLog.create({
                    data: {
                        adminId: 'system-pricing',
                        action: 'UPDATE_SERVICE',
                        targetId: mapping.internalServiceId,
                        details: `Auto-price update: ${currentInternalPrice} -> ${newPrice} (Provider: ${mapping.provider.name})`
                    }
                });

                updates.push({
                    name: mapping.internalService.name,
                    old: currentInternalPrice.toNumber(),
                    new: newPrice.toNumber()
                });
            }
        }

        return updates;
    }

    /**
     * Синхронизирует цену конкретной услуги на основе её маппингов
     */
    static async syncInternalServicePrice(serviceId: string, projectId?: string, overrideCost?: Decimal) {
        const mappings = await prisma.internalServiceMapping.findMany({
            where: { internalServiceId: serviceId, isActive: true },
            include: { providerService: true, internalService: true, provider: true },
            orderBy: { priority: 'asc' }
        });

        if (mappings.length === 0) return { priceUpdated: false };

        let maxCost = new Decimal(0);
        let minCost = new Decimal(Infinity);
        let cheapestMapping = mappings[0];

        if (overrideCost) {
            maxCost = overrideCost;
            minCost = overrideCost;
        } else {
            mappings.forEach(m => {
                if (m.providerService) {
                    const cost = m.providerService.rawPrice;
                    if (cost.gt(maxCost)) maxCost = cost;
                    if (cost.lt(minCost)) {
                        minCost = cost;
                        cheapestMapping = m;
                    }
                }
            });
        }

        if (maxCost.isZero() || minCost.equals(Infinity)) return { priceUpdated: false };

        const service = mappings[0].internalService;

        const targetPrice = await this.calculateRetailPrice(maxCost, {
            providerName: cheapestMapping.provider.name,
            category: service.category,
            projectId
        });

        let priceUpdated = false;
        if (service.pricePer1000.lt(targetPrice)) {
            await prisma.internalService.update({
                where: { id: serviceId },
                data: {
                    pricePer1000: targetPrice,
                    lastProviderPrice: maxCost
                }
            });
            priceUpdated = true;
        } else {
            await prisma.internalService.update({
                where: { id: serviceId },
                data: { lastProviderPrice: maxCost }
            });
        }

        return {
            priceUpdated,
            newPrice: priceUpdated ? targetPrice : service.pricePer1000,
            Cheaper: minCost.lt(maxCost),
            cheapestProvider: cheapestMapping.provider.name,
            minCost,
            maxCost
        };
    }

    /**
     * Возвращает цену за одну единицу услуги в понятном для человека формате.
     */
    static getPricePerUnit(pricePer1000: Decimal | number): string {
        const unitPrice = new Decimal(pricePer1000).div(1000);
        if (unitPrice.gte(1)) {
            return unitPrice.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toString();
        }
        return unitPrice.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toString();
    }

    /**
     * Возвращает цену услуги для конкретного проекта (с учетом оверрайдов и правил наценки)
     */
    static async getServicePrice(serviceId: string, projectId?: string | null): Promise<Decimal> {
        if (!projectId) {
            const service = await prisma.internalService.findUnique({ where: { id: serviceId } });
            if (!service) throw new Error('Service not found');
            return service.pricePer1000;
        }

        const service = await prisma.internalService.findUnique({
            where: { id: serviceId },
            include: { projectOverrides: { where: { projectId: projectId } } }
        });

        if (!service) throw new Error('Service not found');

        if (service.projectOverrides && service.projectOverrides.length > 0) {
            const override = service.projectOverrides[0];
            if (override.customPrice) {
                const cost = service.lastProviderPrice;
                if (cost && cost.gt(0)) {
                    const safetyPrice = this.getSafetyPrice(cost);
                    const maxPrice = cost.mul(this.MAX_MARKUP_MULTIPLIER);
                    if (override.customPrice.lt(safetyPrice)) return safetyPrice;
                    if (override.customPrice.gt(maxPrice)) return maxPrice;
                }
                return override.customPrice;
            }
        }

        return service.pricePer1000;
    }

    /**
     * Рассчитывает детали заказа: стоимость, скидку и итоговую цену
     */
    static async calculateOrderDetails(userId: string, serviceId: string, quantity: number, projectId?: string | null) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const currentPricePer1000 = await this.getServicePrice(serviceId, projectId || undefined);
        const basePrice = currentPricePer1000.mul(quantity).div(1000);

        const loyalty = await LoyaltyService.getLoyaltyInfo(userId, user.spent.toNumber(), projectId || undefined);
        const discountPercent = loyalty.totalDiscount;

        const discountAmount = basePrice.mul(discountPercent).div(100).toDecimalPlaces(2);
        const finalPrice = basePrice.minus(discountAmount).toDecimalPlaces(2);

        return {
            basePrice,
            discountPercent,
            discountAmount,
            finalPrice
        };
    }

    /**
     * Возвращает аналитику наценок по всем услугам для суперадмина
     */
    static async getMarkupAnalytics() {
        const services = await prisma.internalService.findMany({
            select: { id: true, name: true, pricePer1000: true, lastProviderPrice: true, platform: true }
        });

        const stats = {
            total: services.length,
            normal: 0, high: 0, warning: 0, abuse: 0, loss: 0
        };

        const extremeServices: any[] = [];

        services.forEach(s => {
            if (!s.lastProviderPrice || s.lastProviderPrice.isZero()) return;
            const multiplier = s.pricePer1000.div(s.lastProviderPrice).toNumber();
            const markupPercent = (multiplier - 1) * 100;

            if (multiplier < 2) stats.loss++;
            else if (markupPercent < 1000) stats.normal++;
            else if (markupPercent < 5000) stats.high++;
            else if (markupPercent < 15000) stats.warning++;
            else {
                stats.abuse++;
                extremeServices.push({
                    id: s.id, name: s.name, platform: s.platform,
                    markup: Math.round(markupPercent), price: s.pricePer1000.toNumber()
                });
            }
        });

        return { stats, extremeServices: extremeServices.sort((a, b) => b.markup - a.markup).slice(0, 10) };
    }
}
