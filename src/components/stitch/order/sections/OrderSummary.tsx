'use client';
/**
 * OrderSummary — Right-column sticky summary with price, CTA, drip-feed accordion
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Rocket, ShoppingBag, AlertTriangle, ChevronDown,
    Timer, Calendar, Package
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { formatUnitPrice, formatCartTotal } from '@/utils/formatter';
import { translatePlatform } from '@/utils/translations';
import { BrandIcon } from '../../ui/BrandIcon';
import type { SmmService } from '../hooks/useOrderFlow';

interface OrderSummaryProps {
    selectedService: SmmService | null;
    platform: string | null;
    quantity: number;
    totalPrice: number;
    canSubmit: boolean;
    isSubmitting: boolean;
    validationError: string | null;
    isValidationBypassed: boolean;
    onBypassValidation: () => void;
    onOrder: () => void;
    onAddToCart: () => void;
    // Drip-Feed
    isDripFeed: boolean;
    onDripFeedChange: (v: boolean) => void;
    runs: number;
    onRunsChange: (v: number) => void;
    interval: number;
    onIntervalChange: (v: number) => void;
    // Scheduler
    isScheduled: boolean;
    onScheduledChange: (v: boolean) => void;
    scheduleTime: string;
    onScheduleTimeChange: (v: string) => void;
    activeBrandColor: string;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({
    selectedService,
    platform,
    quantity,
    totalPrice,
    canSubmit,
    isSubmitting,
    validationError,
    isValidationBypassed,
    onBypassValidation,
    onOrder,
    onAddToCart,
    isDripFeed,
    onDripFeedChange,
    runs,
    onRunsChange,
    interval,
    onIntervalChange,
    isScheduled,
    onScheduledChange,
    scheduleTime,
    onScheduleTimeChange,
    activeBrandColor,
}) => {
    const [showDripFeed, setShowDripFeed] = React.useState(false);
    const [showScheduler, setShowScheduler] = React.useState(false);

    return (
        <div className="space-y-4">
            {/* Order Summary Card — hidden on mobile (duplicated in sticky bar) */}
            <div className="hidden lg:block bg-slate-950 rounded-3xl p-6 text-white shadow-2xl shadow-slate-900/30">
                {selectedService ? (
                    <>
                        {/* Platform badge */}
                        <div className="flex items-center gap-2 mb-4">
                            {platform && <BrandIcon name={platform.toLowerCase()} size={20} colorMode="original" />}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {platform ? translatePlatform(platform) : 'Услуга'}
                            </span>
                        </div>

                        {/* Service name */}
                        <h3 className="text-base font-black leading-snug mb-3">{selectedService.name}</h3>

                        {/* Description — compact, max 3 lines */}
                        {selectedService.description && (
                            <p className="mb-4 text-[11px] font-medium text-slate-500 leading-relaxed line-clamp-3">
                                {selectedService.description}
                            </p>
                        )}

                        {/* Summary rows */}
                        <div className="space-y-3 border-t border-white/10 pt-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-medium">Количество</span>
                                <span className="text-sm font-bold">{quantity.toLocaleString()} шт</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-slate-400 font-medium">Цена за 1 шт</span>
                                <span className="text-sm font-medium text-slate-300">
                                    {formatUnitPrice(selectedService.pricePer1000)} ₽
                                </span>
                            </div>
                            {isDripFeed && (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-400 font-medium">Drip-feed</span>
                                    <span className="text-sm font-medium text-blue-400">{runs} × каждые {interval} мин</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between pt-2 border-t border-white/10">
                                <span className="text-sm font-bold text-white">Итого</span>
                                <span className="text-2xl font-black tracking-tight" style={{ color: activeBrandColor }}>
                                    {formatCartTotal(selectedService.pricePer1000, quantity)} ₽
                                </span>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-6">
                        <Package size={32} className="mx-auto mb-3 text-slate-600" />
                        <p className="text-sm font-medium text-slate-500">Выберите услугу</p>
                        <p className="text-xs text-slate-600 mt-1">Вставьте ссылку и выберите услугу из каталога</p>
                    </div>
                )}
            </div>

            {/* Validation Error */}
            <AnimatePresence>
                {validationError && !isValidationBypassed && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2"
                    >
                        <div className="flex items-start gap-2">
                            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                            <p className="text-xs font-medium text-amber-800 leading-relaxed">{validationError}</p>
                        </div>
                        <button
                            onClick={onBypassValidation}
                            className="text-[10px] font-bold text-amber-700 underline underline-offset-2 hover:text-amber-900"
                        >
                            Продолжить всё равно
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CTA Button — hidden on mobile (exists in sticky bar) */}
            <button
                onClick={onOrder}
                disabled={!canSubmit || isSubmitting}
                className={cn(
                    "hidden lg:flex w-full py-4 rounded-2xl text-sm font-black uppercase tracking-wider transition-all items-center justify-center gap-2.5",
                    canSubmit
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/35 active:scale-[0.98]"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                )}
            >
                {isSubmitting ? (
                    <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Обработка...
                    </>
                ) : (
                    <>
                        <Rocket size={18} />
                        {selectedService ? `Запустить — ${formatCartTotal(selectedService.pricePer1000, quantity)} ₽` : 'Запустить продвижение'}
                    </>
                )}
            </button>

            {/* Add to Cart */}
            {selectedService && (
                <button
                    onClick={onAddToCart}
                    className="hidden lg:flex w-full py-3 rounded-2xl text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all items-center justify-center gap-2"
                >
                    <ShoppingBag size={14} />
                    В корзину
                </button>
            )}

            {/* Advanced Settings Accordions */}
            <div className="space-y-2">
                {/* Drip-Feed */}
                {!selectedService?.isDripFeedDisabled && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setShowDripFeed(!showDripFeed)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Timer size={14} className="text-blue-500" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Drip-feed</span>
                            {isDripFeed && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                        </div>
                        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showDripFeed && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                        {showDripFeed && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 overflow-hidden"
                            >
                                <div className="p-4 space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isDripFeed}
                                            onChange={e => onDripFeedChange(e.target.checked)}
                                            className="w-4 h-4 rounded accent-blue-600"
                                        />
                                        <span className="text-xs font-medium text-slate-700">Включить постепенную подачу</span>
                                    </label>
                                    {isDripFeed && (
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Порций</span>
                                                <input
                                                    type="number"
                                                    value={runs}
                                                    onChange={e => onRunsChange(parseInt(e.target.value) || 2)}
                                                    min={2}
                                                    max={20}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-300"
                                                />
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Интервал (мин)</span>
                                                <input
                                                    type="number"
                                                    value={interval}
                                                    onChange={e => onIntervalChange(parseInt(e.target.value) || 30)}
                                                    min={5}
                                                    max={1440}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-300"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    </div>
                )}

                {/* Scheduler */}
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setShowScheduler(!showScheduler)}
                        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-violet-500" />
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Планировщик</span>
                            {isScheduled && <span className="w-2 h-2 bg-violet-500 rounded-full" />}
                        </div>
                        <ChevronDown size={14} className={cn("text-slate-400 transition-transform", showScheduler && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                        {showScheduler && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-slate-100 overflow-hidden"
                            >
                                <div className="p-4 space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isScheduled}
                                            onChange={e => onScheduledChange(e.target.checked)}
                                            className="w-4 h-4 rounded accent-violet-600"
                                        />
                                        <span className="text-xs font-medium text-slate-700">Запланировать запуск</span>
                                    </label>
                                    {isScheduled && (
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Дата и время</span>
                                            <input
                                                type="datetime-local"
                                                value={scheduleTime}
                                                onChange={e => onScheduleTimeChange(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-violet-300"
                                            />
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
