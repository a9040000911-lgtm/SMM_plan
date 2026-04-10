/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
'use client';

import React from 'react';
import { Decimal } from 'decimal.js';
import { TOTAL_MANDATORY_DEDUCTIONS, SAFETY_FLOOR_MARKUP } from '@/services/finance/financial-constants';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface FinanceTrafficLightProps {
    providerCost: number;
    retailPrice: number;
}

export function FinanceTrafficLight({ providerCost, retailPrice }: FinanceTrafficLightProps) {
    if (!providerCost || !retailPrice) return null;

    const retail = new Decimal(retailPrice);
    const cost = new Decimal(providerCost);

    if (cost.isZero() || retail.isZero()) return null;

    // Налоги + Эквайринг (14.5%)
    const deductionsBase = retail.mul(TOTAL_MANDATORY_DEDUCTIONS);
    const netRevenue = retail.minus(deductionsBase);
    
    // Чистая прибыль (Сколько денег реально остается у нас поверх оплаты провайдеру)
    const pureProfit = netRevenue.minus(cost);

    // Доля наценки к себестоимости в процентах. Если прибыль = себестоимости, это 100% наценка.
    const markupPercent = pureProfit.div(cost).mul(100).toNumber();

    // Считаем минимально необходимый профит (SAFETY_FLOOR_MARKUP = 1.0 = 100% профита)
    const targetProfit = cost.mul(SAFETY_FLOOR_MARKUP);
    
    // Светофорная логика
    // Красный: Профит меньше минимального целевого профита (наценка < 100%)
    // Желтый: Наценка между 100% и 250%
    // Зеленый: Наценка > 250%
    const isDanger = pureProfit.lt(targetProfit);
    const isWarning = !isDanger && markupPercent < 250;
    const isSuccess = !isDanger && !isWarning;

    let bgColor = 'bg-gray-100 dark:bg-gray-800';
    let borderColor = 'border-gray-200 dark:border-gray-700';
    let textColor = 'text-gray-700 dark:text-gray-300';
    let Icon = Info;

    if (isDanger) {
        bgColor = 'bg-red-50 dark:bg-red-900/20';
        borderColor = 'border-red-200 dark:border-red-800';
        textColor = 'text-red-700 dark:text-red-400';
        Icon = AlertCircle;
    } else if (isWarning) {
        bgColor = 'bg-yellow-50 dark:bg-yellow-900/20';
        borderColor = 'border-yellow-200 dark:border-yellow-800';
        textColor = 'text-yellow-700 dark:text-yellow-400';
        Icon = AlertCircle;
    } else if (isSuccess) {
        bgColor = 'bg-green-50 dark:bg-green-900/20';
        borderColor = 'border-green-200 dark:border-green-800';
        textColor = 'text-green-700 dark:text-green-400';
        Icon = CheckCircle2;
    }

    return (
        <div className={`mt-3 p-3 rounded-md border ${bgColor} ${borderColor} ${textColor} text-sm flex flex-col space-y-1.5 transition-colors`}>
             <div className="flex items-center space-x-2 font-semibold">
                  <Icon className="w-4 h-4" />
                  <span>Финансовый прогноз (B2B/B2C Economics)</span>
             </div>
             
             <div className="grid grid-cols-2 gap-2 text-xs mt-1 opacity-90">
                  <div>Себестоимость: <strong className="font-mono">{cost.toFixed(2)}₽</strong></div>
                  <div>Налоги и Шлюз ({(TOTAL_MANDATORY_DEDUCTIONS * 100).toFixed(1)}%): <strong className="font-mono">{deductionsBase.toFixed(2)}₽</strong></div>
             </div>

             <div className="flex justify-between items-center pt-1 border-t border-current border-opacity-10 mt-1">
                  <span>Чистая маржа: <strong className="font-mono text-base">{pureProfit.toFixed(2)}₽</strong></span>
                  <span className="font-bold">Наценка: {markupPercent.toFixed(0)}%</span>
             </div>

             {isDanger && (
                 <div className="text-red-600 dark:text-red-400 font-medium text-xs mt-1">
                     ⚠️ Внимание! Наценка составляет менее {SAFETY_FLOOR_MARKUP * 100}%. Guard заблокирует эту услугу при покупке клиентом. Повысьте цену.
                 </div>
             )}
        </div>
    );
}
