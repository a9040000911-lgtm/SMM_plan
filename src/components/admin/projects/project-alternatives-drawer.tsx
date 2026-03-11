'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Repeat2, X, Loader2, Database, Info, Check, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mapProjectServiceToProviderAction } from '@/app/admin/projects/[id]/actions';
import { motion, AnimatePresence } from 'framer-motion';

interface ProjectAlternativesDrawerProps {
    projectId: string;
    internalServiceId: string;
    initialSearchKeywords: string;
    currentProviderServiceId?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ProjectAlternativesDrawer({
    projectId,
    internalServiceId,
    initialSearchKeywords,
    currentProviderServiceId,
    isOpen,
    onClose
}: ProjectAlternativesDrawerProps) {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState(initialSearchKeywords);
    const [isMapping, setIsMapping] = useState<string | null>(null);

    // Price Display
    const [priceCurrency, setPriceCurrency] = useState<'usd' | 'rub'>('rub');
    const USD_RATE = 95;
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

    const formatPrice = (rawPriceUsd: number) => {
        let price = Number(rawPriceUsd);
        if (priceCurrency === 'rub') price = price * USD_RATE;
        return price < 0.01 ? price.toFixed(6) : price.toFixed(2);
    };

    const priceSymbol = priceCurrency === 'usd' ? '$' : '₽';

    const fetchAlternatives = useCallback(async () => {
        if (!isOpen) return;
        setIsLoading(true);
        try {
            const url = new URL('/api/admin/services/import', window.location.origin);
            url.searchParams.set('limit', '50');
            if (search) url.searchParams.set('search', search);

            const res = await fetch(url.toString());
            const data = await res.json();
            setServices(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [search, isOpen]);

    useEffect(() => {
        if (isOpen) {
            setSearch(initialSearchKeywords);
        }
    }, [isOpen, initialSearchKeywords]);

    useEffect(() => {
        const timer = setTimeout(() => fetchAlternatives(), 400);
        return () => clearTimeout(timer);
    }, [fetchAlternatives]);

    const handleMap = async (providerId: string, providerServiceId: number) => {
        if (!confirm('Заменить текущего провайдера на выбранного для этой услуги в проекте?')) return;

        setIsMapping(`${providerId}_${providerServiceId}`);
        try {
            const res = await mapProjectServiceToProviderAction(
                projectId,
                internalServiceId,
                providerId,
                providerServiceId
            );
            if (res.success) {
                toast.success('Провайдер успешно изменен!');
                onClose();
            } else {
                toast.error('Не удалось изменить провайдера');
            }
        } catch {
            toast.error('Произошла ошибка при маппинге');
        } finally {
            setIsMapping(null);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[600px] bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200"
                    >
                        {/* Header */}
                        <div className="p-6 bg-white border-b border-slate-100 flex items-center justify-between z-10">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase italic tracking-tight flex items-center gap-2">
                                    <Repeat2 className="text-blue-500" />
                                    Альтернативы
                                </h3>
                                <p className="text-xs text-slate-500 font-medium mt-1">
                                    Подбор другого провайдера для услуги
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Search & Info */}
                        <div className="p-6 bg-white border-b border-slate-100 space-y-4">
                            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl text-xs border border-blue-100">
                                <strong>Умный подбор:</strong> мы автоматически вставили ключевые слова из названия услуги. Вы можете изменить их для более точного поиска.
                            </div>

                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Поиск аналогов (слово1, слово2...)"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-0.5 w-fit">
                                <button
                                    onClick={() => setPriceCurrency('usd')}
                                    className={cn('px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all', priceCurrency === 'usd' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                                >$ USD</button>
                                <button
                                    onClick={() => setPriceCurrency('rub')}
                                    className={cn('px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all', priceCurrency === 'rub' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                                >₽ RUB</button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-48 gap-4">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Поиск аналогов...</span>
                                </div>
                            ) : services.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-48 text-slate-300">
                                    <Database size={40} className="mb-3" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Аналоги не найдены</span>
                                    <span className="text-[9px] text-slate-300 mt-1">Попробуйте сократить запрос</span>
                                </div>
                            ) : (
                                services.map(s => {
                                    const isCurrent = currentProviderServiceId === Number(s.id);
                                    const rowId = `${s.providerName}_${s.id}`;
                                    const isTargetMapping = isMapping === rowId;

                                    return (
                                        <div
                                            key={rowId}
                                            className={cn(
                                                "p-4 border rounded-2xl transition-all relative overflow-hidden",
                                                isCurrent ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white hover:border-slate-300 shadow-sm"
                                            )}
                                        >
                                            {isCurrent && (
                                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-bl-lg">
                                                    Текущий провайдер
                                                </div>
                                            )}

                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-[11px] font-black text-slate-800 leading-tight mb-1">{s.name}</div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1.5 py-0.5 rounded">{s.providerName}</span>
                                                        <span className="text-[9px] font-medium text-slate-400">ID: {s.id}</span>
                                                        {s.rawData?.description && (
                                                            <button
                                                                onClick={() => setExpandedDescId(expandedDescId === rowId ? null : rowId)}
                                                                className="text-[8px] font-bold text-blue-500 hover:text-blue-600 flex items-center gap-0.5 transition-colors"
                                                            >
                                                                <Info size={10} />
                                                                {expandedDescId === rowId ? 'Скрыть' : 'Описание'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-[13px] font-black text-slate-800">
                                                            {priceSymbol}{formatPrice(s.rawPrice)}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">за 1000 шт.</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {expandedDescId === rowId && s.rawData?.description && (
                                                <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-600 leading-relaxed overflow-x-auto">
                                                    {s.rawData.description}
                                                </div>
                                            )}

                                            <div className="mt-4 pt-3 border-t border-slate-100">
                                                <button
                                                    onClick={() => handleMap(s.providerId, s.id)}
                                                    disabled={isCurrent || !!isMapping}
                                                    className={cn(
                                                        "w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                                                        isCurrent
                                                            ? "bg-emerald-100 text-emerald-600 cursor-not-allowed"
                                                            : isTargetMapping
                                                                ? "bg-slate-100 text-slate-400 cursor-wait"
                                                                : "bg-slate-900 text-white hover:bg-slate-800 shadow-md active:scale-95"
                                                    )}
                                                >
                                                    {isTargetMapping ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : isCurrent ? (
                                                        <Check size={14} />
                                                    ) : (
                                                        <LinkIcon size={14} />
                                                    )}
                                                    {isCurrent ? 'Уже подключен' : 'Заменить на этого'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
