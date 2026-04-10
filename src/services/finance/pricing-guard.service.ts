/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { Decimal } from 'decimal.js';
import { SAFETY_FLOOR_MARKUP, TOTAL_MANDATORY_DEDUCTIONS } from './financial-constants';

export class PricingGuard {
    /**
     * Валидирует финальную транзакцию заказа на предмет убытков.
     * HARD-BLOCK: Транзакция блокируется, если чистая прибыль падает ниже 100% от стоимости провайдера.
     * 
     * @param retailFinalPrice Итоговая цена, которую платит клиент (с учетом всех скидок)
     * @param providerCost Общая долларовая/рублевая себестоимость услуги от провайдера
     * @throws Error в случае нарушения финансовой безопасности
     */
    static validateCheckoutPayload(retailFinalPrice: Decimal | number, providerCost: Decimal | number): void {
        const retail = new Decimal(retailFinalPrice);
        const cost = new Decimal(providerCost);

        if (cost.isZero() || retail.isZero()) return; // Бесплатные тестовые услуги скипаются

        // 1. Вычисляем налоги и эквайринг (14.5% от суммы чека)
        const totalDeductions = retail.mul(TOTAL_MANDATORY_DEDUCTIONS);
        
        // 2. Вычисляем чистую выручку (Net Revenue)
        const netRevenue = retail.minus(totalDeductions);

        // 3. Вычисляем минимальный допустимый профит (согласно SAFETY_FLOOR_MARKUP = 1.0 (100%))
        // Profit = Cost * SAFETY_FLOOR_MARKUP. При 100% профит равен стоимости.
        const targetMinimumProfit = cost.mul(SAFETY_FLOOR_MARKUP);
        
        // 4. Минимально необходимая чистая выручка (чтобы окупить закуп + 100% маржи)
        const requiredNetRevenue = cost.add(targetMinimumProfit);

        if (netRevenue.lt(requiredNetRevenue)) {
            throw new Error(`FINANCIAL_RISK_BLOCK: Сделка заблокирована фин-мониторингом. Чистая прибыль после уплаты налогов (14.5%) падает ниже допустимого минимума (100% себестоимости). Итоговая чистая выручка: ${netRevenue.toFixed(2)}₽, требуется минимум: ${requiredNetRevenue.toFixed(2)}₽.`);
        }
    }
}
