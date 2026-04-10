"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Platform } from '@prisma/client';
import {
    PackagePlus, RefreshCw, Layers, Info,
    Activity, Search, X, Edit, Trash2,
    Globe, Zap, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { useServiceDashboard } from './manager-context';
import { ProviderHub } from './provider-hub';
import { HealthCheckWidget } from './health-check';
import { usePriceDisplay } from '../price-display-context';
import Link from 'next/link';
import {
    toggleServiceStatus,
    deleteService,
    repairCategoriesAction,
    syncAllServicesAction,
    bulkDeleteServicesAction
} from '@/app/admin/services/actions';
import { bulkMoveServicesToCategoryAction, bulkToggleStatusAction } from '@/app/admin/services/bulk-actions';
import { syncProviderAction } from '@/app/admin/providers/actions';
import { CopyButton } from '@/components/admin/core/copy-button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectBulkManagerModal } from '../ProjectBulkManagerModal';
import { AdminTableCard } from '@/components/admin/core/admin-table-card';
import { BulkPricingModal } from '../bulk-pricing-modal';
import { bulkUpdatePricesAction } from '@/app/admin/services/bulk-actions';


// --- WIDGET 1: ACTION CARDS (BENTO) ---
export function ActionCardsWidget() {
    const { setIsImportOpen, isSyncing, setIsSyncing, services } = useServiceDashboard();

    const handleGlobalSync = async () => {
        if (!confirm('Запустить полную синхронизацию всех услуг? Это может занять время.')) return;
        setIsSyncing(true);
        try {
            const res = await syncAllServicesAction() as any;
            if (res.success) {
                toast.success(`Синхронизация завершена! Обновлено: ${res.updatedCount}`);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error(res.error || 'Ошибка синхронизации');
            }
            // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            toast.error('Ошибка сети');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full">
            <div className="md:col-span-3 h-full">
                <HealthCheckWidget />
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4 h-full">
                <div
                    onClick={() => setIsImportOpen(true)}
                    className="group relative bg-white border border-slate-100 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-xl transition-all overflow-hidden border-dashed cursor-pointer"
                >
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <PackagePlus size={20} />
                    </div>
                    <div className="text-center">
                        <span className="text-[11px] font-black text-slate-800 uppercase ">Импорт</span>
                    </div>
                </div>

                <div
                    onClick={handleGlobalSync}
                    className="bg-white border border-slate-100 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:shadow-xl transition-all group overflow-hidden border-dashed cursor-pointer"
                >
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <RefreshCw size={20} className={cn(isSyncing && "animate-spin")} />
                    </div>
                    <div className="text-center">
                        <span className="text-[11px] font-black text-slate-800 uppercase ">Синхронизация</span>
                    </div>
                </div>
            </div>

            <div className="md:col-span-5 bg-slate-900 rounded-[2rem] p-8 flex items-center justify-between group hover:bg-slate-800 transition-all shadow-2xl relative overflow-hidden h-full">
                <div className="relative z-10">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] leading-none">Каталог</span>
                    <h3 className="text-4xl font-black text-white italic er mt-1">{services.length}</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">активных сервисов</p>
                </div>
                <div className="relative z-10 p-6 bg-white/5 text-white/20 rounded-3xl group-hover:text-blue-500 group-hover:scale-110 transition-all">
                    <Layers size={48} />
                </div>
                <div className="absolute bottom-[-20px] left-[-20px] w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
            </div>
        </div>
    );
}

// --- WIDGET 2: PROVIDER MONITORING ---
export function ProviderMonitoringWidget() {
    const { providers, syncingProviderId, setSyncingProviderId } = useServiceDashboard();

    const handleProviderSync = async (id: string) => {
        setSyncingProviderId(id);
        try {
            const res = await syncProviderAction(id);
            if (res.success) {
                toast.success('Провайдер синхронизирован');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error(res.error || 'Ошибка синхронизации');
            }
            // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            toast.error('Ошибка сети');
        } finally {
            setSyncingProviderId(null);
        }
    };

    const handleTopUp = (provider: any) => {
        toast.info(`Перенаправляем к пополнению ${provider.name}...`);
        setTimeout(() => window.location.href = `/admin/providers?topup=${provider.id}`, 1000);
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Мониторинг провайдеров</span>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <ProviderHub
                    providers={providers}
                    onSync={handleProviderSync}
                    onTopUp={handleTopUp}
                    syncingId={syncingProviderId}
                />
            </div>
        </div>
    );
}

// --- WIDGET 3: SERVICES TABLE + FILTERS ---
export function ServicesTableWidget() {
    const {
        filteredServices, search, setSearch,
        selectedPlatform, setSelectedPlatform,
        selectedCategory, setSelectedCategory,
        selectedProvider, setSelectedProvider,
        statusFilter, setStatusFilter,
        selectedInternalId, setSelectedInternalId,
        platforms, providers,
        selectedIds, setSelectedIds, overrides, setServices, categories,
        paginatedServices, currentPage, setCurrentPage, totalPages
    } = useServiceDashboard();
    const { unit, formatPrice } = usePriceDisplay();

    const [rowPlatformOverrides, setRowPlatformOverrides] = useState<Record<string, string>>({});
    const [projectsModalService, setProjectsModalService] = useState<any>(null);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredServices.length && filteredServices.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredServices.map(s => s.id));
        }
    };

    const _handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
        const res = await toggleServiceStatus(serviceId, !currentStatus);
        if (res.success) {
            setServices(prev => prev.map(s => s.id === serviceId ? { ...s, isActive: !currentStatus } : s));
            toast.success('Статус обновлен');
        }
    };

    const handleSingleDelete = async (serviceId: string) => {
        if (!confirm('Удалить эту услугу?')) return;
        const res = await deleteService(serviceId);
        if (res.success) {
            toast.success('Услуга удалена');
            setServices(prev => prev.filter(s => s.id !== serviceId));
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Вы уверены, что хотите удалить ${selectedIds.length} услуг?`)) return;
        const res = await bulkDeleteServicesAction(selectedIds) as any;
        if (res.success) {
            toast.success(`Удалено: ${res.deleted}`);
            setServices(prev => prev.filter(s => !selectedIds.includes(s.id)));
            setSelectedIds([]);
        }
    };

    const _handleBulkMove = async (catId: string, targetIds?: string[]) => {
        const ids = targetIds || selectedIds;
        if (ids.length === 0) return;

        const cat = categories.find(c => c.id === catId);
        if (!cat) return;

        const res = await bulkMoveServicesToCategoryAction(ids, catId, cat.platform, cat.categoryType);
        if (res.success) {
            toast.success(ids.length > 1 ? 'Услуги перемещены' : 'Категория обновлена');
            setServices(prev => prev.map(s => ids.includes(s.id) ? { ...s, categoryId: catId, platform: cat.platform, category: cat.categoryType } : s));
            if (!targetIds) {
                setSelectedIds([]);
            } else {
                // Clear local overrides for updated services
                setRowPlatformOverrides(prev => {
                    const next = { ...prev };
                    targetIds.forEach(id => delete next[id]);
                    return next;
                });
            }
        }
    };

    const handleBulkToggle = async (isActive: boolean) => {
        const res = await bulkToggleStatusAction(selectedIds, isActive);
        if (res.success) {
            toast.success(isActive ? 'Услуги включены' : 'Услуги отключены');
            setServices(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, isActive } : s));
            setSelectedIds([]);
        }
    };

    const handleBulkPriceUpdate = async (operation: { type: 'add' | 'multiply' | 'increase_percent'; value: number }) => {
        const res = await bulkUpdatePricesAction(selectedIds, activeProjectId === 'all' ? null : activeProjectId, operation);
        if (res.success) {
            toast.success('Цены успешно обновлены');
            window.location.reload(); // Reload to fetch fresh overridden prices
        } else {
            toast.error(res.error || 'Ошибка обновления цен');
        }
    };

    return (
        <div className="flex flex-col gap-6 h-full">
            {/* Filters */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    <div className="space-y-1.5 lg:col-span-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">ID</label>
                        <input
                            type="text" value={selectedInternalId} onChange={e => setSelectedInternalId(e.target.value)}
                            placeholder="ID..."
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                        />
                    </div>
                    <div className="space-y-1.5 lg:col-span-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Название</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Поиск..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 pl-9 pr-3 text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-500 transition-all"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Платформа</label>
                        <select
                            value={selectedPlatform} onChange={e => setSelectedPlatform(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none appearance-none"
                        >
                            <option value="all">Все</option>
                            {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Категория</label>
                        <select
                            value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none appearance-none"
                        >
                            <option value="all">Все категории</option>
                            {categories
                                .filter(c => selectedPlatform === 'all' || c.platform === selectedPlatform)
                                .map(c => (
                                    <option key={c.id} value={c.categoryType}>
                                        {c.name}
                                    </option>
                                ))
                            }
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Провайдер</label>
                        <select
                            value={selectedProvider} onChange={e => setSelectedProvider(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-sm font-bold text-slate-800 outline-none appearance-none"
                        >
                            <option value="all">Все</option>
                            {providers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Статус</label>
                        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100">
                            {(['all', 'active', 'inactive'] as const).map((s) => (
                                <button
                                    key={s} onClick={() => setStatusFilter(s)}
                                    className={cn(
                                        "flex-1 py-1 px-2 rounded-lg text-[9px] font-black uppercase transition-all",
                                        statusFilter === s ? "bg-white text-slate-900 shadow-sm font-black" : "text-slate-400"
                                    )}
                                >
                                    {s === 'all' ? 'Все' : s === 'active' ? 'Вкл' : 'Откл'}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <AdminTableCard
                title="Все услуги"
                icon={Layers}
                className="flex-1 min-h-0 flex flex-col relative"
                rightElement={
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Страница {currentPage} из {totalPages || 1}
                    </div>
                }
            >
                    <table className="w-full border-collapse flex-1 relative">
                        <thead className="sticky top-0 z-20 bg-white/80 backdrop-blur-md">
                            <tr className="border-b border-slate-50">
                                <th className="px-6 py-4 text-left w-10">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === filteredServices.length && filteredServices.length > 0}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                    />
                                </th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Услуга</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Провайдер</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Платформа / Категория</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Статус</th>
                                <th className="px-6 py-4 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Ценообразование ({unit === 1000 ? 'за 1000' : 'за 1 шт'})</th>
                                <th className="px-6 py-4 text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedServices.map((s) => {
                                const override = overrides.find(o => o.internalServiceId === s.id);
                                const projectPrice = override?.customPrice || s.pricePer1000;
                                return (
                                    <tr key={s.id} className={cn("group hover:bg-slate-50/50 transition-all", selectedIds.includes(s.id) && "bg-blue-50/30")}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(s.id)}
                                                onChange={() => toggleSelect(s.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-start gap-2">
                                                    <Link href={`/admin/services/${s.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors break-words max-w-[500px] leading-tight mb-1">
                                                        {override?.customName || s.name}
                                                    </Link>
                                                    {s.description && (
                                                        <button
                                                            onClick={() => toast.info(s.description, { duration: 5000 })}
                                                            className="mt-1 p-1 text-slate-300 hover:text-blue-500 transition-colors"
                                                            title="Описание"
                                                        >
                                                            <Info size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-slate-400 font-mono">#{s.id.slice(-6)}</span>
                                                    <CopyButton value={s.id} label="Full ID" />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {s.providerMappings && s.providerMappings.length > 0 ? (
                                                    s.providerMappings.map((m: any) => (
                                                        <div key={m.id} className={cn(
                                                            "flex flex-col p-1.5 rounded-lg border border-slate-50",
                                                            m.priority === 1 ? "bg-blue-500/5 border-blue-100" : "bg-white"
                                                        )}>
                                                            <div className="flex items-center justify-between gap-2">
                                                                 <span className="text-[9px] font-black text-slate-900 uppercase truncate">
                                                                    {m.provider?.name || 'Unknown'}
                                                                </span>
                                                                <span className={cn(
                                                                    "text-[8px] font-bold px-1 rounded",
                                                                    m.priority === 1 ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                                                                )}>
                                                                    P{m.priority}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase er">SKU:</span>
                                                                <span className="text-[9px] font-bold text-slate-600 font-mono">{m.providerService?.id || 'N/A'}</span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-[9px] font-bold text-rose-400 uppercase">Нет привязок</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-1.5">
                                                    <Globe size={10} className="text-blue-500 shrink-0" />
                                                    <select
                                                        value={rowPlatformOverrides[s.id] || s.platform}
                                                        onChange={(e) => setRowPlatformOverrides(prev => ({ ...prev, [s.id]: e.target.value }))}
                                                        className="bg-transparent border-none p-0 text-[10px] font-black text-slate-900 uppercase focus:ring-0 cursor-pointer hover:text-blue-600 transition-colors"
                                                    >
                                                        {Object.values(Platform).map(p => (
                                                            <option key={p} value={p}>{p}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <select
                                                    value={s.categoryId || ''}
                                                    onChange={(e) => {
                                                        const newCatId = e.target.value;
                                                        if (!newCatId) return;
                                                        _handleBulkMove(newCatId, [s.id]);
                                                    }}
                                                    className="bg-slate-50 border border-slate-100 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-600 outline-none hover:border-blue-300 transition-all cursor-pointer max-w-[140px]"
                                                >
                                                    <option value="" disabled>Категория...</option>
                                                    {categories
                                                        .filter(c => c.platform === (rowPlatformOverrides[s.id] || s.platform))
                                                        .map(c => (
                                                            <option key={c.id} value={c.id}>{c.name}</option>
                                                        ))
                                                    }
                                                </select>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div onClick={() => _handleToggleStatus(s.id, s.isActive)} className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase er cursor-pointer hover:bg-slate-200 transition-colors",
                                                s.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                            )}>
                                                <div className={cn("w-1 h-1 rounded-full", s.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                                                {s.isActive ? 'Вкл' : 'Откл'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Закупка:</span>
                                                    <span className="text-xs font-bold text-slate-600 font-mono italic">
                                                        {s.lastProviderPrice ? formatPrice(s.lastProviderPrice) : '—'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black text-indigo-500 uppercase whitespace-nowrap">Продажа:</span>
                                                    <span className="text-base font-black text-slate-900 font-mono er">
                                                        {formatPrice(projectPrice)}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button 
                                                    onClick={() => setProjectsModalService(s)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                                                    title="Управление в проектах"
                                                >
                                                    <Globe size={14} />
                                                </button>
                                                <Link href={`/admin/services/${s.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                                                    <Edit size={14} />
                                                </Link>
                                                <button onClick={() => handleSingleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                <ProjectBulkManagerModal
                    isOpen={!!projectsModalService}
                    onClose={() => setProjectsModalService(null)}
                    service={projectsModalService}
                />

                <BulkPricingModal
                    isOpen={isPricingModalOpen}
                    onClose={() => setIsPricingModalOpen(false)}
                    selectedCount={selectedIds.length}
                    onApply={handleBulkPriceUpdate}
                />

                {/* Pagination Footer */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-50 flex items-center justify-between shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Страница {currentPage} из {totalPages || 1}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all active:scale-95"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = currentPage;
                                if (totalPages <= 5) pageNum = i + 1;
                                else {
                                    if (currentPage <= 3) pageNum = i + 1;
                                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                    else pageNum = currentPage - 2 + i;
                                }

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={cn(
                                            "w-8 h-8 rounded-xl text-[10px] font-black transition-all active:scale-95",
                                            currentPage === pageNum ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-white border border-slate-100 text-slate-400 hover:border-blue-200 hover:text-blue-600"
                                        )}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-all active:scale-95"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Mini Bar */}
                <AnimatePresence>
                    {selectedIds.length > 0 && (
                        <motion.div
                            initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
                            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 z-40 border border-slate-800"
                        >
                            <span className="text-xs font-black italic">{selectedIds.length} выбрано</span>
                            <div className="flex items-center gap-2">
                                <button onClick={() => handleBulkToggle(true)} className="p-2 bg-white/10 hover:bg-emerald-500 rounded-lg transition-colors" title="Включить"><Zap size={14} /></button>
                                <button onClick={() => handleBulkToggle(false)} className="p-2 bg-white/10 hover:bg-slate-700 rounded-lg transition-colors" title="Отключить"><X size={14} /></button>

                                <div className="h-4 w-px bg-white/20 mx-1" />

                                <button 
                                    onClick={() => setIsPricingModalOpen(true)} 
                                    className="px-3 py-1.5 bg-blue-500/20 text-blue-50 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1.5"
                                >
                                    Цены
                                </button>

                                <div className="h-4 w-px bg-white/20 mx-1" />

                                <select
                                    onChange={(e) => {
                                        const catId = e.target.value;
                                        if (catId) _handleBulkMove(catId);
                                    }}
                                    className="bg-white/10 border-none rounded-lg py-1.5 px-3 text-[10px] font-black text-white outline-none cursor-pointer hover:bg-white/20 transition-all max-w-[150px]"
                                >
                                    <option value="" className="text-slate-900">Переместить в...</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id} className="text-slate-900">
                                            {c.platform} - {c.name}
                                        </option>
                                    ))}
                                </select>

                                <button onClick={handleBulkDelete} className="p-2 bg-white/10 hover:bg-rose-500 rounded-lg transition-colors" title="Удалить"><Trash2 size={14} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AdminTableCard>
        </div>
    );
}

// --- WIDGET 4: MAINTENANCE & REPAIR ---
export function MaintenanceWidget() {
    const { isRepairing, setIsRepairing, activeProjectId, isGlobal } = useServiceDashboard();

    const handleRepair = async () => {
        setIsRepairing(true);
        try {
            const res = await repairCategoriesAction(activeProjectId === 'all' ? null : activeProjectId);
            if (res.success) {
                toast.success(`Восстановлено: ${res.count} категорий`);
                setTimeout(() => window.location.reload(), 1000);
            }
        } finally {
            setIsRepairing(false);
        }
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between h-full bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Info size={24} />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Системные проверки</div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">
                        {isGlobal ? 'Мастер-каталог: Глобальные изменения' : 'Локальный режим: Настройки проекта'}
                    </div>
                </div>
            </div>
            <button
                onClick={handleRepair}
                disabled={isRepairing}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
                <RefreshCw size={14} className={cn(isRepairing && "animate-spin")} />
                {isRepairing ? 'Ждите...' : 'Починить'}
            </button>
        </div>
    );
}


