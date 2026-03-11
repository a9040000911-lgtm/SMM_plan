'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, X, Globe, Bot, Search, Filter, ArrowUpDown, Info, Layers, LayoutGrid, PowerOff, Power, DollarSign, Percent } from 'lucide-react';
import { toast } from 'sonner';
import { bulkToggleServiceForAllProjects, bulkSetServicePriceForAllProjects } from './actions';
import { ServiceEditorModal } from '@/components/admin/services/service-editor-modal';
import { getActivityLabel } from '@/utils/order-utils';

interface ProjectDistributionProps {
    services: any[];
    projects: any[];
    initialOverrides: any[];
    activeProjectId?: string | null;
}

export function ProjectDistribution({ services, projects, initialOverrides, activeProjectId }: ProjectDistributionProps) {
    const [overrides, setOverrides] = useState(initialOverrides);
    const [editingService, setEditingService] = useState<any>(null);
    // ...

    // Filter projects if activeProjectId is set
    // eslint-disable-next-line unused-imports/no-unused-vars
    const displayedProjects = useMemo(() => {
        return (activeProjectId && activeProjectId !== 'all')
            ? projects.filter(p => p.id === activeProjectId)
            : projects;
    }, [projects, activeProjectId]);

    // ... (rest of the component uses displayedProjects instead of projects)
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [editingPrice, setEditingPrice] = useState<{ serviceId: string; projectId: string; value: string } | null>(null);
    const [isBulkToggling, setIsBulkToggling] = useState<string | null>(null);
    const priceInputRef = useRef<HTMLInputElement>(null);

    const searchParams = useSearchParams();

    // Filters & Sorting State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState<string>(searchParams.get('platform') || 'ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'NAME' | 'PRICE' | 'ID'>('NAME');
    const [groupBy, setGroupBy] = useState<'NONE' | 'PLATFORM' | 'CATEGORY'>('NONE');

    // Sync platform with URL when it changes
    useEffect(() => {
        const platform = searchParams.get('platform');
        if (platform) {
            setFilterPlatform(platform);
        }
    }, [searchParams]);

    const getOverride = (serviceId: string, projectId: string) => {
        return overrides.find(o => o.internalServiceId === serviceId && o.projectId === projectId);
    };

    const isEnabled = (serviceId: string, projectId: string) => {
        const service = services.find(s => s.id === serviceId);
        const override = getOverride(serviceId, projectId);
        // If override exists, use it. Otherwise use the global service status.
        return override ? override.isActive : (service?.isActive ?? false);
    };

    const updatePrice = async (serviceId: string, projectId: string, newPrice: number) => {
        const loadingKey = `${serviceId}-${projectId}-price`;
        setIsUpdating(loadingKey);

        try {
            // If price is 0, we can potentially treat it as reset (null) if API supports it, 
            // or just set 0. Here we assume 0 means reset to auto if logic allows, 
            // but for safety we send the number. To reset, we might need a specific flag or null.
            // For now, let's treat 0 as "Auto"/Null only if user intends reset.
            // Actually, let's send null if price is 0 to clear override if backend supports it.
            // Checking backend route: it accepts customPrice. If we want to unset, we might need to send null.
            // Let's explicitly handle 0 as null (Reset).

            const payloadPrice = newPrice === 0 ? null : newPrice;

            const res = await fetch(`/api/admin/projects/services/override`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    projectId,
                    isActive: isEnabled(serviceId, projectId), // Keep current active state
                    customPrice: payloadPrice
                })
            });

            if (res.ok) {
                const updatedOverride = await res.json();
                setOverrides(prev => {
                    const filtered = prev.filter(o => !(o.internalServiceId === serviceId && o.projectId === projectId));
                    return [...filtered, updatedOverride];
                });
                toast.success('Цена обновлена');
            } else {
                toast.error('Ошибка обновления цены');
            }
        } catch (_e) {
            toast.error('Ошибка сети');
        } finally {
            setIsUpdating(null);
        }
    };

    const toggleService = async (serviceId: string, projectId: string) => {
        const currentState = isEnabled(serviceId, projectId);
        const newState = !currentState;
        const loadingKey = `${serviceId}-${projectId}`;

        setIsUpdating(loadingKey);

        try {
            const res = await fetch(`/api/admin/projects/services/override`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, projectId, isActive: newState })
            });

            if (res.ok) {
                const updatedOverride = await res.json();
                setOverrides(prev => {
                    const filtered = prev.filter(o => !(o.internalServiceId === serviceId && o.projectId === projectId));
                    return [...filtered, updatedOverride];
                });
                toast.success(`Статус услуги обновлен`);
            } else {
                toast.error('Ошибка при обновлении статуса');
            }
        } catch (_e) {
            toast.error('Ошибка сети');
        } finally {
            setIsUpdating(null);
        }
    };

    // --- Bulk toggle for all projects ---
    const bulkToggle = async (serviceId: string, enable: boolean) => {
        setIsBulkToggling(serviceId);
        try {
            const res = await bulkToggleServiceForAllProjects(serviceId, enable);
            if (res.success) {
                // Update local state
                setOverrides(prev => {
                    const filtered = prev.filter(o => o.internalServiceId !== serviceId);
                    const newOverrides = projects.map(p => ({
                        internalServiceId: serviceId,
                        projectId: p.id,
                        isActive: enable,
                        customPrice: prev.find(o => o.internalServiceId === serviceId && o.projectId === p.id)?.customPrice ?? null
                    }));
                    return [...filtered, ...newOverrides];
                });
                toast.success(`Услуга ${enable ? 'включена' : 'отключена'} во всех ${res.count} проектах`);
            } else {
                toast.error('Ошибка: ' + res.error);
            }
        } catch {
            toast.error('Ошибка сети');
        } finally {
            setIsBulkToggling(null);
        }
    };

    const bulkSetPrice = async (serviceId: string, price: number | null) => {
        setIsBulkToggling(`${serviceId}-price`);
        try {
            const res = await bulkSetServicePriceForAllProjects(serviceId, price);
            if (res.success) {
                setOverrides(prev => {
                    const filtered = prev.filter(o => o.internalServiceId !== serviceId);
                    const newOverrides = projects.map(p => ({
                        internalServiceId: serviceId,
                        projectId: p.id,
                        isActive: prev.find(o => o.internalServiceId === serviceId && o.projectId === p.id)?.isActive ?? true,
                        customPrice: price
                    }));
                    return [...filtered, ...newOverrides];
                });
                toast.success(`Цена ${price} ₽ установлена для всех ${res.count} проектов`);
            } else {
                toast.error('Ошибка: ' + res.error);
            }
        } catch {
            toast.error('Ошибка сети');
        } finally {
            setIsBulkToggling(null);
        }
    };

    // --- Derived Data ---

    const uniquePlatforms = useMemo(() => Array.from(new Set(services.map(s => s.platform))).sort(), [services]);
    const uniqueCategories = useMemo(() => Array.from(new Set(services.map(s => s.category))).sort(), [services]);

    const filteredServices = useMemo(() => {
        let result = [...services];

        // 1. Filter
        if (searchTerm) {
            const lowerQuery = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(lowerQuery) ||
                s.id.toLowerCase().includes(lowerQuery) ||
                (s.providerMappings?.[0]?.provider?.name || '').toLowerCase().includes(lowerQuery)
            );
        }
        if (filterPlatform !== 'ALL') {
            result = result.filter(s => s.platform === filterPlatform);
        }
        if (filterCategory !== 'ALL') {
            result = result.filter(s => s.category === filterCategory);
        }

        // 2. Sort
        result.sort((a, b) => {
            if (sortBy === 'NAME') return a.name.localeCompare(b.name);
            if (sortBy === 'PRICE') return a.pricePer1000 - b.pricePer1000;
            if (sortBy === 'ID') return a.id.localeCompare(b.id);
            return 0;
        });

        return result;
    }, [services, searchTerm, filterPlatform, filterCategory, sortBy]);

    const [viewMode, setViewMode] = useState<'PRICE' | 'MARGIN'>('PRICE');

    // Grouping Logic
    const groupedServices = useMemo(() => {
        if (groupBy === 'NONE') return { 'All Services': filteredServices };

        return filteredServices.reduce((acc, service) => {
            const key = groupBy === 'PLATFORM' ? service.platform : service.category;
            if (!acc[key]) acc[key] = [];
            acc[key].push(service);
            return acc;
        }, {} as Record<string, typeof services>);
    }, [filteredServices, groupBy]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto overflow-x-auto pb-2 md:pb-0">
                    {/* Search */}
                    <div className="relative group w-full md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                        <input
                            type="text"
                            placeholder="Поиск услуги, ID или провайдера..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:font-medium"
                        />
                    </div>

                    {/* Filters */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative min-w-[140px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                            <select
                                value={filterPlatform}
                                onChange={(e) => setFilterPlatform(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <option value="ALL">Все платформы</option>
                                {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="relative min-w-[140px]">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                            >
                                <option value="ALL">Все категории</option>
                                {uniqueCategories.map(c => <option key={c} value={c}>{getActivityLabel(c)}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    {/* View Mode Switcher */}
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setViewMode('PRICE')}
                            className={`px-3 py-2 rounded-md transition-all text-[10px] font-black uppercase tracking-tight flex items-center gap-2 ${viewMode === 'PRICE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <DollarSign size={14} /> Цена
                        </button>
                        <button
                            onClick={() => setViewMode('MARGIN')}
                            className={`px-3 py-2 rounded-md transition-all text-[10px] font-black uppercase tracking-tight flex items-center gap-2 ${viewMode === 'MARGIN' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <Percent size={14} /> Маржа
                        </button>
                    </div>

                    {/* Sort */}
                    <div className="relative min-w-[150px]">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black uppercase outline-none focus:border-blue-500 appearance-none cursor-pointer hover:bg-slate-100 transition-colors"
                        >
                            <option value="NAME">По названию</option>
                            <option value="PRICE">По цене</option>
                            <option value="ID">По ID</option>
                        </select>
                    </div>

                    {/* Grouping */}
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setGroupBy('NONE')}
                            className={`p-2 rounded-md transition-all ${groupBy === 'NONE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                            title="Без группировки"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setGroupBy('PLATFORM')}
                            className={`p-2 rounded-md transition-all ${groupBy === 'PLATFORM' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="По платформе"
                        >
                            <Globe size={16} />
                        </button>
                        <button
                            onClick={() => setGroupBy('CATEGORY')}
                            className={`p-2 rounded-md transition-all ${groupBy === 'CATEGORY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                            title="По категории"
                        >
                            <Layers size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 w-[40%]">Услуга / Провайдер</th>
                                {projects.map(p => (
                                    <th key={p.id} className="px-6 py-5 min-w-[140px] text-center max-w-[200px]">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="p-2 rounded-md bg-white shadow-sm border border-slate-100 flex items-center justify-center w-10 h-10" style={{ color: p.brandColor }}>
                                                {p.botToken ? <Bot size={18} /> : <Globe size={18} />}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 truncate w-full px-1">{p.name}</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {(Object.entries(groupedServices) as [string, any[]][]).map(([groupName, groupItems]) => (
                                <React.Fragment key={groupName}>
                                    {groupBy !== 'NONE' && (
                                        <tr className="bg-slate-50/80">
                                            <td colSpan={projects.length + 1} className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">{getActivityLabel(groupName)}</span>
                                                    <div className="h-px flex-1 bg-slate-200"></div>
                                                    <span className="px-2 py-0.5 bg-slate-200 rounded text-[9px] font-bold text-slate-500">{groupItems.length}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {groupItems.map((s: any) => {
                                        const providerMapping = s.providerMappings?.[0]; // Primary provider
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => setEditingService(s)}
                                                                className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors text-left"
                                                            >
                                                                {s.name}
                                                            </button>
                                                            {s.description && (
                                                                <div className="relative group/info">
                                                                    <Info size={14} className="text-slate-300 hover:text-blue-500 cursor-help transition-colors" />
                                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-64 p-3 bg-slate-800 text-white text-xs rounded-md opacity-0 invisible group-hover/info:opacity-100 group-hover/info:visible transition-all z-10 shadow-xl pointer-events-none">
                                                                        {s.description}
                                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-slate-800"></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-3 mt-1">
                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded">
                                                                {s.platform}
                                                                <span className="w-0.5 h-2 bg-slate-300 rounded-full"></span>
                                                                {getActivityLabel(s.category)}
                                                            </span>

                                                            {/* Provider Info */}
                                                            {providerMapping && (
                                                                <div className="text-[10px] font-bold text-slate-400/50 uppercase tracking-widest mt-1">
                                                                    {providerMapping.provider?.name || 'Unknown Provider'}
                                                                </div>
                                                            )}

                                                            {/* Bulk toggle for all projects */}
                                                            <button
                                                                onClick={() => {
                                                                    const anyEnabled = projects.some(p => isEnabled(s.id, p.id));
                                                                    bulkToggle(s.id, !anyEnabled);
                                                                }}
                                                                disabled={isBulkToggling === s.id}
                                                                className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-all opacity-0 group-hover:opacity-100 border flex items-center gap-1 ${projects.some(p => isEnabled(s.id, p.id))
                                                                    ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100'
                                                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                                                    }`}
                                                                title={projects.some(p => isEnabled(s.id, p.id)) ? 'Отключить во всех проектах' : 'Включить во всех проектах'}
                                                            >
                                                                {isBulkToggling === s.id ? (
                                                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                ) : projects.some(p => isEnabled(s.id, p.id)) ? (
                                                                    <><PowerOff size={9} /> Откл. везде</>
                                                                ) : (
                                                                    <><Power size={9} /> Вкл. везде</>
                                                                )}
                                                            </button>

                                                            {/* Bulk Set Price for all projects */}
                                                            <button
                                                                onClick={() => {
                                                                    const service = services.find(sv => sv.id === s.id);
                                                                    const price = service?.pricePer1000 || 0;
                                                                    bulkSetPrice(s.id, price);
                                                                }}
                                                                disabled={isBulkToggling === `${s.id}-price`}
                                                                className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md transition-all opacity-0 group-hover:opacity-100 border flex items-center gap-1 bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100`}
                                                                title="Применить базовую цену ко всем проектам"
                                                            >
                                                                {isBulkToggling === `${s.id}-price` ? (
                                                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <><Globe size={9} /> Цену везде</>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </td>
                                                {projects.map(p => {
                                                    const active = isEnabled(s.id, p.id);
                                                    const loading = isUpdating === `${s.id}-${p.id}`;
                                                    const isEditingThis = editingPrice?.serviceId === s.id && editingPrice?.projectId === p.id;

                                                    const cost = Number(s.lastProviderPrice) || 0;
                                                    const currentPrice = Number(getOverride(s.id, p.id)?.customPrice || s.pricePer1000);
                                                    const currentMargin = cost > 0 ? ((currentPrice - cost) / cost) * 100 : 0;

                                                    const displayValue = viewMode === 'PRICE'
                                                        ? `${currentPrice} ₽`
                                                        : `${Math.round(currentMargin)}%`;

                                                    const editValue = viewMode === 'PRICE'
                                                        ? currentPrice
                                                        : Math.round(currentMargin);

                                                    return (
                                                        <td key={p.id} className="px-6 py-4 text-center">
                                                            <div className="flex justify-center flex-col items-center gap-1.5">
                                                                <button
                                                                    onClick={() => toggleService(s.id, p.id)}
                                                                    disabled={!!isUpdating}
                                                                    className={`
                                                                        w-10 h-6 rounded-full transition-all flex items-center px-0.5
                                                                        ${active ? 'bg-emerald-500 shadow-emerald-200' : 'bg-slate-200 hover:bg-slate-300'}
                                                                        ${loading ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                                                                    `}
                                                                    title={active ? `Активно в ${p.name}` : `Скрыто в ${p.name}`}
                                                                >
                                                                    <div className={`
                                                                        w-5 h-5 bg-white rounded-full shadow-sm transition-transform flex items-center justify-center
                                                                        ${active ? 'translate-x-4' : 'translate-x-0'}
                                                                    `}>
                                                                        {loading ? (
                                                                            <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                                                                        ) : active ? (
                                                                            <Check size={10} className="text-emerald-500" />
                                                                        ) : (
                                                                            <X size={10} className="text-slate-300" />
                                                                        )}
                                                                    </div>
                                                                </button>

                                                                {/* Inline Price/Margin Edit */}
                                                                {isEditingThis ? (
                                                                    <input
                                                                        ref={priceInputRef}
                                                                        type="number"
                                                                        step={viewMode === 'PRICE' ? "0.01" : "1"}
                                                                        className="w-16 text-[10px] font-bold text-center border border-blue-300 rounded px-1 py-0.5 outline-none focus:ring-2 ring-blue-200"
                                                                        defaultValue={editValue}
                                                                        autoFocus
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') {
                                                                                const val = parseFloat((e.target as HTMLInputElement).value);
                                                                                if (!isNaN(val)) {
                                                                                    if (viewMode === 'PRICE') {
                                                                                        updatePrice(s.id, p.id, val);
                                                                                    } else {
                                                                                        // Calculate price from margin
                                                                                        if (cost <= 0) {
                                                                                            toast.error('Невозможно рассчитать маржу: себестоимость не указана (0 ₽)');
                                                                                        } else {
                                                                                            const price = cost * (1 + val / 100);
                                                                                            updatePrice(s.id, p.id, Math.round(price * 100) / 100);
                                                                                        }
                                                                                    }
                                                                                }
                                                                                setEditingPrice(null);
                                                                            } else if (e.key === 'Escape') {
                                                                                setEditingPrice(null);
                                                                            }
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            const val = parseFloat(e.target.value);
                                                                            if (!isNaN(val)) {
                                                                                if (viewMode === 'PRICE') {
                                                                                    updatePrice(s.id, p.id, val);
                                                                                } else {
                                                                                    if (cost <= 0) {
                                                                                        // Just cancel
                                                                                    } else {
                                                                                        const price = cost * (1 + val / 100);
                                                                                        updatePrice(s.id, p.id, Math.round(price * 100) / 100);
                                                                                    }
                                                                                }
                                                                            }
                                                                            setEditingPrice(null);
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div
                                                                        onClick={() => {
                                                                            setEditingPrice({ serviceId: s.id, projectId: p.id, value: String(editValue) });
                                                                        }}
                                                                        className={`text-[9px] font-bold cursor-pointer hover:bg-slate-100 px-1.5 py-0.5 rounded transition-colors ${getOverride(s.id, p.id)?.customPrice ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}
                                                                        title={viewMode === 'PRICE' ? "Нажмите для изменения цены" : "Нажмите для изменения маржи"}
                                                                    >
                                                                        {getOverride(s.id, p.id)?.customPrice
                                                                            ? displayValue
                                                                            : <span className="opacity-50">{displayValue}</span>
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })}
                                </React.Fragment>
                            ))}
                            {filteredServices.length === 0 && (
                                <tr>
                                    <td colSpan={projects.length + 1} className="px-6 py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search size={32} className="opacity-20" />
                                            <span className="text-sm font-bold">Ничего не найдено</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center text-[10px] uppercase font-black text-slate-300 tracking-widest">
                Всего услуг: {filteredServices.length}
            </div>
            {editingService && (
                <ServiceEditorModal
                    isOpen={!!editingService}
                    onClose={() => setEditingService(null)}
                    service={editingService}
                    providers={[]}
                    allProviderServices={[]}
                    categories={[]}
                    activeProjectId={activeProjectId}
                    onSuccess={() => { setEditingService(null); }}
                />
            )}
        </div>
    );
}
