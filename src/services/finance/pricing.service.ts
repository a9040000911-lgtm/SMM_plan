/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { SettingsService } from '@/services/core/settings.service';
import { LoyaltyService } from '@/services/users/loyalty.service';
import { PromoService } from '@/services/users/promo.service';
import { Category } from '@prisma/client';
import { PricingRules } from '@/types/project-settings';

import { MarkupRule, LadderLevel } from '@/services/types';
import { ACQUIRING_SAFE_MAX, SAFETY_FLOOR_MARKUP, MAX_MARKUP_MULTIPLIER as MAX_MARKUP_CONST } from './financial-constants';

export class PricingService {
    private static readonly LADDER_SETTINGS_KEY = 'PRICING_LADDER';
    private static readonly CATEGORY_MULTIPLIERS_SETTINGS_KEY = 'CATEGORY_MULTIPLIERS';
    private static readonly AUTO_DECREASE_SETTINGS_KEY = 'PRICING_AUTO_DECREASE';

    // Константы безопасности (делегируют к financial-constants.ts)
    public static readonly MIN_PROFIT_MARGIN = SAFETY_FLOOR_MARKUP; // Минимальная наценка x2 (реальная маржа ~38% после налогов и эквайринга)
    public static readonly PAYMENT_GATEWAY_FEE = ACQUIRING_SAFE_MAX; // Комиссия платежного шлюза 3.5% (YooKassa safe-константа)
    public static readonly MAX_MARKUP_MULTIPLIER = MAX_MARKUP_CONST; // Максимальный множитель: 15000% наценки

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

        // 4. Психологическое "КРАСИВОЕ" округление вверх
        return this.applyBeautifulRounding(price);
    }

    /**
     * Психологическое округление розничных цен за 1000 единиц ПУТЕМ РАСЧЕТА ЗА ШТУКУ.
     * "Красивая цена в нашем случае, это цена без большого количества цифр после запятой."
     * Мы математически гарантируем, что при пересчете за 1 штуку никогда не будет больше 2 знаков.
     */
    public static applyBeautifulRounding(priceDecimal: Decimal): Decimal {
        const val = priceDecimal.toNumber();
        if (val === 0) return new Decimal(0);

        let p: number;

        if (val < 1000) {
            // Для цен до 1000₽ (меньше 1 рубля за штуку).
            // Округляем ВВЕРХ до кратного 10, чтобы цена за штуку всегда имела ровно 2 знака (0.01₽ - 0.99₽).
            // Пример: 142.4₽ -> 150.00₽ (0.15₽/шт). 5₽ -> 10.00₽ (0.01₽/шт).
            p = Math.ceil(val / 10) * 10;
        }
        else {
            // Для дорогих услуг (> 1000₽, то есть > 1 рубля за штуку).
            // Округляем ВВЕРХ до кратного 100, чтобы цена за штуку имела максимум 1 знак (1.5₽, 5.5₽).
            // Пример: 1426₽ -> 1500.00₽ (1.5₽/шт). 5422₽ -> 5500.00₽ (5.5₽/шт).
            p = Math.ceil(val / 100) * 100;
        }

        return new Decimal(p.toFixed(2));
    }

    /**
     * Возвращает абсолютную минимальную цену продажи (Себестоимость + Маржа + Шлюз)
     */
    static getSafetyPrice(providerCost: Decimal | number): Decimal {
        const cost = new Decimal(providerCost);
        // Формула: (Закуп + 100% маржи) * 1.03 (шлюз)
        const safetyPrice = cost.mul(1 + this.MIN_PROFIT_MARGIN).mul(1 + this.PAYMENT_GATEWAY_FEE);
        return safetyPrice.mul(10).toDecimalPlaces(0, Decimal.ROUND_CEIL).div(10);
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
     * Проверяет, включено ли автоматическое снижение цен (из GlobalSetting).
     * По умолчанию false — цены только повышаются.
     */
    private static async isAutoDecreaseEnabled(): Promise<boolean> {
        const setting = await prisma.globalSetting.findUnique({
            where: { key: 'PRICING_AUTO_DECREASE' }
        });
        return setting?.value === 'true';
    }

    /**
     * Проверяет и корректирует цены услуг на основе цен провайдеров
     */
    static async syncInternalPrices(projectId?: string) {
        // Получаем все активные маппинги, чтобы извлечь уникальные услуги
        const mappings = await prisma.internalServiceMapping.findMany({
            where: { isActive: true },
            select: { internalServiceId: true }
        });

        // Убираем дубликаты
        const uniqueServiceIds = [...new Set(mappings.map(m => m.internalServiceId))];
        const updates = [];

        // Синхронизируем каждую услугу через консистентный метод (с Average + Anti-Jitter)
        for (const serviceId of uniqueServiceIds) {
            const result = await this.syncInternalServicePrice(serviceId, projectId);
            if (result.priceUpdated && result.direction) {
                // Если цена обновлена, запишем в результат
                updates.push({
                    name: `Service ${serviceId}`,
                    old: result.oldPrice,
                    new: result.newPrice.toNumber(),
                    direction: result.direction
                });
                
                await prisma.adminLog.create({
                    data: {
                        adminId: 'system-pricing',
                        action: 'UPDATE_SERVICE',
                        targetId: serviceId,
                        details: `Auto-price ${result.direction}: ${result.oldPrice} -> ${result.newPrice} (Based on Average Cost of ${result.avgCost.toFixed(4)})`
                    }
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

        const service = mappings[0].internalService;
        const currentPrice = service.pricePer1000;

        // ─── Вычисляем базовую стоимость ─────────────────────────────────────────
        let avgCost: Decimal;
        let minCost = new Decimal(Infinity);
        let cheapestMapping = mappings[0];

        if (overrideCost) {
            avgCost = overrideCost;
            minCost = overrideCost;
        } else {
            const validPrices: Decimal[] = [];
            mappings.forEach(m => {
                if (m.providerService && !m.providerService.rawPrice.isZero()) {
                    const cost = m.providerService.rawPrice;
                    validPrices.push(cost);
                    if (cost.lt(minCost)) {
                        minCost = cost;
                        cheapestMapping = m;
                    }
                }
            });

            if (validPrices.length === 0) return { priceUpdated: false };

            // Усредняем себестоимость по всем активным провайдерам
            const sum = validPrices.reduce((acc, p) => acc.add(p), new Decimal(0));
            avgCost = sum.div(validPrices.length);
        }

        if (avgCost.isZero() || minCost.equals(Infinity)) return { priceUpdated: false };

        // ─── Расчёт целевой розничной цены (по avgCost) ──────────────────────────
        const targetPrice = await this.calculateRetailPrice(avgCost, {
            providerName: cheapestMapping.provider.name,
            category: service.categoryId as any,
            projectId
        });

        // ─── Safety Floor (500% от средней себестоимости) ────────────────────────
        const safetyPrice = this.getSafetyPrice(avgCost);
        const finalPrice = targetPrice.lt(safetyPrice) ? safetyPrice : targetPrice;

        // ─── Anti-Jitter: игнорируем изменения < 5% ──────────────────────────────
        const JITTER_THRESHOLD = 0.05; // 5%
        if (currentPrice.gt(0)) {
            const priceDiff = finalPrice.sub(currentPrice).abs().div(currentPrice).toNumber();
            if (priceDiff < JITTER_THRESHOLD) {
                // Микроизменение — только обновляем lastProviderPrice, НЕ меняем витрину
                await prisma.internalService.update({
                    where: { id: serviceId },
                    data: { lastProviderPrice: avgCost }
                });
                return { priceUpdated: false, avgCost };
            }
        }

        // ─── Проверяем настройку автоснижения ────────────────────────────────────
        const allowDecrease = await this.isAutoDecreaseEnabled();
        const shouldRaise = currentPrice.lt(finalPrice);
        const shouldLower = allowDecrease && currentPrice.gt(finalPrice);

        if (!shouldRaise && !shouldLower) {
            await prisma.internalService.update({
                where: { id: serviceId },
                data: { lastProviderPrice: avgCost }
            });
            return { priceUpdated: false, avgCost };
        }

        const direction = finalPrice.gt(currentPrice) ? '↑' : '↓';
        const finalMarkup = avgCost.gt(0)
            ? finalPrice.sub(avgCost).div(avgCost).mul(100).toDecimalPlaces(2)
            : new Decimal(0);

        await prisma.internalService.update({
            where: { id: serviceId },
            data: {
                pricePer1000: finalPrice,
                markup: finalMarkup,
                lastProviderPrice: avgCost
            }
        });

        return {
            priceUpdated: true,
            oldPrice: currentPrice.toNumber(),
            newPrice: finalPrice,
            avgCost,
            direction,
            Cheaper: minCost.lt(avgCost),
            cheapestProvider: cheapestMapping.provider.name,
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
    static async calculateOrderDetails(userId: string, serviceId: string, quantity: number, projectId?: string | null, promoCodeStr?: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('User not found');

        const currentPricePer1000 = await this.getServicePrice(serviceId, projectId || undefined);
        const basePrice = currentPricePer1000.mul(quantity).div(1000);

        const loyalty = await LoyaltyService.getLoyaltyInfo(userId, user.spent, projectId || undefined);
        let discountPercent = loyalty.totalDiscount;
        let promoId: string | undefined;

        if (promoCodeStr) {
            const promoRes = await PromoService.validatePromo(promoCodeStr, userId, projectId);
            if (promoRes.valid && promoRes.promo) {
                discountPercent += promoRes.promo.discountPercent;
                promoId = promoRes.promo.id;
            }
        }

        if (discountPercent > 100) discountPercent = 100;

        const discountAmount = basePrice.mul(discountPercent).div(100).toDecimalPlaces(2);
        const finalPrice = basePrice.minus(discountAmount).toDecimalPlaces(2);

        return {
            basePrice,
            discountPercent,
            discountAmount,
            finalPrice,
            promoId
        };
    }

    /**
     * Возвращает аналитику наценок по всем услугам для суперадмина
     */
    static async getMarkupAnalytics() {
        const services = await prisma.internalService.findMany({
            select: { id: true, name: true, pricePer1000: true, lastProviderPrice: true, socialPlatformId: true }
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
                    id: s.id, name: s.name, platform: s.socialPlatformId,
                    markup: Math.round(markupPercent), price: s.pricePer1000.toNumber()
                });
            }
        });

        return { stats, extremeServices: extremeServices.sort((a, b) => b.markup - a.markup).slice(0, 10) };
    }
}


