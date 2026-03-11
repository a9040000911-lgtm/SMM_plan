"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    X,
    Search,
    PackagePlus,
    Loader2,
    CheckCircle2,
    Database,
    Sparkles,
    Info,
    ChevronDown,
    ChevronUp,
    Repeat2,
    SearchCheck,
    Lock,
    Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SmartAnalyzerLogic as SmartAnalyzerService, PLATFORM_LABELS } from '@/services/providers/smart-analyzer.logic';

interface QuickImportDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    providers: any[];
    onImportSuccess: () => void;
}

export function QuickImportDrawer({ isOpen, onClose, providers, onImportSuccess }: QuickImportDrawerProps) {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [providerFilter, setProviderFilter] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [sortOrder, setSortOrder] = useState('price_asc');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [comparedIds, setComparedIds] = useState<Set<string>>(new Set());
    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [platforms, setPlatforms] = useState<any[]>([]);

    // --- Price Display Toggles ---
    const [priceUnit, setPriceUnit] = useState<'per1000' | 'per1'>('per1000');
    const [priceCurrency, setPriceCurrency] = useState<'usd' | 'rub'>('rub');
    const USD_RATE = 95; // Default USD → RUB rate
    const MARKUP = 1.5;

    // --- Inline Description ---
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

    const formatPrice = (rawPriceUsd: number, mode: 'purchase' | 'sale' = 'purchase') => {
        let price = Number(rawPriceUsd);
        if (mode === 'sale') price = price * MARKUP;
        if (priceCurrency === 'rub') price = price * USD_RATE;
        if (priceUnit === 'per1') price = price / 1000;
        return price < 0.01 ? price.toFixed(6) : price.toFixed(2);
    };

    const priceLabel = (mode: 'purchase' | 'sale') => {
        const unitLabel = priceUnit === 'per1000' ? '/1000' : '/1 шт';
        const currLabel = priceCurrency === 'usd' ? '$' : '₽';
        const typeLabel = mode === 'purchase' ? 'Закупка' : 'Продажа';
        return `${typeLabel} ${currLabel}${unitLabel}`;
    };

    const priceSymbol = priceCurrency === 'usd' ? '$' : '₽';

    useEffect(() => {
        fetch('/api/admin/platforms')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setPlatforms(data);
            })
            .catch(err => console.error('Failed to load platforms', err));
    }, []);

    const fetchServices = useCallback(async () => {
        if (!isOpen) return;
        setIsLoading(true);
        try {
            const url = new URL('/api/admin/services/import', window.location.origin);
            url.searchParams.set('limit', '100');
            if (search) url.searchParams.set('search', search);
            if (providerFilter) url.searchParams.set('provider', providerFilter);
            if (platformFilter) url.searchParams.set('platform', platformFilter);
            if (categoryFilter) url.searchParams.set('category', categoryFilter);
            if (sortOrder) url.searchParams.set('sort', sortOrder);
            url.searchParams.set('hideImported', 'true');

            const res = await fetch(url.toString());
            const data = await res.json();
            setServices(data.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }, [isOpen, search, providerFilter, platformFilter, categoryFilter, sortOrder]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchServices();
        }, 400);
        return () => clearTimeout(timer);
    }, [fetchServices]);

    const handleBulkImport = async () => {
        if (selectedIds.size === 0) return;
        setIsImporting(true);

        const servicesToImport = services
            .filter(s => selectedIds.has(`${s.providerName}_${s.id}`))
            .map(s => {
                const platform = s.platform;
                const category = s.category;
                const rawPrice = Number(s.rawPrice);
                return {
                    id: `${platform}_${category}_${s.id}`.toLowerCase(),
                    name: s.name,
                    platform,
                    category,
                    targetType: s.analysis?.targetType || SmartAnalyzerService.suggestTargetType(s.name, category, s.rawData?.description || ''),
                    isPrivate: s.analysis?.isPrivate || SmartAnalyzerService.suggestIsPrivate(s.name),
                    requirements: s.analysis?.requirements,
                    pricePer1000: Math.max(rawPrice * 1.5, rawPrice + 50),
                    minQty: s.rawData?.min || 10,
                    maxQty: s.rawData?.max || 100000,
                    description: s.rawData?.description || 'Импортировано из API.',
                    providerId: s.id,
                    providerName: s.providerName,
                    providerUUID: s.providerId,
                    rawPrice: rawPrice,
                    rawData: s.rawData,
                    priceUnit: 1000,
                    unitName: '1000 шт.',
                };
            });

        try {
            const res = await fetch('/api/admin/services/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(servicesToImport)
            });
            if (res.ok) {
                toast.success(`Успешно импортировано: ${servicesToImport.length}`);
                setSelectedIds(new Set());
                onImportSuccess();
                onClose();
            }
        } catch (_e) {
            toast.error('Ошибка импорта');
        } finally {
            setIsImporting(false);
        }
    };

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleCompare = (id: string) => {
        const next = new Set(comparedIds);
        if (next.has(id)) next.delete(id);
        else {
            if (next.size >= 4) {
                toast.error('Максимум 4 услуги для сравнения');
                return;
            }
            next.add(id);
        }
        setComparedIds(next);
    };

    const isAllSelected = services.length > 0 && services.every(s => selectedIds.has(`${s.providerName}_${s.id}`));

    const handleSelectAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            const next = new Set(selectedIds);
            services.forEach(s => next.add(`${s.providerName}_${s.id}`));
            setSelectedIds(next);
        }
    };

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <React.Fragment key="drawer-root">
                    <motion.div
                        key="quick-import-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div
                        key="quick-import-drawer"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-2xl bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight italic">Умный импорт</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Добавление услуг из API провайдеров</p>
                            </div>
                            <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl text-slate-400 hover:text-slate-800 transition-all shadow-sm">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 border-b border-slate-100 bg-white space-y-4">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Поиск (слово1, слово2...)"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border-none rounded-[1.2rem] text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <select
                                    className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={providerFilter}
                                    onChange={(e) => setProviderFilter(e.target.value)}
                                >
                                    <option value="">Все провайдеры</option>
                                    {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                                <select
                                    className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={platformFilter}
                                    onChange={(e) => setPlatformFilter(e.target.value)}
                                >
                                    <option value="">Все сети</option>
                                    {platforms.length > 0 ? (
                                        platforms.map(p => (
                                            <option key={p.id} value={p.slug.toUpperCase()}>{p.nameRu || p.name}</option>
                                        ))
                                    ) : (
                                        Object.entries(PLATFORM_LABELS).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))
                                    )}
                                </select>
                                <select
                                    className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                >
                                    <option value="">Все категории</option>
                                    <option value="SUBSCRIBERS">Подписчики</option>
                                    <option value="LIKES">Лайки</option>
                                    <option value="VIEWS">Просмотры</option>
                                    <option value="REACTIONS">Реакции</option>
                                    <option value="COMMENTS">Комментарии</option>
                                    <option value="BOOSTS">Бусты</option>
                                    <option value="REPOSTS">Репосты</option>
                                    <option value="POLLS">Голоса / Опросы</option>
                                    <option value="STARS">Звезды (Stars)</option>
                                    <option value="WATCH_TIME">Часы просмотра</option>
                                    <option value="SAVES">Сохранения</option>
                                    <option value="PLAYS">Прослушивания</option>
                                </select>
                                <select
                                    className="px-3 py-2.5 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value)}
                                >
                                    <option value="price_asc">Сначала дешевые</option>
                                    <option value="price_desc">Сначала дорогие</option>
                                </select>
                            </div>

                            {/* Price Display Toggles */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
                                    <button
                                        onClick={() => setPriceUnit('per1000')}
                                        className={cn('px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all', priceUnit === 'per1000' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                                    >За 1000</button>
                                    <button
                                        onClick={() => setPriceUnit('per1')}
                                        className={cn('px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all', priceUnit === 'per1' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                                    >За 1 шт</button>
                                </div>
                                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-0.5">
                                    <button
                                        onClick={() => setPriceCurrency('usd')}
                                        className={cn('px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all', priceCurrency === 'usd' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                                    >$ USD</button>
                                    <button
                                        onClick={() => setPriceCurrency('rub')}
                                        className={cn('px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all', priceCurrency === 'rub' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600')}
                                    >₽ RUB</button>
                                </div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-auto">
                                    <Repeat2 size={10} className="inline mr-1" />
                                    Курс: 1$ = {USD_RATE}₽
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center h-64 gap-4">
                                    <Loader2 className="animate-spin text-blue-500" size={32} />
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Загружаем список...</span>
                                </div>
                            ) : services.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                                    <Database size={48} className="mb-4" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Нет доступных услуг</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {services.length > 0 && (
                                        <div
                                            onClick={handleSelectAll}
                                            className={cn(
                                                "p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group mb-2 bg-slate-50/50",
                                                isAllSelected ? "border-slate-800 bg-slate-100" : "border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                    isAllSelected ? "bg-slate-900 border-slate-900 shadow-lg" : "border-slate-200"
                                                )}>
                                                    {isAllSelected && <CheckCircle2 size={12} className="text-white" />}
                                                </div>
                                                <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                                    {isAllSelected ? 'Снять выделение' : 'Выбрать все на странице'}
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase">
                                                Найдено: {services.length}
                                            </div>
                                        </div>
                                    )}
                                    {services.map(s => {
                                        const rowId = `${s.providerName}_${s.id}`;
                                        const isSelected = selectedIds.has(rowId);
                                        return (
                                            <div
                                                key={rowId}
                                                onClick={() => toggleSelect(rowId)}
                                                className={cn(
                                                    "p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group",
                                                    isSelected ? "border-blue-500 bg-blue-50/30" : "border-slate-100 hover:border-slate-300"
                                                )}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={cn(
                                                        "w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all",
                                                        isSelected ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20" : "border-slate-200"
                                                    )}>
                                                        {isSelected && <CheckCircle2 size={12} className="text-white" />}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-[11px] font-black text-slate-800 leading-tight">{s.name}</div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{s.platform}</span>
                                                            <span className="text-[9px] font-medium text-slate-300">ID: {s.id}</span>
                                                            {s.analysis?.isPrivate && (
                                                                <span className="px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded-[5px] text-[7px] font-black uppercase tracking-tighter border border-orange-200/50 flex items-center gap-0.5">
                                                                    <Lock size={8} /> Приватный
                                                                </span>
                                                            )}
                                                            {s.analysis?.requirements && (
                                                                <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-[5px] text-[7px] font-black uppercase tracking-tighter border border-blue-200/50 flex items-center gap-0.5">
                                                                    <Bot size={8} /> Нужен Бот
                                                                </span>
                                                            )}
                                                            {s.rawData?.description && (
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setExpandedDescId(expandedDescId === rowId ? null : rowId); }}
                                                                    className="text-[8px] font-bold text-blue-400 hover:text-blue-600 flex items-center gap-0.5 transition-colors"
                                                                >
                                                                    <Info size={10} />
                                                                    {expandedDescId === rowId ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    // Extract meaningful keywords from service name
                                                                    const cleaned = s.name
                                                                        .replace(/\[.*?\]/g, '') // Remove [brackets]
                                                                        .replace(/(telegram|instagram|youtube|vk|tiktok|twitter|facebook|ok|twitch|spotify|soundcloud|threads|pinterest|linkedin|discord|clubhouse)/gi, '')
                                                                        .replace(/[^\p{L}\p{N}\s]/gu, ' ') // Keep only letters/numbers
                                                                        .replace(/\s+/g, ' ')
                                                                        .trim();
                                                                    const keywords = cleaned.split(' ').filter((w: string) => w.length > 2).slice(0, 3).join(' ');
                                                                    setSearch(keywords || s.name.split(' ').slice(0, 2).join(' '));
                                                                    // Also clear provider filter to search across all providers
                                                                    setProviderFilter('');
                                                                }}
                                                                title="Найти похожие услуги у других провайдеров"
                                                                className="text-[8px] font-bold text-emerald-400 hover:text-emerald-600 flex items-center gap-0.5 transition-colors ml-1"
                                                            >
                                                                <SearchCheck size={10} /> Похожие
                                                            </button>
                                                        </div>
                                                        {expandedDescId === rowId && s.rawData?.description && (
                                                            <div className="mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[10px] text-slate-600 leading-relaxed">
                                                                {s.rawData.description}
                                                                {s.analysis?.requirements && (
                                                                    <div className="mt-2 p-2 bg-blue-600 text-white rounded-lg font-bold">
                                                                        ⚠️ ВАЖНО: {s.analysis.requirements}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 flex-shrink-0">
                                                    <div className="text-right">
                                                        <div className="text-[12px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-xl border border-blue-100 shadow-sm">
                                                            {priceSymbol}{formatPrice(s.rawPrice, 'purchase')}
                                                        </div>
                                                        <div className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 text-center">{priceLabel('purchase')}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-xl border border-emerald-100">
                                                            {priceSymbol}{formatPrice(s.rawPrice, 'sale')}
                                                        </div>
                                                        <div className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 text-center">{priceLabel('sale')}</div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); toggleCompare(rowId); }}
                                                        className={cn(
                                                            "px-2 py-1 rounded-lg text-[8px] font-black uppercase transition-all",
                                                            comparedIds.has(rowId)
                                                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                                        )}
                                                    >
                                                        {comparedIds.has(rowId) ? 'В сравнении' : 'Сравнить'}
                                                    </button>
                                                    <div className="text-[10px] font-black text-slate-400 uppercase group-hover:text-blue-600 transition-colors">
                                                        {s.providerName}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t border-slate-100 bg-slate-50/50 relative">
                            <AnimatePresence>
                                {comparedIds.size > 0 && (
                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: 20, opacity: 0 }}
                                        className="absolute -top-16 left-8 right-8 bg-orange-500 text-white rounded-2xl p-3 flex items-center justify-between shadow-xl shadow-orange-500/30"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white/20 p-2 rounded-xl">
                                                <Sparkles size={16} />
                                            </div>
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-tight">Сравнение активно</div>
                                                <div className="text-[9px] font-medium opacity-80 uppercase italic">{comparedIds.size} услуги выбрано</div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setIsCompareModalOpen(true)}
                                            className="px-4 py-2 bg-white text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95"
                                        >
                                            Сравнить сейчас
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <button
                                onClick={handleBulkImport}
                                disabled={selectedIds.size === 0 || isImporting}
                                className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 hover:bg-blue-600 disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-xl active:scale-95"
                            >
                                {isImporting ? <Loader2 className="animate-spin" size={20} /> : <PackagePlus size={20} />}
                                Импортировать ({selectedIds.size})
                            </button>
                            <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-tighter">
                                <Info size={10} className="inline mr-1" />
                                Наценка 1.5x будет применена автоматически
                            </p>
                        </div>
                    </motion.div>
                </React.Fragment>
            )}
            {isCompareModalOpen && (
                <ComparisonModal
                    key="comparison-modal"
                    isOpen={isCompareModalOpen}
                    onClose={() => setIsCompareModalOpen(false)}
                    services={services.filter(s => comparedIds.has(`${s.providerName}_${s.id}`))}
                />
            )}
        </AnimatePresence>
    );
}

function ComparisonModal({ isOpen, onClose, services }: { isOpen: boolean, onClose: () => void, services: any[] }) {
    if (!isOpen) return null;

    const USD_RATE = 95;
    const MARKUP = 1.5;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase italic tracking-tighter">Сравнение услуг</h3>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 italic">Битва тарифов: выберите лучший вариант</p>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-800 transition-all shadow-sm">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-x-auto p-8 custom-scrollbar">
                    <div className={cn('min-w-[800px] grid gap-6', services.length <= 2 ? 'grid-cols-2' : services.length === 3 ? 'grid-cols-3' : 'grid-cols-4')}>
                        {services.map((s, idx) => (
                            <div key={idx} className="flex flex-col gap-6 p-6 border border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-white transition-all hover:shadow-xl hover:border-blue-100 group">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{s.platform}</div>
                                    <div className="text-sm font-black text-slate-800 leading-snug" title={s.name}>{s.name}</div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="bg-white p-3 rounded-2xl border border-blue-100 shadow-sm group-hover:border-blue-200 transition-all">
                                            <div className="text-[7px] font-bold text-blue-400 uppercase mb-1">Закупка $/1000</div>
                                            <div className="text-lg font-black text-blue-600">${Number(s.rawPrice).toFixed(2)}</div>
                                        </div>
                                        <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm group-hover:border-emerald-200 transition-all">
                                            <div className="text-[7px] font-bold text-emerald-400 uppercase mb-1">Продажа ₽/1000</div>
                                            <div className="text-lg font-black text-emerald-600">₽{(Number(s.rawPrice) * MARKUP * USD_RATE).toFixed(0)}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            { label: 'Провайдер', val: s.providerName },
                                            { label: 'ID в API', val: s.id },
                                            { label: 'Мин/Макс', val: `${s.rawData?.min || '?'} / ${s.rawData?.max || '?'}` }
                                        ].map((stat, i) => (
                                            <div key={i} className="flex justify-between items-center px-1">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{stat.label}</span>
                                                <span className="text-[9px] font-black text-slate-600 uppercase">{stat.val}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mb-2">Описание</div>
                                        <div className="text-[10px] text-slate-600 italic leading-relaxed max-h-[180px] overflow-y-auto custom-scrollbar pr-2">
                                            {s.rawData?.description || 'Нет описания'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all shadow-xl active:translate-y-0"
                    >
                        Вернуться к списку
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
