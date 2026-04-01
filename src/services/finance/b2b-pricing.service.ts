/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { B2B_DEFAULT_MARKUP } from './financial-constants';

export class B2BPricingService {
    // Делегирует к единому источнику: financial-constants.ts
    // NetMargin при 100%: ~27.5% (УСН 6% + НДС 5% + Acq 3.5% + OpEx 8%)
    public static readonly B2B_DEFAULT_MARKUP = B2B_DEFAULT_MARKUP;

    /**
     * Рассчитывает оптовую B2B стоимость (B2B Cost), которую Smmplan списывает с Франчайзи
     * @param providerCost Себестоимость провайдера
     * @param overrideMarkup Переопределение маржи из БД (например 0.50 для 50%)
     */
    static calculateB2BCost(providerCost: Decimal | number, overrideMarkup?: number): Decimal {
        const cost = new Decimal(providerCost);
        if (cost.isZero()) return new Decimal(0);

        const markup = overrideMarkup !== undefined ? overrideMarkup : this.B2B_DEFAULT_MARKUP;

        // Формула: Последняя цена провайдера + Маржа Smmplan (например, 50%)
        const b2bCost = cost.mul(1 + markup);

        // Округляем до 0.01 вверх, чтобы не уходить в минус из-за float loss
        return b2bCost.toDecimalPlaces(2, Decimal.ROUND_CEIL);
    }

    /**
     * Проверяет, освобождена ли Организация от биллинга (Глобальный Владелец)
     * Это правило защищает аккаунты владельцев платформы от бесконечных списаний.
     */
    static async isBillingExempt(organizationId: string | null): Promise<boolean> {
        if (!organizationId) {
            // Если заказ происходит на сиротском проекте без организации — мы считаем его Exempt для совместимости,
            // но в идеале все проекты должны быть привязаны к Organization.
            return true;
        }

        const org = await prisma.organization.findUnique({
            where: { id: organizationId },
            include: { owner: { select: { isGlobalAdmin: true } } }
        });

        // Если организация не найдена или ее владелец — Глобальный Админ, биллинг отключен
        if (!org || org.owner.isGlobalAdmin) {
            return true;
        }

        return false;
    }
}
