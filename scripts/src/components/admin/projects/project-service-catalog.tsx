'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useMemo } from 'react';
import {
    Search, Check, X, Layers,
    Trash2,
    CheckCircle2, ShoppingCart,
    Percent, Info, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import { updateProjectServiceOverrideAction, bulkUpdateProjectOverridesAction } from '@/app/admin/projects/[id]/actions';
import { bulkMoveServicesToCategoryAction } from '@/app/admin/services/bulk-actions';
import { useTransition } from 'react';
import Link from 'next/link';
import { ProjectAlternativesDrawer } from '@/components/admin/projects/project-alternatives-drawer';
import { usePriceDisplay } from '@/components/admin/services/price-display-context';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { CATEGORY_LABELS } from '@/services/providers/smart-analyzer.logic';

interface Service {
    id: string;
    name: string;
    description?: string;
    platform: string;
    category: string;
    pricePer1000: number;
    lastProviderPrice: number;
    providerMappings?: { provider: { name: string } }[];
    providerServiceId?: string;
}

interface Override {
    internalServiceId: string;
    projectId: string;
    customPrice: number | null;
    markup: number | null;
    isActive: boolean;
}

interface ProjectServiceCatalogProps {
    projectId: string;
    services: Service[];
    overrides: Override[];
    categories: { id: string, name: string, platform: string, categoryType: string }[];
}

export function ProjectServiceCatalog({ projectId, services, overrides, categories }: ProjectServiceCatalogProps) {
    const [localOverrides, setLocalOverrides] = useState<Override[]>(overrides);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPlatform, setFilterPlatform] = useState<string>('ALL');
    const [filterCategory, setFilterCategory] = useState<string>('ALL');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [sortBy, setSortBy] = useState<'NAME' | 'PRICE_ASC' | 'PRICE_DESC' | 'MARGIN'>('NAME');
    const [groupBy, setGroupBy] = useState<'PLATFORM_CATEGORY' | 'PLATFORM' | 'CATEGORY' | 'NONE'>('PLATFORM_CATEGORY');
    const [, startTransition] = useTransition();

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Alternatives Drawer State
    const [alternativesFor, setAlternativesFor] = useState<{ id: string, name: string, currentProviderServiceId?: number } | null>(null);

    // Description State
    const [expandedDescId, setExpandedDescId] = useState<string | null>(null);

    // Price Context
    const { currency, unit, setCurrency, setUnit, formatPrice } = usePriceDisplay();

    // Derived Data
    const uniquePlatforms = useMemo(() => Array.from(new Set(services.map(s => s.platform))).sort(), [services]);
    const uniqueCategories = useMemo(() => Array.from(new Set(services.map(s => s.category))).sort(), [services]);

    const getOverride = (serviceId: string) => localOverrides.find(o => o.internalServiceId === serviceId);

    const isEnabled = (serviceId: string) => {
        const override = getOverride(serviceId);
        return override ? override.isActive : false;
    };

    const handleToggle = async (serviceId: string) => {
        const currentState = isEnabled(serviceId);
        const newState = !currentState;
        const currentOverride = getOverride(serviceId);

        // Optimistic Update
        setLocalOverrides(prev => {
            const existing = prev.find(o => o.internalServiceId === serviceId);
            if (existing) {
                return prev.map(o => o.internalServiceId === serviceId ? { ...o, isActive: newState } : o);
            } else {
                return [...prev, { internalServiceId: serviceId, projectId, isActive: newState, customPrice: null, markup: null }];
            }
        });

        startTransition(async () => {
            try {
                const res = await updateProjectServiceOverrideAction(projectId, serviceId, newState, currentOverride?.customPrice || null, currentOverride?.markup || null);
                if (!res.success) toast.error('Ошибка сохранения');
            } catch (_e) {
                toast.error('Ошибка сети');
            }
        });
    };

    const handleMarkupUpdate = async (serviceId: string, markup: number | null) => {
        // Prevent NaN from being saved
        const safeMarkup = (markup === null || isNaN(markup)) ? null : markup;

        const currentOverride = getOverride(serviceId);
        const active = currentOverride ? currentOverride.isActive : false;

        setLocalOverrides(prev => {
            const existing = prev.find(o => o.internalServiceId === serviceId);
            if (existing) {
                return prev.map(o => o.internalServiceId === serviceId ? { ...o, markup, customPrice: null } : o);
            } else {
                return [...prev, { internalServiceId: serviceId, projectId, isActive: active, customPrice: null, markup }];
            }
        });

        startTransition(async () => {
            try {
                await updateProjectServiceOverrideAction(projectId, serviceId, active, null, safeMarkup);
                toast.success('Наценка обновлена');
            } catch (_e) {
                toast.error('Ошибка обновления');
            }
        });
    };

    // Bulk Actions
    const handleBulkToggle = async (active: boolean) => {
        const idsArray = Array.from(selectedIds);
        startTransition(async () => {
            const res = await bulkUpdateProjectOverridesAction(projectId, idsArray, { isActive: active });
            if (res.success) {
                setLocalOverrides(prev => {
                    const next = [...prev];
                    idsArray.forEach(id => {
                        const idx = next.findIndex(o => o.internalServiceId === id);
                        if (idx >= 0) next[idx] = { ...next[idx], isActive: active };
                        else next.push({ internalServiceId: id, projectId, isActive: active, customPrice: null, markup: null });
                    });
                    return next;
                });
                toast.success(active ? 'Услуги включены' : 'Услуги отключены');
                setSelectedIds(new Set());
            }
        });
    };

    const handleBulkMarkup = async () => {
        const val = prompt('Введите процент наценки (например, 50):');
        if (val === null) return;
        const markup = parseFloat(val);
        if (isNaN(markup)) return toast.error('Некорректное значение');

        const idsArray = Array.from(selectedIds);
        startTransition(async () => {
            const res = await bulkUpdateProjectOverridesAction(projectId, idsArray, { markup, customPrice: null });
            if (res.success) {
                setLocalOverrides(prev => {
                    const next = [...prev];
                    idsArray.forEach(id => {
                        const idx = next.findIndex(o => o.internalServiceId === id);
                        if (idx >= 0) next[idx] = { ...next[idx], markup, customPrice: null };
                        else next.push({ internalServiceId: id, projectId, isActive: true, customPrice: null, markup });
                    });
                    return next;
                });
                toast.success('Наценка применена');
                setSelectedIds(new Set());
            }
        });
    };

    const handleBulkRemove = async () => {
        if (!confirm(`Вы уверены, что хотите удалить ${selectedIds.size} услуг из проекта? Они перестанут отображаться на сайте.`)) return;
        handleBulkToggle(false);
    };

    const _handleBulkMove = async (targetCategoryId: string) => {
        const cat = categories.find(c => c.id === targetCategoryId);
        if (!cat) return;

        const idsArray = Array.from(selectedIds);
        startTransition(async () => {
            try {
                const res = await bulkMoveServicesToCategoryAction(idsArray, targetCategoryId, cat.platform, cat.categoryType);
                if (res.success) {
                    toast.success(`Перемещено ${res.count} услуг`);
                    setSelectedIds(new Set());
                    // Force refresh to show updated categories
                    window.location.reload();
                } else {
                    toast.error(res.error || 'Ошибка перемещения');
                }
            } catch (_e) {
                toast.error('Ошибка при перемещении');
            }
        });
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = (ids: string[]) => {
        if (selectedIds.size === ids.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(ids));
    };

    const filteredServices = useMemo(() => {
        let result = services.map(s => {
            const override = getOverride(s.id);
            const cost = s.lastProviderPrice || 0;
            const markup = override?.markup ?? 50; // default 50 if no override
            const finalPrice = override?.customPrice ?? (cost * (1 + markup / 100));
            return { ...s, cost, markup, finalPrice, active: override?.isActive ?? false };
        });

        if (searchTerm) {
            const q = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.name.toLowerCase().includes(q) ||
                s.id.toLowerCase().includes(q)
            );
        }
        if (filterPlatform !== 'ALL') result = result.filter(s => s.platform === filterPlatform);
        if (filterCategory !== 'ALL') result = result.filter(s => s.category === filterCategory);
        if (filterStatus === 'ACTIVE') result = result.filter(s => s.active);
        if (filterStatus === 'INACTIVE') result = result.filter(s => !s.active);

        if (sortBy === 'NAME') result.sort((a, b) => a.name.localeCompare(b.name));
        else if (sortBy === 'PRICE_ASC') result.sort((a, b) => a.finalPrice - b.finalPrice);
        else if (sortBy === 'PRICE_DESC') result.sort((a, b) => b.finalPrice - a.finalPrice);
        else if (sortBy === 'MARGIN') result.sort((a, b) => (b.markup || 0) - (a.markup || 0));

        return result;
    }, [services, searchTerm, filterPlatform, filterCategory, filterStatus, sortBy, localOverrides]);

    const groupedServices = useMemo(() => {
        if (groupBy === 'NONE') return { 'Все услуги': filteredServices };

        const groups: Record<string, typeof filteredServices> = {};
        filteredServices.forEach(s => {
            let key = '';
            if (groupBy === 'PLATFORM_CATEGORY') key = `${s.platform} | ${CATEGORY_LABELS[s.category] || s.category}`;
            else if (groupBy === 'PLATFORM') key = s.platform;
            else if (groupBy === 'CATEGORY') key = CATEGORY_LABELS[s.category] || s.category;

            if (!groups[key]) groups[key] = [];
            groups[key].push(s);
        });
        return groups;
    }, [filteredServices, groupBy]);

    return (
        <div className="space-y-6">
            {/* TOOLBAR */}
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm space-y-4 sticky top-0 z-30">
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-col md:flex-row gap-3 w-full lg:w-auto flex-1">
                        <div className="relative group flex-1 min-w-[300px] lg:min-w-[400px]">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Поиск по названию или ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                value={filterPlatform}
                                onChange={(e) => setFilterPlatform(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer appearance-none min-w-[140px]"
                            >
                                <option value="ALL">Все платформы</option>
                                {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer appearance-none min-w-[140px]"
                            >
                                <option value="ALL">Все категории</option>
                                {uniqueCategories.map(c => (
                                    <option key={c} value={c}>
                                        {CATEGORY_LABELS[c] || c}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                                className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer appearance-none min-w-[140px]"
                            >
                                <option value="ALL">Все статусы</option>
                                <option value="ACTIVE">Активные</option>
                                <option value="INACTIVE">Выключенные</option>
                            </select>
                            <div className="w-px h-10 bg-slate-100 mx-1 hidden lg:block" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-4 py-3 bg-blue-50 border border-blue-100 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500 cursor-pointer appearance-none min-w-[160px]"
                            >
                                <option value="NAME">Сортировка: Имя</option>
                                <option value="PRICE_ASC">Цена: Низкая → Высокая</option>
                                <option value="PRICE_DESC">Цена: Высокая → Низкая</option>
                                <option value="MARGIN">Доходность: Max %</option>
                            </select>
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value as any)}
                                className="px-4 py-3 bg-slate-900 border border-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-slate-900/10 cursor-pointer appearance-none min-w-[160px]"
                            >
                                <option value="PLATFORM_CATEGORY">Группировка: Сеть + Категория</option>
                                <option value="PLATFORM">Группировка: Сеть</option>
                                <option value="CATEGORY">Группировка: Категория</option>
                                <option value="NONE">Без группировки</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl">
                        <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm">
                            <button onClick={() => setCurrency('RUB')} className={cn("px-3 py-1.5 text-[10px] font-black rounded-lg transition-all", currency === 'RUB' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>RUB ₽</button>
                            <button onClick={() => setCurrency('USD')} className={cn("px-3 py-1.5 text-[10px] font-black rounded-lg transition-all", currency === 'USD' ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>USD $</button>
                        </div>
                        <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm">
                            <button onClick={() => setUnit(1000)} className={cn("px-3 py-1.5 text-[10px] font-black rounded-lg transition-all", unit === 1000 ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>за 1000</button>
                            <button onClick={() => setUnit(1)} className={cn("px-3 py-1.5 text-[10px] font-black rounded-lg transition-all", unit === 1 ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600")}>за 1 шт</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST */}
            <div className="space-y-8">
                {Object.entries(groupedServices).map(([groupName, services]) => (
                    <div key={groupName} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                                    <Layers size={18} className="text-blue-500" />
                                </div>
                                <h3 className="font-black text-slate-800 uppercase italic tracking-tight">{groupName}</h3>
                                <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-400">{services.length}</span>
                            </div>
                            <button
                                onClick={() => toggleSelectAll(services.map(s => s.id))}
                                className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors"
                            >
                                {services.every(s => selectedIds.has(s.id)) ? 'Снять выделение' : 'Выбрать всё в группе'}
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                        <th className="px-6 py-4 w-12 text-center">
                                            <div className="flex justify-center">
                                                <div className="w-5 h-5 rounded border-2 border-slate-200 flex items-center justify-center cursor-pointer" onClick={() => toggleSelectAll(services.map(s => s.id))}>
                                                    {services.every(s => selectedIds.has(s.id)) && <Check size={14} className="text-blue-600" />}
                                                </div>
                                            </div>
                                        </th>
                                        <th className="px-6 py-4">Услуга</th>
                                        <th className="px-6 py-4 text-center">Закупка</th>
                                        <th className="px-6 py-4 text-center">Наценка %</th>
                                        <th className="px-6 py-4 text-center">Продажа</th>
                                        <th className="px-6 py-4 text-right">Статус</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {services.map(s => {
                                        const isSelected = selectedIds.has(s.id);
                                        return (
                                            <tr key={s.id} className={cn("group hover:bg-slate-50/50 transition-colors", !s.active && "opacity-60", isSelected && "bg-blue-50/30")}>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <div
                                                            onClick={() => toggleSelect(s.id)}
                                                            className={cn("w-5 h-5 rounded border-2 transition-all flex items-center justify-center cursor-pointer", isSelected ? "bg-blue-600 border-blue-600 shadow-lg shadow-blue-200" : "border-slate-200 bg-white hover:border-blue-400")}
                                                        >
                                                            {isSelected && <Check size={14} className="text-white" />}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2">
                                                            <Link
                                                                href={`/admin/services/${s.id}`}
                                                                className="font-bold text-sm text-slate-900 hover:text-blue-600 transition-colors"
                                                            >
                                                                {s.name}
                                                            </Link>
                                                            {s.description && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExpandedDescId(expandedDescId === s.id ? null : s.id);
                                                                    }}
                                                                    className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                                                                    title="Показать описание"
                                                                >
                                                                    {expandedDescId === s.id ? <ChevronUp size={14} /> : <Info size={14} />}
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                                            {s.providerMappings?.[0]?.provider?.name || 'Manual'}
                                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <span className="text-blue-500">{CATEGORY_LABELS[s.category] || s.category}</span>
                                                            <span className="w-1 h-1 rounded-full bg-slate-200" />
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const cleaned = s.name
                                                                        .replace(/\[.*?\]/g, '')
                                                                        .replace(/(telegram|instagram|youtube|vk|tiktok|twitter|facebook|ok|twitch|spotify|soundcloud|threads|pinterest|linkedin|discord|max)/gi, '')
                                                                        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
                                                                        .replace(/\s+/g, ' ')
                                                                        .trim();
                                                                    const keywords = cleaned.split(' ').filter(w => w.length > 2).slice(0, 3).join(' ');
                                                                    setAlternativesFor({
                                                                        id: s.id,
                                                                        name: keywords || s.name.split(' ').slice(0, 2).join(' '),
                                                                        currentProviderServiceId: s.providerMappings?.[0] ? Number(s.providerServiceId || 0) : undefined
                                                                    });
                                                                }}
                                                                className="text-emerald-500 hover:text-emerald-600 flex items-center gap-0.5 ml-1 transition-colors"
                                                            >
                                                                <Search size={10} /> Альтернативы
                                                            </button>
                                                        </div>
                                                        {expandedDescId === s.id && s.description && (
                                                            <div className="mt-2 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[10px] text-slate-600 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">
                                                                {s.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase">Закупка:</span>
                                                        <div className="text-[11px] font-black text-slate-500 font-mono italic">
                                                            {formatPrice(s.cost)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="inline-flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 group-hover:border-blue-200 group-hover:bg-white transition-all">
                                                        <input
                                                            type="number"
                                                            value={s.markup ?? ''}
                                                            onChange={(e) => {
                                                                const val = e.target.value === '' ? null : parseFloat(e.target.value);
                                                                handleMarkupUpdate(s.id, val);
                                                            }}
                                                            className="w-12 bg-transparent text-center text-xs font-black text-slate-800 outline-none"
                                                        />
                                                        <Percent size={10} className="text-slate-400" />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-black text-indigo-500 uppercase">Продажа:</span>
                                                        <div className="text-sm font-black text-slate-900 italic font-mono">
                                                            {formatPrice(s.finalPrice)}
                                                        </div>
                                                        <div className="text-[9px] text-emerald-500 font-bold uppercase tracking-tighter">
                                                            Профит: {formatPrice(s.finalPrice - s.cost)}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleToggle(s.id)}
                                                        className={cn(
                                                            "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shadow-sm active:scale-95",
                                                            s.active ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100" : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100"
                                                        )}
                                                    >
                                                        {s.active ? 'Активен' : 'Скрыт'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}

                {filteredServices.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <div className="p-6 bg-slate-50 rounded-full text-slate-200 mb-6">
                            <ShoppingCart size={64} />
                        </div>
                        <h4 className="text-xl font-black text-slate-800 uppercase italic">Услуги не найдены</h4>
                        <p className="text-sm text-slate-400 font-medium mt-2">Попробуйте изменить параметры поиска или фильтры.</p>
                    </div>
                )}
            </div>

            {/* BULK ACTIONS BAR */}
            <AnimatePresence>
                {selectedIds.size > 0 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-8 border border-white/10 backdrop-blur-xl"
                    >
                        <div className="flex flex-col pr-8 border-r border-white/10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Выбрано</span>
                            <span className="text-2xl font-black italic">{selectedIds.size} <span className="text-xs not-italic opacity-50 uppercase ml-1">услуг</span></span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => handleBulkToggle(true)}
                                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                                <CheckCircle2 size={16} /> ВКЛ
                            </button>
                            <button
                                onClick={() => handleBulkToggle(false)}
                                className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                                <X size={16} /> ВЫКЛ
                            </button>
                            <button
                                onClick={handleBulkMarkup}
                                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
                            >
                                <Percent size={16} /> Наценка
                            </button>

                            <div className="h-10 w-px bg-white/10 mx-2" />

                            <select
                                onChange={(e) => {
                                    const catId = e.target.value;
                                    if (catId) _handleBulkMove(catId);
                                }}
                                className="bg-white/10 border-none rounded-2xl py-3 px-6 text-[10px] font-black uppercase tracking-widest text-white outline-none cursor-pointer hover:bg-white/20 transition-all max-w-[200px] shadow-lg"
                            >
                                <option value="" className="text-slate-900">Переместить в...</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id} className="text-slate-900">
                                        {c.platform} - {c.name}
                                    </option>
                                ))}
                            </select>

                            <div className="w-px h-8 bg-white/10 mx-2" />
                            <button
                                onClick={handleBulkRemove}
                                className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                            >
                                <Trash2 size={16} className="text-rose-400" /> Удалить
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedIds(new Set())}
                            className="p-3 hover:bg-white/10 rounded-full transition-colors ml-4"
                        >
                            <X size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Alternatives Drawer */}
            <ProjectAlternativesDrawer
                projectId={projectId}
                isOpen={!!alternativesFor}
                onClose={() => setAlternativesFor(null)}
                internalServiceId={alternativesFor?.id || ''}
                initialSearchKeywords={alternativesFor?.name || ''}
                currentProviderServiceId={alternativesFor?.currentProviderServiceId}
            />
        </div>
    );
}
