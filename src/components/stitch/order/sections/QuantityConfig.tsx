'use client';
/**
 * QuantityConfig — Quantity selector with min/max/step validation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, AlertTriangle, Hash } from 'lucide-react';
import { toast } from 'sonner';
import type { SmmService } from '../hooks/useOrderFlow';

interface QuantityConfigProps {
    quantity: number;
    onQuantityChange: (qty: number) => void;
    service: SmmService;
    isQtyMultiple: boolean;
    totalPrice: number;
}

export const QuantityConfig: React.FC<QuantityConfigProps> = ({
    quantity,
    onQuantityChange,
    service,
    isQtyMultiple,
    totalPrice,
}) => {
    const step = service.qtyStep || 10;
    const min = service.minQty || 1;
    const max = service.maxQty || 1000000;

    const handleDecrease = () => {
        const newQty = Math.max(min, quantity - step);
        onQuantityChange(newQty);
    };

    const handleIncrease = () => {
        const newQty = Math.min(max, quantity + step);
        onQuantityChange(newQty);
    };

    const handleInputChange = (value: string) => {
        const num = parseInt(value) || 0;
        onQuantityChange(num);
    };

    const handleBlur = () => {
        // Auto-correct to nearest valid step
        if (quantity < min) {
            onQuantityChange(min);
            toast.info(`Минимальный заказ: ${min}`);
            return;
        }
        if (quantity > max) {
            onQuantityChange(max);
            toast.info(`Максимальный заказ: ${max}`);
            return;
        }
        if (step > 1 && quantity % step !== 0) {
            const corrected = Math.round(quantity / step) * step;
            const final = Math.max(min, Math.min(max, corrected));
            onQuantityChange(final);
            toast.info(`Округлено до ${final} (шаг ${step})`);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
        >
            {/* Section Label */}
            <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                    <Hash size={13} className="text-orange-600" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-900">Количество</span>
            </div>

            {/* Quantity + Total — tight group */}
            <div className="flex items-center gap-4">
                <div className="w-[160px] flex items-stretch bg-slate-100 border border-slate-200 rounded-2xl h-12 overflow-hidden shadow-sm shrink-0">
                    <button
                        onClick={handleDecrease}
                        className="w-10 flex items-center justify-center bg-white border-r border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleInputChange(e.target.value)}
                            onBlur={handleBlur}
                            className="bg-transparent border-none outline-none text-slate-900 text-center font-black text-lg w-full leading-none"
                        />
                        <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">шт.</span>
                    </div>
                    <button
                        onClick={handleIncrease}
                        className="w-10 flex items-center justify-center bg-white border-l border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>

                {/* Total — directly adjacent */}
                <div className="flex flex-col shrink-0">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Итого</span>
                    <span className="text-2xl font-black text-blue-600 tracking-tight leading-none">
                        {totalPrice.toFixed(2)} <span className="text-base text-blue-500">₽</span>
                    </span>
                </div>
            </div>

            {/* Qty limits info */}
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                <span>Мин: {min.toLocaleString()}</span>
                {service.qtyStep && service.qtyStep > 1 && (
                    <span>Шаг: {service.qtyStep.toLocaleString()}</span>
                )}
                {service.maxQty && <span>Макс: {service.maxQty.toLocaleString()}</span>}
            </div>

            {/* Step validation warning */}
            {!isQtyMultiple && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 text-xs font-semibold text-amber-700"
                >
                    <AlertTriangle size={14} />
                    Количество должно быть кратно {step}
                </motion.div>
            )}
        </motion.div>
    );
};
