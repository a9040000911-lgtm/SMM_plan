"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { 
    Search, X, Edit, Trash2, 
    Globe, Zap, ChevronLeft, ChevronRight, Info
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { useServiceDashboard } from '../manager-context';
import { usePriceDisplay } from '../../price-display-context';
import Link from 'next/link';
import {
    toggleServiceStatus,
    deleteService,
    bulkDeleteServicesAction
} from '@/app/admin/services/actions';
import { bulkMoveServicesToCategoryAction, bulkToggleStatusAction, bulkUpdatePricesAction } from '@/app/admin/services/bulk-actions';
import { CopyButton } from '@/components/admin/core/copy-button';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ProjectBulkManagerModal } from '../../ProjectBulkManagerModal';
import { AdminTableCard } from '@/components/admin/core/admin-table-card';
import { BulkPricingModal } from '../../bulk-pricing-modal';
import { BulkCategoryModal } from '../../bulk-category-modal';

// --- SUB-COMPONENT: SERVICE ROW ---
function ServiceRow({ 
    service, 
    isSelected, 
    onToggleSelect, 
    onToggleStatus, 
    onDelete, 
    onMove, 
    onProjectManage,
    overrides,
    categories 
}: {
    service: any;
    isSelected: boolean;
    onToggleSelect: (id: string) => void;
    onToggleStatus: (id: string, current: boolean) => void;
    onDelete: (id: string) => void;
    onMove: (id: string) => void;
    onProjectManage: (service: any) => void;
    overrides: any[];
    categories: any[];
}) {
    const { formatPrice, unit } = usePriceDisplay();
    const override = overrides.find(o => o.internalServiceId === service.id);
    const projectPrice = override?.customPrice || service.pricePer1000;
    const categoryName = categories.find(c => c.id === service.categoryId)?.name || 'Нет категории';

    return (
        <tr className={cn("group hover:bg-slate-50/50 transition-all", isSelected && "bg-blue-50/30")}>
            <td className="px-6 py-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(service.id)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                />
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col">
                    <div className="flex items-start gap-2">
                        <Link href={`/admin/services/${service.id}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors break-words max-w-[500px] leading-tight mb-1">
                            {override?.customName || service.name}
                        </Link>
                        {service.description && (
                            <button
                                onClick={() => toast.info(service.description, { duration: 5000 })}
                                className="mt-1 p-1 text-slate-300 hover:text-blue-500 transition-colors"
                                title="Описание"
                            >
                                <Info size={14} />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-mono">#{service.id.slice(-6)}</span>
                        <CopyButton value={service.id} label="Full ID" />
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-2">
                    {service.providerMappings && service.providerMappings.length > 0 ? (
                        service.providerMappings.map((m: any) => (
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
                                    <span className="text-[8px] font-bold text-slate-400 uppercase">SKU:</span>
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
                <div className="flex flex-col gap-1.5 items-start">
                    <div className="flex items-center gap-1.5">
                        <Globe size={10} className="text-blue-500 shrink-0" />
                        <span className="text-[10px] font-black text-slate-700 uppercase">
                            {service.platform}
                        </span>
                    </div>
                    <button
                        onClick={() => onMove(service.id)}
                        className="bg-slate-50 border border-slate-100 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-600 outline-none hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer max-w-[200px] text-left truncate flex-1"
                        title={categoryName}
                    >
                        {categoryName}
                    </button>
                </div>
            </td>
            <td className="px-6 py-4">
                <div onClick={() => onToggleStatus(service.id, service.isActive)} className={cn(
                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black uppercase cursor-pointer hover:bg-slate-200 transition-colors",
                    service.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                    <div className={cn("w-1 h-1 rounded-full", service.isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300")} />
                    {service.isActive ? 'Вкл' : 'Откл'}
                </div>
            </td>
            <td className="px-6 py-4">
                <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Закупка:</span>
                        <span className="text-xs font-bold text-slate-600 font-mono italic">
                            {service.lastProviderPrice ? formatPrice(service.lastProviderPrice) : '—'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-500 uppercase whitespace-nowrap">Продажа:</span>
                        <span className="text-base font-black text-slate-900 font-mono">
                            {formatPrice(projectPrice)}
                        </span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-1">
                    <button 
                        onClick={() => onProjectManage(service)}
                        className="p-1.5 text-slate-400 hover:text-emerald-600 transition-colors"
                        title="Управление в проектах"
                    >
                        <Globe size={14} />
                    </button>
                    <Link href={`/admin/services/${service.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors">
                        <Edit size={14} />
                    </Link>
                    <button onClick={() => onDelete(service.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                        <Trash2 size={14} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

// --- WIDGET 3: SERVICES TABLE ---
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
        paginatedServices, currentPage, setCurrentPage, totalPages,
        activeProjectId
    } = useServiceDashboard();
    const { unit } = usePriceDisplay();

    const [projectsModalService, setProjectsModalService] = useState<any>(null);
    const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
    const [categoryModalIds, setCategoryModalIds] = useState<string[]>([]);

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

    const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
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

    const handleBulkMove = async (catId: string, targetIds?: string[]) => {
        const ids = targetIds && targetIds.length > 0 ? targetIds : selectedIds;
        if (ids.length === 0) return;

        const cat = categories.find(c => c.id === catId);
        if (!cat) return;

        const res = await bulkMoveServicesToCategoryAction(ids, catId, cat.platform, cat.categoryType);
        if (res.success) {
            toast.success(ids.length > 1 ? 'Услуги перемещены' : 'Категория обновлена');
            setServices(prev => prev.map(s => ids.includes(s.id) ? { ...s, categoryId: catId, platform: cat.platform, category: cat.categoryType } : s));
            setCategoryModalIds([]);
            if (!targetIds || targetIds.length === 0) {
                setSelectedIds([]);
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
            window.location.reload(); 
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
                icon={Search}
                className="flex-1 min-h-[600px] flex flex-col relative"
                rightElement={
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Страница {currentPage} из {totalPages || 1}
                    </div>
                }
            >
                <div className="overflow-x-auto overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-20 bg-white/90 backdrop-blur-md">
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
                            {paginatedServices.map((s) => (
                                <ServiceRow
                                    key={s.id}
                                    service={s}
                                    isSelected={selectedIds.includes(s.id)}
                                    onToggleSelect={toggleSelect}
                                    onToggleStatus={handleToggleStatus}
                                    onDelete={handleSingleDelete}
                                    onMove={(id) => setCategoryModalIds([id])}
                                    onProjectManage={setProjectsModalService}
                                    overrides={overrides}
                                    categories={categories}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="mt-auto px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between shrink-0">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Найдено: {filteredServices.length}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all active:scale-95"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum = 1;
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
                                            "w-8 h-8 rounded-xl text-[10px] font-black transition-all",
                                            currentPage === pageNum ? "bg-blue-600 text-white shadow-lg" : "bg-white border border-slate-100 text-slate-400 hover:text-blue-600"
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
                            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-all active:scale-95"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

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

                <BulkCategoryModal
                    isOpen={categoryModalIds.length > 0}
                    onClose={() => setCategoryModalIds([])}
                    selectedCount={categoryModalIds.length}
                    categories={categories}
                    onApply={(catId) => handleBulkMove(catId, categoryModalIds)}
                />

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
                                <button onClick={() => setIsPricingModalOpen(true)} className="px-3 py-1.5 bg-blue-500/20 text-blue-50 hover:bg-blue-500 hover:text-white rounded-lg text-[10px] font-black uppercase transition-colors">Цены</button>
                                <div className="h-4 w-px bg-white/20 mx-1" />
                                <button onClick={() => setCategoryModalIds(selectedIds)} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-black uppercase transition-colors">Переместить</button>
                                <button onClick={handleBulkDelete} className="p-2 bg-white/10 hover:bg-rose-500 rounded-lg transition-colors" title="Удалить"><Trash2 size={14} /></button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AdminTableCard>
        </div>
    );
}
