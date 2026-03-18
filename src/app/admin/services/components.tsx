'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */


import { PLATFORM_LABELS } from '@/services/providers/smart-analyzer.logic';

import React, { useState } from 'react';
import { getActivityLabel } from '@/utils/order-utils';
import {
    Search, AlertTriangle,
    Power, Trash2,
    Clock, FileText,
    Info, Plus, Edit
} from 'lucide-react';
import { toggleServiceStatus, deleteService } from './actions';
import { formatAmount } from '@/utils/formatter';
import { useRouter } from 'next/navigation';
import { Decimal } from 'decimal.js';
import { ServiceEditorModal } from '@/components/admin/services/service-editor-modal';
import { Platform } from '@/generated/client';

interface ServiceTableProps {
    services: any[];
    providers: any[];
    allProviderServices: any[];
    categories: any[];
}

export function ServiceTable({ services, providers, allProviderServices, categories }: ServiceTableProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [minPrice] = useState('');
    const [maxPrice] = useState('');
    const [sortOrder, setSortOrder] = useState('');

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingService, setEditingService] = useState<any | null>(null);

    const router = useRouter();

    // 1. Filter
    const filtered = services.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.id.includes(searchTerm) || s.numericId?.toString().includes(searchTerm) ||
            (s.slug && s.slug.includes(searchTerm));

        if (!matchesSearch) return false;

        const price = Number(s.pricePer1000);
        if (minPrice && price < parseFloat(minPrice)) return false;
        if (maxPrice && price > parseFloat(maxPrice)) return false;

        return true;
    });

    // 2. Sort
    const sorted = [...filtered].sort((a, b) => {
        if (!sortOrder) return 0;

        const priceA = Number(a.pricePer1000);
        const priceB = Number(b.pricePer1000);

        if (sortOrder === 'price_asc') return priceA - priceB;
        if (sortOrder === 'price_desc') return priceB - priceA;

        const costA = Number(a.lastProviderPrice);
        const costB = Number(b.lastProviderPrice);
        const marginA = costA > 0 ? ((priceA - costA) / costA) : 100;
        const marginB = costB > 0 ? ((priceB - costB) / costB) : 100;

        if (sortOrder === 'margin_asc') return marginA - marginB;
        if (sortOrder === 'margin_desc') return marginB - marginA;

        return 0;
    });

    const handleToggleStatus = async (id: string, current: boolean) => {
        const res = await toggleServiceStatus(id, !current);
        if (!res.success) {
            alert(res.error || 'Ошибка при переключении статуса');
        }
        router.refresh();
    };

    const handleDeleteService = async (id: string, name: string) => {
        if (!confirm(`Вы действительно хотите удалить услугу "${name}"?\n\nВнимание: Удаление сработает только если у услуги нет заказов. Если заказы есть, услугу можно только отключить.`)) return;

        const res = await deleteService(id);
        if (res.success) {
            router.refresh();
        } else {
            alert(res.error || 'Ошибка при удалении');
        }
    };

    const openCreateModal = () => {
        setEditingService(null);
        setIsEditorOpen(true);
    };

    const openEditModal = (service: any) => {
        setEditingService(service);
        setIsEditorOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* TOOLBAR */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm justify-between items-start md:items-center">

                <div className="flex-1 w-full md:w-auto flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 outline-none transition-all"
                            placeholder="Поиск тарифа по названию, ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/20"
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value)}
                        >
                            <option value="">Сортировка</option>
                            <option value="price_asc">Цена: ↑</option>
                            <option value="price_desc">Цена: ↓</option>
                            <option value="margin_asc">Маржа: ↑</option>
                            <option value="margin_desc">Маржа: ↓</option>
                        </select>
                        <div className="bg-slate-100 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 whitespace-nowrap border border-slate-200">
                            Тарифы: {sorted.length}
                        </div>
                    </div>
                </div>

                <button
                    onClick={openCreateModal}
                    className="w-full md:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wide flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                >
                    <Plus size={16} />
                    Добавить тариф
                </button>
            </div>

            {/* TABLE */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] uppercase tracking-wider text-slate-500 font-bold">
                                <th className="px-6 py-4">Public Public ID / Название</th>
                                <th className="px-6 py-4">Провайдеры</th>
                                <th className="px-6 py-4">Цена / Инфо</th>
                                <th className="px-6 py-4">Маржа</th>
                                <th className="px-6 py-4 text-center">Статус</th>
                                <th className="px-6 py-4 text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {(() => {
                                const grouped: Record<string, Record<string, any[]>> = {};
                                sorted.forEach(s => {
                                    const platform = s.platform;
                                    const groupName = s.serviceCategory?.name || getActivityLabel(s.category) || 'Без категории';

                                    if (!grouped[platform]) grouped[platform] = {};
                                    if (!grouped[platform][groupName]) grouped[platform][groupName] = [];
                                    grouped[platform][groupName].push(s);
                                });

                                return Object.entries(grouped).sort().map(([platform, groups]) => (
                                    <React.Fragment key={platform}>
                                        <tr className="bg-slate-100/80 border-y border-slate-200">
                                            <td colSpan={7} className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-900 shadow-sm border border-slate-200">
                                                        <span className="font-black text-[10px]">{platform.substring(0, 2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                                            {PLATFORM_LABELS[platform as Platform] || platform}
                                                        </span>
                                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                            Тарифов: {Object.values(groups).flat().length}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>

                                        {Object.entries(groups).sort((a, b) => {
                                            const priorityA = a[1][0]?.serviceCategory?.priority || 0;
                                            const priorityB = b[1][0]?.serviceCategory?.priority || 0;
                                            if (priorityB !== priorityA) return priorityB - priorityA;
                                            return a[0].localeCompare(b[0]);
                                        }).map(([groupName, groupServices]) => {
                                            const firstService = groupServices[0];
                                            const groupTargetType = firstService.serviceCategory?.targetType || firstService.targetType;

                                            return (
                                                <React.Fragment key={`${platform}-${groupName}`}>
                                                    <tr className="bg-white border-b border-slate-100 group/cat">
                                                        <td colSpan={7} className="px-10 py-3">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight">
                                                                        {groupName}
                                                                    </span>
                                                                    <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold uppercase border border-slate-200">
                                                                        {groupTargetType}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-300 font-bold group-hover/cat:text-slate-500 transition-colors">
                                                                    {groupServices.length} тарифов
                                                                </span>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {groupServices.map(service => {
                                                        const price = Number(service.pricePer1000);
                                                        const cost = Number(service.lastProviderPrice);
                                                        const margin = price - cost;
                                                        const marginPercent = cost > 0 ? (margin / cost) * 100 : 100;
                                                        const isLowMargin = marginPercent < 15;

                                                        return (
                                                            <tr key={service.id} className="hover:bg-slate-50/80 transition-colors group">
                                                                <td className="px-6 py-4 pl-12 max-w-[350px]">
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-start gap-2">
                                                                            <span className="font-bold text-slate-700 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                                                                                {service.name}
                                                                            </span>
                                                                            {service.description && (
                                                                                <div className="relative group/desc shrink-0 mt-1">
                                                                                    <Info size={13} className="text-slate-300 hover:text-blue-500 cursor-help transition-colors" />
                                                                                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 w-72 p-3 bg-slate-800 text-white text-[11px] rounded-lg opacity-0 invisible group-hover/desc:opacity-100 group-hover/desc:visible transition-all z-50 shadow-xl pointer-events-none leading-relaxed">
                                                                                        {service.description}
                                                                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-1 border-4 border-transparent border-r-slate-800" />
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded cursor-help" title={`Core ID: ${service.id}`}>
                                                                                ID: {service.numericId}
                                                                            </span>
                                                                            {service.requirements && (
                                                                                <div className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 rounded text-[9px] text-amber-600 font-bold border border-amber-100/50">
                                                                                    <FileText size={10} /> Требования
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    {service.providerMappings?.length > 0 ? (
                                                                        <div className="flex flex-col gap-1.5">
                                                                            {service.providerMappings.slice(0, 2).map((m: any, idx: number) => (
                                                                                <div key={`${m.providerId}-${m.providerServiceId}`} className="flex items-center gap-1.5">
                                                                                    <span className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black ${idx === 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                                        {m.priority}
                                                                                    </span>
                                                                                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-[80px]">
                                                                                        {m.provider?.name || '?'}
                                                                                    </span>
                                                                                    <span className="text-[9px] font-mono text-blue-500 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                                                                                        #{m.providerServiceId}
                                                                                    </span>
                                                                                </div>
                                                                            ))}
                                                                            {service.providerMappings.length > 2 && (
                                                                                <span className="text-[9px] text-slate-400 font-bold pl-1">+{service.providerMappings.length - 2} ещё</span>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[10px] text-red-400 font-bold italic flex items-center gap-1">
                                                                            <AlertTriangle size={10} /> Нет
                                                                        </span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="font-mono font-black text-slate-700">
                                                                        {formatAmount(new Decimal(price))}₽
                                                                    </div>
                                                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                                                                        <Clock size={10} /> {service.avgCompletionTime || '—'} мин
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className={`flex items-center gap-1.5 font-bold text-xs ${isLowMargin && margin > 0 ? 'text-amber-500' : margin <= 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                        {margin > 0 ? '+' : ''}{Math.round(marginPercent)}%
                                                                        {isLowMargin && <AlertTriangle size={12} />}
                                                                    </div>
                                                                    {cost > 0 && (
                                                                        <div className="text-[9px] text-slate-400/50 mt-0.5 font-mono">
                                                                            Закупка: {cost}₽
                                                                        </div>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <button
                                                                        onClick={() => handleToggleStatus(service.id, service.isActive)}
                                                                        className={`p-1.5 rounded-lg transition-all ${service.isActive
                                                                            ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                                            }`}
                                                                    >
                                                                        <Power size={16} />
                                                                    </button>
                                                                </td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-2">
                                                                        <button
                                                                            onClick={() => openEditModal(service)}
                                                                            className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all shadow-sm group/btn"
                                                                            title="Редактировать"
                                                                        >
                                                                            <Edit size={16} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteService(service.id, service.name)}
                                                                            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-lg hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all shadow-sm"
                                                                            title="Удалить"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            );
                                        })}
                                    </React.Fragment>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>

                {sorted.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-slate-800 font-bold text-lg">Ничего не найдено</h3>
                        <p className="text-slate-400 text-sm mt-1">Попробуйте изменить параметры поиска или добавьте новую услугу.</p>
                        <button onClick={openCreateModal} className="mt-4 text-blue-600 font-bold text-sm hover:underline">
                            Добавить услугу
                        </button>
                    </div>
                )}
            </div>

            {/* SHARED EDITOR MODAL */}
            <ServiceEditorModal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                service={editingService}
                providers={providers}
                allProviderServices={allProviderServices}
                categories={categories}
                onSuccess={() => {
                    setIsEditorOpen(false);
                    router.refresh();
                }}
            />
        </div >
    );
}


