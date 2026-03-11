'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    Search, Settings2,
    Plus, FolderPlus, ArrowRight, ArrowLeft,
    CheckCircle, XCircle, Layers, Sparkles, Loader2
} from 'lucide-react';
import { getIcon } from './icon-selector';
import { smartSearch } from '@/utils/smart-search';
// import { PLATFORMS, PLATFORM_LABELS, CATEGORIES } from '@/services/providers/smart-analyzer.service'; // Not used in this version
import { Platform } from '@/generated/client';
import { CategoryEditor } from './category-editor';
import { ServiceEditorModal } from './service-editor-modal';
import { toggleServiceStatus, updateService, enhanceCategoryDescriptionsAction } from '@/app/admin/services/actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { ServiceLibraryModal } from './service-library-modal';

interface Service {
    id: string;
    name: string;
    description: string;
    pricePer1000: number;
    platform: Platform;
    category: any;
    targetType: string;
    isActive: boolean;
    serviceCategory?: { id: string, name: string };
    providerMappings: any[];
}

interface CatalogDashboardProps {
    categories: any[];
    services: Service[];
    providers: any[];
    allProviderServices?: any[]; // Passed from page
    activeProjectId: string | null;
    initialOverrides: any[];
}

export function CatalogDashboard({
    categories,
    services,
    providers,
    allProviderServices = [],
    activeProjectId,
    initialOverrides
}: CatalogDashboardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    // Editor State
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);
    const [editorPlatform, setEditorPlatform] = useState<Platform>('TELEGRAM');

    // Drill Down State
    const [selectedCategory, setSelectedCategory] = useState<any>(null);

    // Service Editor State
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [inlineEditingPrice, setInlineEditingPrice] = useState<{ id: string, value: string } | null>(null);
    const [isBulkEnhancing, setIsBulkEnhancing] = useState(false);

    const openNewCategory = (platform: Platform) => {
        setEditingCategory(null);
        setEditorPlatform(platform);
        setIsEditorOpen(true);
    };

    const openEditCategory = (e: React.MouseEvent, category: any, platform: Platform) => {
        e.stopPropagation(); // Prevent drill-down
        setEditingCategory(category);
        setEditorPlatform(platform);
        setIsEditorOpen(true);
    };

    const handleCategoryClick = (category: any) => {
        setSelectedCategory(category);
    };

    const handleEditorSuccess = () => {
        router.refresh();
        setIsEditorOpen(false);
    };

    const handleServiceEditorSuccess = () => {
        router.refresh();
        setEditingService(null);
    };

    const handleBulkEnhance = async (categoryId: string) => {
        if (!confirm('Вы уверены? Это действие обновит описания ВСЕХ услуг в этой категории через AI. Это может занять некоторое время.')) return;

        setIsBulkEnhancing(true);
        try {
            const res = await enhanceCategoryDescriptionsAction(categoryId);
            if (res.success) {
                toast.success(`Успешно: ${res.count} услуг обновлено`);
                router.refresh();
            } else {
                toast.error(res.error || 'Ошибка при массовом обновлении');
            }
        } catch (_e) {
            toast.error('Произошла ошибка при запуске AI');
        } finally {
            setIsBulkEnhancing(false);
        }
    };

    const handleToggleStatus = async (serviceId: string, currentStatus: boolean) => {
        setIsUpdating(serviceId);
        try {
            const res = await toggleServiceStatus(serviceId, !currentStatus);
            if (res.success) {
                toast.success('Статус обновлен');
                router.refresh();
            } else {
                toast.error(res.error || 'Ошибка обновления');
            }
        } catch (_error) {
            toast.error('Ошибка сети');
        } finally {
            setIsUpdating(null);
        }
    };

    const handleUpdatePrice = async (serviceId: string, newPrice: number) => {
        setIsUpdating(`${serviceId}-price`);
        try {
            const res = await updateService(serviceId, { pricePer1000: newPrice });
            if (res.success) {
                toast.success('Цена обновлена');
                router.refresh();
            } else {
                toast.error(res.error || 'Ошибка обновления');
            }
        } catch (_error) {
            toast.error('Ошибка сети');
        } finally {
            setIsUpdating(null);
        }
    };

    // Filter services based on active project
    const activeServices = useMemo(() => {
        if (!activeProjectId) return services;

        return services.filter(s => {
            const override = initialOverrides.find(o => o.internalServiceId === s.id && o.projectId === activeProjectId);
            return override?.isActive;
        });
    }, [services, initialOverrides, activeProjectId]);

    const existingIds = useMemo(() => activeServices.map(s => s.id), [activeServices]);

    // Grouping Logic
    const platformGroups = Object.keys(Platform).map(p => {
        const platformCats = categories.filter(c => c.platform === p);
        const platformServices = activeServices.filter(s => s.platform === p);

        // Services are uncategorized if NO category in this project matches their type
        const uncategorizedServices = platformServices.filter(s => {
            const matchingCat = platformCats.find(c =>
                c.platform === s.platform &&
                (c.categoryType === s.category || c.category === s.category)
            );
            return !matchingCat;
        });

        return {
            platform: p as Platform,
            categories: platformCats,
            totalServices: platformServices.length,
            uncategorizedCount: uncategorizedServices.length
        };
    }).filter(g => selectedPlatform === 'ALL' || g.platform === selectedPlatform);

    // --- RENDER FUNCTIONS ---

    // 1. Service List View (Drill Down)
    if (selectedCategory) {
        // Filter by Enum Match instead of strict ID match
        const categoryServices = services.filter(s =>
            s.platform === selectedCategory.platform &&
            s.category === (selectedCategory.categoryType || selectedCategory.category) // Handle both naming conventions if needed
        );

        return (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-black text-slate-800">{selectedCategory.name}</h2>
                            <div className="text-slate-400">{getIcon(selectedCategory.icon)}</div>
                        </div>
                        <p className="text-sm text-slate-500">
                            {selectedCategory.platform} • {selectedCategory.targetType} • {categoryServices.length} Услуг
                        </p>
                    </div>
                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={() => handleBulkEnhance(selectedCategory.id)}
                            disabled={isBulkEnhancing}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all border border-indigo-100 disabled:opacity-50"
                            title="Улучшить все описания в этой категории через AI"
                        >
                            {isBulkEnhancing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                            AI Описания
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Статус</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Название услуги</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Цена / 1k</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider">Провайдеры</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase text-slate-400 tracking-wider text-right">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {categoryServices.map(service => (
                                <tr key={service.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleToggleStatus(service.id, service.isActive)}
                                            disabled={isUpdating === service.id}
                                            className={cn(
                                                "flex items-center gap-1.5 w-fit px-2 py-1 rounded-md transition-all active:scale-95 disabled:opacity-50",
                                                service.isActive
                                                    ? "text-emerald-600 bg-emerald-50 hover:bg-emerald-100"
                                                    : "text-slate-400 bg-slate-100 hover:bg-slate-200"
                                            )}
                                        >
                                            {isUpdating === service.id ? (
                                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : service.isActive ? (
                                                <CheckCircle size={12} />
                                            ) : (
                                                <XCircle size={12} />
                                            )}
                                            <span className="text-[10px] font-bold">
                                                {service.isActive ? 'Активен' : 'Выключен'}
                                            </span>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link
                                            href={`/admin/services/${service.id}`}
                                            className="font-black text-slate-800 text-sm hover:text-blue-600 transition-colors block leading-tight"
                                        >
                                            {service.name}
                                        </Link>
                                        <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                                            <span className="font-mono bg-slate-50 px-1 rounded border border-slate-100 uppercase tracking-tighter">ID: {service.id}</span>
                                            {service.targetType !== 'ALL' && (
                                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase">{service.targetType}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {inlineEditingPrice?.id === service.id ? (
                                            <input
                                                autoFocus
                                                type="number"
                                                step="0.01"
                                                className="w-24 px-3 py-1.5 bg-white border-2 border-blue-500 rounded-xl text-sm font-black outline-none shadow-lg shadow-blue-500/10"
                                                defaultValue={service.pricePer1000}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        const val = parseFloat((e.target as HTMLInputElement).value);
                                                        if (!isNaN(val)) handleUpdatePrice(service.id, val);
                                                        setInlineEditingPrice(null);
                                                    } else if (e.key === 'Escape') {
                                                        setInlineEditingPrice(null);
                                                    }
                                                }}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val) && val !== service.pricePer1000) handleUpdatePrice(service.id, val);
                                                    setInlineEditingPrice(null);
                                                }}
                                            />
                                        ) : (
                                            <div
                                                onClick={() => setInlineEditingPrice({ id: service.id, value: String(service.pricePer1000) })}
                                                className="font-black text-slate-900 cursor-pointer hover:bg-slate-100 px-2 py-1 rounded-lg transition-all text-base tracking-tighter w-fit"
                                            >
                                                {service.pricePer1000.toFixed(2)}₽
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1.5">
                                            {service.providerMappings.map((m, i) => (
                                                <div
                                                    key={i}
                                                    className={`px-2 py-1 rounded-lg border flex items-center gap-2 transition-all ${m.isActive
                                                        ? 'bg-white border-slate-200 shadow-sm'
                                                        : 'bg-slate-50 border-slate-100 opacity-50 grayscale'
                                                        }`}
                                                    title={`Provider: ${m.provider?.name} (ID: ${m.providerServiceId})`}
                                                >
                                                    <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px] font-black uppercase">
                                                        {m.provider?.name?.[0] || '?'}
                                                    </div>
                                                    <span className="text-[10px] font-mono font-bold text-slate-600">#{m.providerServiceId}</span>
                                                    {m.priority === 1 && m.isActive && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    )}
                                                </div>
                                            ))}
                                            {service.providerMappings.length === 0 && (
                                                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest italic">Нет привязок</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => setEditingService(service)}
                                            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {categoryServices.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                        Услуг в этой категории пока нет.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {editingService && (
                    <ServiceEditorModal
                        isOpen={!!editingService}
                        service={editingService}
                        categories={categories}
                        providers={providers}
                        allProviderServices={allProviderServices}
                        onClose={() => setEditingService(null)}
                        onSuccess={handleServiceEditorSuccess}
                    />
                )}
            </div>
        );
    }

    // 2. Dashboard View
    const PlatformCard = ({ group }: { group: any }) => (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow relative">
            <div className={`h-2 w-full ${getPlatformColor(group.platform)}`} />
            <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                        {group.platform}
                    </h3>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-lg">
                        {group.totalServices} Услуг
                    </span>
                </div>

                <div className="space-y-2">
                    {group.categories.length === 0 && group.uncategorizedCount === 0 && (
                        <div className="text-center py-4 text-slate-400 text-xs italic">
                            Платформа пуста
                        </div>
                    )}

                    {group.categories
                        .filter((c: any) => smartSearch(searchTerm, c.name))
                        .map((cat: any) => {
                            // Enum-based matching for counts
                            const count = services.filter(s =>
                                s.platform === cat.platform &&
                                s.category === (cat.categoryType || cat.category)
                            ).length;

                            return (
                                <div
                                    key={cat.id}
                                    onClick={() => handleCategoryClick(cat)}
                                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer group transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="text-slate-400 group-hover:text-blue-500 transition-colors">
                                            {getIcon(cat.icon)}
                                        </div>
                                        <div>
                                            <div className="text-xs font-bold text-slate-700">{cat.name}</div>
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{cat.targetType}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                                            {count}
                                        </span>
                                        {/* Edit Button - Stop Propagation */}
                                        <button
                                            onClick={(e) => openEditCategory(e, cat, group.platform)}
                                            className="p-1 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Settings2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                    {group.uncategorizedCount > 0 && (
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-100 border-dashed">
                            <div className="flex items-center gap-3">
                                <FolderPlus size={18} className="text-amber-500" />
                                <div className="text-xs font-bold text-amber-700">Без категории</div>
                            </div>
                            <span className="text-[10px] font-black text-amber-600 bg-white/50 px-2 py-0.5 rounded-md">
                                {group.uncategorizedCount}
                            </span>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                    <button
                        onClick={() => openNewCategory(group.platform)}
                        className="text-[10px] font-black uppercase text-slate-400 hover:text-blue-600 flex items-center gap-1 group transition-colors"
                    >
                        <Plus size={12} /> Добавить категорию
                    </button>
                    <button
                        onClick={() => router.push(`${pathname}?tab=projects&platform=${group.platform}`, { scroll: false })}
                        className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 flex items-center gap-1 group"
                    >
                        Управлять <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Project Context Banner */}
            {activeProjectId && (
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl shadow-slate-900/20 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600 rounded-2xl">
                            <Layers size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase italic tracking-tight">Режим управления проектом</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                Вы настраиваете каталог для платформы ID: <span className="text-blue-400 font-mono">{activeProjectId}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsLibraryOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95 shrink-0"
                    >
                        <Plus size={16} /> Добавить из библиотеки
                    </button>
                </div>
            )}

            {/* Header / Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-xl flex-1 min-w-0">
                    <button
                        onClick={() => setSelectedPlatform('ALL')}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${selectedPlatform === 'ALL' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Все
                    </button>
                    {Object.keys(Platform).map(p => (
                        <button
                            key={p}
                            onClick={() => setSelectedPlatform(p as Platform)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all ${selectedPlatform === p ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto">
                    <div className="relative flex-1 lg:flex-initial">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Поиск категорий..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 ring-blue-500/10 outline-none w-full lg:w-64"
                        />
                    </div>
                    <button
                        onClick={() => openNewCategory('TELEGRAM')}
                        className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20 active:scale-95"
                    >
                        <Plus size={20} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {platformGroups.map(group => (
                    <PlatformCard key={group.platform} group={group} />
                ))}
            </div>

            {/* Editor Modal */}
            {isEditorOpen && (
                <CategoryEditor
                    category={editingCategory}
                    platform={editorPlatform}
                    onClose={() => setIsEditorOpen(false)}
                    onSuccess={handleEditorSuccess}
                />
            )}

            {/* Library Modal */}
            {isLibraryOpen && activeProjectId && (
                <ServiceLibraryModal
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                    allServices={services}
                    activeProjectId={activeProjectId}
                    existingServiceIds={existingIds}
                />
            )}
        </div>
    );
}

function getPlatformColor(platform: string) {
    switch (platform) {
        case 'TELEGRAM': return 'bg-blue-400';
        case 'INSTAGRAM': return 'bg-pink-500';
        case 'VK': return 'bg-blue-600';
        case 'YOUTUBE': return 'bg-red-500';
        case 'TIKTOK': return 'bg-black';
        default: return 'bg-slate-400';
    }
}
