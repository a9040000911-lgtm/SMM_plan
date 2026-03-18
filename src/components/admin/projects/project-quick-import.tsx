'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, PackagePlus, Loader2, CheckCircle2, Database,
    Info, ChevronDown, ChevronUp, Repeat2, SearchCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/utils/ui';
import { SmartAnalyzerLogic, PLATFORM_LABELS } from '@/services/providers/smart-analyzer.logic';

interface ProjectQuickImportProps {
    projectId: string;
    providers: any[];
}

export function ProjectQuickImport({ projectId, providers }: ProjectQuickImportProps) {
    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [providerFilter, setProviderFilter] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [urlImport, setUrlImport] = useState('');
    const [sortOrder, setSortOrder] = useState('price_asc');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isImporting, setIsImporting] = useState(false);
    const [platforms, setPlatforms] = useState<any[]>([]);

    // Price Display
    const [priceUnit, setPriceUnit] = useState<'per1000' | 'per1'>('per1000');
    const [priceCurrency, setPriceCurrency] = useState<'usd' | 'rub'>('rub');
    const USD_RATE = 95;
    const MARKUP = 1.5;

    // Inline Description
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
            .then(data => { if (Array.isArray(data)) setPlatforms(data); })
            .catch(() => { });
    }, []);

    const fetchServices = useCallback(async () => {
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
    }, [search, providerFilter, platformFilter, categoryFilter, sortOrder]);

    useEffect(() => {
        const timer = setTimeout(() => fetchServices(), 400);
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
                    targetType: SmartAnalyzerLogic.suggestTargetType(s.name, category, s.rawData?.description || ''),
                    isPrivate: SmartAnalyzerLogic.suggestIsPrivate(s.name),
                    pricePer1000: Math.max(rawPrice * 1.5, rawPrice + 50),
                    minQty: s.rawData?.min || 10,
                    maxQty: s.rawData?.max || 100000,
                    description: s.rawData?.description || 'Импортировано из API.',
                    providerId: s.id,
                    providerName: s.providerName,
                    providerUUID: s.providerId,
                    rawData: s.rawData,
                    rawPrice: s.rawPrice,
                    priceUnit: 1000,
                    unitName: '1000 шт.',
                    projectId,
                };
            });

        try {
            const res = await fetch('/api/admin/services/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(servicesToImport)
            });
            if (res.ok) {
                const data = await res.json();
                toast.success(`Импортировано ${data.count || servicesToImport.length} услуг в проект`);
                setSelectedIds(new Set());
                fetchServices(); // Refresh list
            } else {
                toast.error('Ошибка импорта');
            }
        } catch {
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

    const isAllSelected = services.length > 0 && services.every(s => selectedIds.has(`${s.providerName}_${s.id}`));
    const handleSelectAll = () => {
        if (isAllSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(services.map(s => `${s.providerName}_${s.id}`)));
        }
    };

    useEffect(() => {
        if (!urlImport) return;

        try {
            const url = new URL(urlImport);
            const host = url.hostname.toLowerCase();
            const hash = url.hash; // e.g. #123
            const path = url.pathname; // e.g. /service/123

            // Extract ID
            const idMatch = (hash + path).match(/[#/](\d+)/);
            const extractedId = idMatch ? idMatch[1] : null;

            if (extractedId) {
                setSearch(extractedId);

                // Try to guess provider
                if (host.includes('vexboost')) {
                    const p = providers.find(p => p.name.toLowerCase().includes('vexboost'));
                    if (p) setProviderFilter(p.name);
                } else if (host.includes('streampromotion')) {
                    const p = providers.find(p => p.name.toLowerCase().includes('stream'));
                    if (p) setProviderFilter(p.name);
                } else {
                    // Generic match by domain
                    const domain = host.split('.').slice(-2, -1)[0];
                    if (domain) {
                        const p = providers.find(p => p.name.toLowerCase().includes(domain));
                        if (p) setProviderFilter(p.name);
                    }
                }

                toast.success(`Найдено по ссылке: ID ${extractedId}`);
                setUrlImport(''); // Clear after success
            }
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            // Not a valid URL, ignore
        }
    }, [urlImport, providers]);

    return (
        <div className="space-y-4">
            {/* Info Banner */}
            <div className="p-4 bg-indigo-50 text-indigo-800 rounded-2xl text-sm border border-indigo-100 flex items-start gap-3">
                <PackagePlus className="shrink-0 mt-0.5" size={18} />
                <div>
                    <strong>Добавление услуг:</strong> Выберите услуги от провайдеров для добавления в проект.
                    Используйте поиск по названию или ID. Наценка <span className="font-black text-emerald-600">1.5x</span> применяется автоматически.
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder="Поиск по названию или ID (слово1, слово2...)"
                    className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* URL Import */}
            <div className="relative">
                <Repeat2 className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400" size={16} />
                <input
                    type="text"
                    placeholder="Импорт по ссылке: вставьте ссылку на услугу с сайта провайдера..."
                    className="w-full pl-11 pr-4 py-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl text-[10px] font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-300 transition-all placeholder:text-emerald-300"
                    value={urlImport}
                    onChange={(e) => setUrlImport(e.target.value)}
                />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={providerFilter}
                    onChange={(e) => setProviderFilter(e.target.value)}
                >
                    <option value="">Все провайдеры</option>
                    {providers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>

                <select
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={platformFilter}
                    onChange={(e) => setPlatformFilter(e.target.value)}
                >
                    <option value="">Все сети</option>
                    {platforms.length > 0
                        ? platforms.map(p => <option key={p.id} value={p.slug.toUpperCase()}>{p.nameRu || p.name}</option>)
                        : Object.entries(PLATFORM_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)
                    }
                </select>

                <select
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                >
                    <option value="">Все категории</option>
                    {['SUBSCRIBERS', 'VIEWS', 'LIKES', 'COMMENTS', 'REACTIONS', 'REPOSTS', 'BOOSTS', 'POLLS', 'STORIES', 'FRIENDS', 'PLAYS', 'TRAFFIC', 'OTHER'].map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>

                <select
                    className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                >
                    <option value="price_asc">Сначала дешевые</option>
                    <option value="price_desc">Сначала дорогие</option>
                </select>
            </div>

            {/* Price Toggles */}
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

            {/* Service List */}
            <div className="space-y-2">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-4">
                        <Loader2 className="animate-spin text-indigo-500" size={32} />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Загрузка...</span>
                    </div>
                ) : services.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-300">
                        <Database size={40} className="mb-3" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Нет доступных услуг</span>
                        <span className="text-[9px] text-slate-300 mt-1">Попробуйте изменить фильтры</span>
                    </div>
                ) : (
                    <>
                        {/* Select All */}
                        <div
                            onClick={handleSelectAll}
                            className={cn(
                                "p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between bg-slate-50/50",
                                isAllSelected ? "border-slate-800 bg-slate-100" : "border-slate-100 hover:border-slate-200"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all",
                                    isAllSelected ? "bg-slate-900 border-slate-900" : "border-slate-200"
                                )}>
                                    {isAllSelected && <CheckCircle2 size={10} className="text-white" />}
                                </div>
                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">
                                    {isAllSelected ? 'Снять' : 'Выбрать все'}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400">Найдено: {services.length}</span>
                        </div>

                        {/* Services */}
                        {services.map(s => {
                            const rowId = `${s.providerName}_${s.id}`;
                            const isSelected = selectedIds.has(rowId);
                            return (
                                <div
                                    key={rowId}
                                    onClick={() => toggleSelect(rowId)}
                                    className={cn(
                                        "p-3 border rounded-xl cursor-pointer transition-all flex items-center justify-between group",
                                        isSelected ? "border-indigo-400 bg-indigo-50/30" : "border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className={cn(
                                            "w-4 h-4 rounded-md border-2 flex items-center justify-center transition-all flex-shrink-0",
                                            isSelected ? "bg-indigo-600 border-indigo-600 shadow-sm" : "border-slate-200"
                                        )}>
                                            {isSelected && <CheckCircle2 size={10} className="text-white" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-black text-slate-800 leading-tight truncate">{s.name}</div>
                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{s.platform}</span>
                                                <span className="text-[9px] font-medium text-slate-300">ID: {s.id}</span>
                                                {s.rawData?.description && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setExpandedDescId(expandedDescId === rowId ? null : rowId); }}
                                                        className="text-[8px] font-bold text-blue-400 hover:text-blue-600 flex items-center gap-0.5"
                                                    >
                                                        <Info size={10} />
                                                        {expandedDescId === rowId ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const cleaned = s.name
                                                            .replace(/\[.*?\]/g, '')
                                                            .replace(/(telegram|instagram|youtube|vk|tiktok|twitter|facebook|ok|twitch|spotify|soundcloud|threads|pinterest|linkedin|discord|max)/gi, '')
                                                            .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                                                            .replace(/\s+/g, ' ')
                                                            .trim();
                                                        const keywords = cleaned.split(' ').filter((w: string) => w.length > 2).slice(0, 3).join(' ');
                                                        setSearch(keywords || s.name.split(' ').slice(0, 2).join(' '));
                                                        setProviderFilter('');
                                                    }}
                                                    title="Найти похожие услуги у других провайдеров"
                                                    className="text-[8px] font-bold text-emerald-400 hover:text-emerald-600 flex items-center gap-0.5 ml-1"
                                                >
                                                    <SearchCheck size={10} /> Похожие
                                                </button>
                                            </div>
                                            {expandedDescId === rowId && s.rawData?.description && (
                                                <div className="mt-1.5 p-2 bg-blue-50/50 rounded-lg border border-blue-100 text-[10px] text-slate-600 leading-relaxed">
                                                    {s.rawData.description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                        <div className="text-right">
                                            <div className="text-[11px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                                                {priceSymbol}{formatPrice(s.rawPrice, 'purchase')}
                                            </div>
                                            <div className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 text-center">{priceLabel('purchase')}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                {priceSymbol}{formatPrice(s.rawPrice, 'sale')}
                                            </div>
                                            <div className="text-[7px] font-bold text-slate-400 uppercase mt-0.5 text-center">{priceLabel('sale')}</div>
                                        </div>
                                        <div className="text-[8px] font-bold text-slate-300 uppercase">{s.providerName}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {/* Import Button */}
            <div className="sticky bottom-0 pt-4 pb-2 bg-gradient-to-t from-white via-white">
                <button
                    onClick={handleBulkImport}
                    disabled={selectedIds.size === 0 || isImporting}
                    className={cn(
                        "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3",
                        selectedIds.size > 0
                            ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                    )}
                >
                    {isImporting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <PackagePlus size={18} />
                    )}
                    Импортировать в проект ({selectedIds.size})
                </button>
                <div className="text-[8px] font-bold text-slate-400 text-center mt-2 uppercase tracking-wider">
                    ⓘ Наценка 1.5x будет применена автоматически
                </div>
            </div>
        </div>
    );
}


