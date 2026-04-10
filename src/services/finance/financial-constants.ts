/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 * 
 * ЕДИНЫЙ ИСТОЧНИК ФИНАНСОВЫХ КОНСТАНТ ПЛАТФОРМЫ
 * =============================================
 * Все налоговые ставки, комиссии и наценки определяются ТОЛЬКО здесь.
 * Любой другой файл ОБЯЗАН импортировать константы из этого модуля.
 * 
 * Правовая основа: УСН 6% + НДС 5% (спецставка), ФЗ №176-ФЗ, ФЗ №425-ФЗ
 * Верифицировано: март 2026
 */

// ═══════════════════════════════════════════════════════
// 💰 НАЛОГИ (Россия, 2026)
// ═══════════════════════════════════════════════════════

/** УСН «Доходы» — 6% с полной суммы поступления (до вычета комиссий) */
export const TAX_USN_INCOME_RATE = 0.06;

/** НДС спецставка для УСН при обороте 20-272.5 млн руб./год (без права на вычет) */
export const TAX_VAT_USN_SPECIAL_RATE = 0.05;

/** НДС спецставка для УСН при обороте 272.5-490.5 млн руб./год */
export const TAX_VAT_USN_HIGH_RATE = 0.07;

/** Базовый НДС (ОСНО) — повышен с 20% до 22% с 01.01.2026 */
export const TAX_VAT_GENERAL_RATE = 0.22;

/** Налог на прибыль (ОСНО) — повышен с 20% до 25% с 01.01.2025 */
export const TAX_PROFIT_RATE = 0.25;

/** Страховые взносы IT-компании (с аккредитацией) до предельной базы 2 979 000 руб. */
export const TAX_IT_INSURANCE_RATE = 0.15;

/** Страховые взносы IT-компании свыше предельной базы */
export const TAX_IT_INSURANCE_OVER_BASE_RATE = 0.076;

// ═══════════════════════════════════════════════════════
// 💳 ЭКВАЙРИНГ (Payment Gateways)
// ═══════════════════════════════════════════════════════

/** YooKassa — карты РФ (safe-константа, верхняя граница 2.8-3.5%) */
export const ACQUIRING_YOOKASSA_CARDS = 0.035;

/** YooKassa — иностранные карты (до 5%) */
export const ACQUIRING_YOOKASSA_FOREIGN = 0.05;

/** YooKassa — СБП (0.4-0.7%) */
export const ACQUIRING_YOOKASSA_SBP = 0.007;

/** Robokassa (3.9-5%) */
export const ACQUIRING_ROBOKASSA = 0.05;

/** Safe-константа для расчётов: максимальная комиссия шлюза */
export const ACQUIRING_SAFE_MAX = 0.035;

// ═══════════════════════════════════════════════════════
// 📊 НАЦЕНКИ (Markup)
// ═══════════════════════════════════════════════════════

/** B2B наценка для франчайзи/реселлеров (200% = 2.0 поверх себестоимости провайдера)
 *  Обеспечивает гарантию того, что владелец забирает себе 200% наценки поверх себестоимости. */
export const B2B_DEFAULT_MARKUP = 2.00;

/** Рекомендуемая минимальная наценка для обычных розничных B2C клиентов (5.0 = 500% наценка)
 *  Цена = Себестоимость + (Себестоимость * 5) = Себестоимость * 6 */
export const B2C_RECOMMENDED_MARKUP = 5.0;

/** Абсолютный нижний порог защиты (Safety Floor) для Любых транзакций (1.0 = 100% наценка)
 *  Система хард-локнет любой заказ (даже со скидками), если итоговая грязная наценка упадет ниже 100%. */
export const SAFETY_FLOOR_MARKUP = 1.0;

/** Константа-помощник: Рекомендуемый множитель розничной цены (x6) к стоимости провайдера */
export const B2C_RECOMMENDED_MULTIPLIER = 6.0;

/** Максимальный множитель наценки (x151 = 15000%) */
export const MAX_MARKUP_MULTIPLIER = 151.0;

// ═══════════════════════════════════════════════════════
// 🌐 ВАЛЮТА
// ═══════════════════════════════════════════════════════

/** Буфер на банковский спред при конвертации USD → RUB */
export const CURRENCY_SPREAD_BUFFER = 0.03;

// ═══════════════════════════════════════════════════════
// 🧮 ВЫЧИСЛЯЕМЫЕ ЗНАЧЕНИЯ
// ═══════════════════════════════════════════════════════

/** Суммарные налоги с выручки (УСН + НДС спецставка) */
export const TOTAL_TAX_FROM_REVENUE = TAX_USN_INCOME_RATE + TAX_VAT_USN_SPECIAL_RATE; // 0.11

/** Суммарные обязательные отчисления с выручки (Налоги + Эквайринг) */
export const TOTAL_MANDATORY_DEDUCTIONS = TOTAL_TAX_FROM_REVENUE + ACQUIRING_SAFE_MAX; // 0.145

/**
 * Рассчитывает минимальную наценку для покрытия всех издержек
 * @param targetNetMargin — целевая чистая прибыль (0.10 = 10%)
 * @param opex — операционные расходы как доля от выручки (0.08 = 8%)
 * @returns Множитель наценки (например, 0.48 = 48% наценка)
 */
export function calculateMinimumMarkup(targetNetMargin: number, opex: number = 0): number {
    const totalDeductions = TOTAL_MANDATORY_DEDUCTIONS + opex + targetNetMargin;
    if (totalDeductions >= 1) throw new Error('FINANCIAL_ERROR: Суммарные издержки >= 100% выручки, бизнес невозможен');
    return (1 / (1 - totalDeductions)) - 1;
}

/**
 * Рассчитывает чистую маржу при заданной наценке
 * @param markup — наценка (1.0 = 100%, 4.0 = 400%)
 * @param opex — операционные расходы как доля от выручки
 * @returns Чистая маржа (0.275 = 27.5%)
 */
export function calculateNetMargin(markup: number, opex: number = 0): number {
    const costShare = 1 / (1 + markup); // Доля себестоимости в выручке
    return 1 - TOTAL_MANDATORY_DEDUCTIONS - opex - costShare;
}
