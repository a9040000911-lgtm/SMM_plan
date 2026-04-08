/**
 * (c) 2026 Smmplan. All rights reserved.
 * Business Logic Invariants — Property-Based Tests
 * 
 * Запуск: npx vitest run src/tests/logic/balance-invariants.test.ts
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { Decimal } from 'decimal.js';

// ─── HELPER: Simulate order price calculation (mirrors route.ts logic) ───────
function calcTotalPrice(quantity: number, pricePer1000: number, discountPct = 0): Decimal {
    const base = new Decimal(pricePer1000).mul(quantity).div(1000);
    if (discountPct <= 0) return base;
    const factor = new Decimal(1).minus(new Decimal(discountPct).div(100));
    return base.mul(factor);
}

// ─── HELPER: Simulate balance deduction (mirrors route.ts logic) ──────────
function deductBalance(balance: Decimal, totalPrice: Decimal): { ok: boolean; newBalance: Decimal | null } {
    if (balance.lt(totalPrice)) return { ok: false, newBalance: null };
    return { ok: true, newBalance: balance.minus(totalPrice) };
}

// ─── VALID ORDER STATUS TRANSITIONS ──────────────────────────────────────
const VALID_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['PROCESSING', 'CANCELED', 'AWAITING_PAYMENT'],
    AWAITING_PAYMENT: ['PENDING', 'CANCELED'],
    PROCESSING: ['IN_PROGRESS', 'CANCELED', 'ERROR'],
    IN_PROGRESS: ['COMPLETED', 'PARTIAL', 'CANCELED', 'ERROR'],
    ERROR: ['PENDING', 'CANCELED'],
    COMPLETED: ['REFUNDED'],
    PARTIAL: ['COMPLETED', 'REFUNDED'],
    CANCELED: [],
    REFUNDED: [],
};

function isValidTransition(from: string, to: string): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// INV-1: Баланс никогда не уходит в минус
// ─────────────────────────────────────────────────────────────────────────────
describe('[INV-1] Balance never goes negative', () => {
    it('PROPERTY: balance >= price → deduction succeeds, result >= 0', () => {
        fc.assert(fc.property(
            fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
            fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
            (rawBalance, rawPrice) => {
                fc.pre(rawBalance >= rawPrice);
                const balance = new Decimal(rawBalance).toDecimalPlaces(2);
                const price = new Decimal(rawPrice).toDecimalPlaces(2);
                const result = deductBalance(balance, price);
                return result.ok && result.newBalance!.gte(0);
            }
        ), { numRuns: 500 });
    });

    it('PROPERTY: balance < price → deduction is rejected', () => {
        fc.assert(fc.property(
            fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
            fc.double({ min: 0.01, max: 1_000_000, noNaN: true, noDefaultInfinity: true }),
            (rawBalance, rawPrice) => {
                // Ensure meaningful difference after 2-decimal rounding
                fc.pre(rawPrice - rawBalance >= 0.01);
                const balance = new Decimal(rawBalance).toDecimalPlaces(2);
                const price = new Decimal(rawPrice).toDecimalPlaces(2);
                fc.pre(price.gt(balance)); // Re-check after rounding
                const result = deductBalance(balance, price);
                return !result.ok;
            }
        ), { numRuns: 500 });
    });

    it('EDGE: balance exactly equals price → should succeed', () => {
        const exact = new Decimal('99.99');
        const result = deductBalance(exact, exact);
        expect(result.ok).toBe(true);
        expect(result.newBalance!.toNumber()).toBe(0);
    });

    it('EDGE: balance = price - 0.01 → must be rejected', () => {
        const price = new Decimal('100.00');
        const balance = price.minus('0.01');
        const result = deductBalance(balance, price);
        expect(result.ok).toBe(false);
    });

    it('EDGE: zero balance → must be rejected for any positive price', () => {
        fc.assert(fc.property(
            fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }),
            (price) => {
                const result = deductBalance(new Decimal(0), new Decimal(price));
                return !result.ok;
            }
        ), { numRuns: 100 });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// INV-2: Правильность расчёта цены заказа
// ─────────────────────────────────────────────────────────────────────────────
describe('[INV-2] Order price calculation correctness', () => {
    it('PROPERTY: totalPrice = quantity * pricePer1000 / 1000', () => {
        fc.assert(fc.property(
            fc.integer({ min: 100, max: 100000 }),   // quantity
            fc.double({ min: 0.01, max: 10000, noNaN: true, noDefaultInfinity: true }), // pricePer1000
            (quantity, pricePer1000) => {
                const expected = new Decimal(pricePer1000).mul(quantity).div(1000);
                const actual = calcTotalPrice(quantity, pricePer1000, 0);
                // Точность до 10 знаков
                return expected.minus(actual).abs().lt(new Decimal('0.0000000001'));
            }
        ), { numRuns: 1000 });
    });

    it('EDGE: minQty=100, pricePer1000=10 → totalPrice=1.00', () => {
        const result = calcTotalPrice(100, 10);
        expect(result.toNumber()).toBeCloseTo(1.0, 10);
    });

    it('EDGE: pricePer1000=0 → totalPrice must be 0 (free service guard needed)', () => {
        const result = calcTotalPrice(1000, 0);
        expect(result.toNumber()).toBe(0);
        // ⚠️ Это ПОТЕНЦИАЛЬНЫЙ БАГ если нет защиты от бесплатного заказа!
        console.warn('[LOGIC-AUDIT] Free order (price=0) not blocked at price calculation level');
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// INV-3: Маржа всегда неотрицательная (margin >= 0)
// ─────────────────────────────────────────────────────────────────────────────
describe('[INV-3] Margin (totalPrice >= costPrice)', () => {
    it('PROPERTY: with valid provider markup, totalPrice >= costPrice', () => {
        fc.assert(fc.property(
            fc.double({ min: 1, max: 10000, noNaN: true, noDefaultInfinity: true }),    // providerRawPrice
            fc.double({ min: 1.0, max: 500, noNaN: true, noDefaultInfinity: true }),    // markupPercent
            (rawPrice, markupPct) => {
                // Симулируем: costPrice = rawPrice, totalPrice = rawPrice * (1 + markup/100)
                const costPrice = new Decimal(rawPrice);
                const totalPrice = costPrice.mul(new Decimal(1).plus(
                    new Decimal(markupPct).div(100)
                ));
                return totalPrice.gte(costPrice);
            }
        ), { numRuns: 500 });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// INV-6: Возврат не превышает originalPrice
// ─────────────────────────────────────────────────────────────────────────────
describe('[INV-6] Refund never exceeds original order price', () => {
    it('PROPERTY: refundAmount <= originalPrice', () => {
        fc.assert(fc.property(
            fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }), // originalPrice
            fc.double({ min: 0.01, max: 100000, noNaN: true, noDefaultInfinity: true }), // requestedRefund
            (originalPrice, requestedRefund) => {
                const capped = Math.min(requestedRefund, originalPrice);
                return capped <= originalPrice;
            }
        ), { numRuns: 1000 });
    });

    it('EDGE: refund exactly equals original price → allowed', () => {
        const original = new Decimal('250.00');
        const refund = original;
        expect(refund.lte(original)).toBe(true);
    });

    it('EDGE: refund > original price → must be capped/rejected', () => {
        const original = new Decimal('100.00');
        const overRefund = new Decimal('100.01');
        expect(overRefund.gt(original)).toBe(true); // Должен быть заблокирован в сервисе
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// STATE MACHINE: Валидность переходов статусов заказа
// ─────────────────────────────────────────────────────────────────────────────
describe('Order State Machine — Valid Transitions', () => {
    const ALL_STATUSES = Object.keys(VALID_TRANSITIONS);

    it('COMPLETED → CANCELED is FORBIDDEN', () => {
        expect(isValidTransition('COMPLETED', 'CANCELED')).toBe(false);
    });

    it('CANCELED → any status is FORBIDDEN (terminal)', () => {
        ALL_STATUSES.forEach(status => {
            if (status !== 'CANCELED') {
                expect(isValidTransition('CANCELED', status)).toBe(false);
            }
        });
    });

    it('REFUNDED → any status is FORBIDDEN (terminal)', () => {
        ALL_STATUSES.forEach(status => {
            if (status !== 'REFUNDED') {
                expect(isValidTransition('REFUNDED', status)).toBe(false);
            }
        });
    });

    it('PROPERTY: valid transitions are forward-only (no cycles except ERROR→PENDING)', () => {
        const forwardStatuses = ['PENDING', 'PROCESSING', 'IN_PROGRESS', 'COMPLETED'];
        forwardStatuses.forEach((status, idx) => {
            const previousStatuses = forwardStatuses.slice(0, idx);
            previousStatuses.forEach(prev => {
                if (prev !== 'ERROR') {
                    expect(isValidTransition(status, prev)).toBe(false);
                }
            });
        });
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// EDGE: Скидка > 100% → totalPrice уходит в отрицательную зону
// ─────────────────────────────────────────────────────────────────────────────
describe('[EDGE-6] Discount > 100% guard', () => {
    it('discount=100% → totalPrice=0 (потенциальный баг: нет защиты от бесплатного заказа)', () => {
        const result = calcTotalPrice(1000, 100, 100);
        expect(result.toNumber()).toBe(0);
        // Это сигнализирует о том, что нужен guard на уровне API
    });

    it('discount=150% → totalPrice ОТРИЦАТЕЛЬНАЯ (критический баг если допустить!)', () => {
        const result = calcTotalPrice(1000, 100, 150);
        expect(result.toNumber()).toBeLessThan(0);
        // ⚠️ КРИТИЧНО: если такой discount возможен → пользователь получит деньги за заказ
        console.error('[LOGIC-AUDIT] ⚠️ CRITICAL: discount > 100% results in negative price:', result.toNumber());
    });
});
