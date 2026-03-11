'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Currency = 'RUB' | 'USD';
type Unit = 1000 | 1;

interface PriceDisplayContextType {
    currency: Currency;
    unit: Unit;
    setCurrency: (c: Currency) => void;
    setUnit: (u: Unit) => void;
    convertPrice: (priceInRubPer1000: number) => number;
    formatPrice: (priceInRubPer1000: number) => string;
    usdRate: number;
}

const PriceDisplayContext = createContext<PriceDisplayContextType | undefined>(undefined);

export function PriceDisplayProvider({ children, usdRate = 90 }: { children: ReactNode, usdRate?: number }) {
    const [currency, setCurrency] = useState<Currency>('RUB');
    const [unit, setUnit] = useState<Unit>(1000);

    const convertPrice = (priceInRubPer1000: number) => {
        let price = priceInRubPer1000;

        // 1. Convert unit (1000 -> 1)
        if (unit === 1) {
            price = price / 1000;
        }

        // 2. Convert currency
        if (currency === 'USD') {
            price = price / usdRate;
        }

        return price;
    };

    const formatPrice = (priceInRubPer1000: number) => {
        const converted = convertPrice(Number(priceInRubPer1000));
        const symbol = currency === 'RUB' ? '₽' : '$';

        // Use more decimals for 1 item mode or USD
        const precision = (unit === 1 || currency === 'USD') ? 4 : 2;

        return `${converted.toFixed(precision)}${symbol}`;
    };

    return (
        <PriceDisplayContext.Provider value={{ currency, unit, setCurrency, setUnit, convertPrice, formatPrice, usdRate }}>
            {children}
        </PriceDisplayContext.Provider>
    );
}

export function usePriceDisplay() {
    const context = useContext(PriceDisplayContext);
    if (!context) {
        throw new Error('usePriceDisplay must be used within a PriceDisplayProvider');
    }
    return context;
}
