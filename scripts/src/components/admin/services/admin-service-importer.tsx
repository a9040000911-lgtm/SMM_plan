'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search, CheckSquare, Square, Download,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getProviderServicesForImport, importProviderServicesAction } from '@/app/admin/services/actions';

import { Platform } from '@/generated/client';

interface AdminServiceImporterProps {
    providers: any[];
    categories: any[];
}

export function AdminServiceImporter({ providers, categories }: AdminServiceImporterProps) {
    const router = useRouter();
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [providerServices, setProviderServices] = useState<any[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);

    // Selection state
    const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());

    // Filter state
    const [searchTerm, setSearchTerm] = useState('');

    // Import Settings
    const [targetCategory, setTargetCategory] = useState<string>('');
    const [targetPlatform, setTargetPlatform] = useState<Platform>('TELEGRAM');
    const [targetType, setTargetType] = useState<string>('POST');
    const [priceMultiplier, setPriceMultiplier] = useState<number>(1.5);

    const [isImporting, setIsImporting] = useState(false);

    // Fetch services when provider changes
    useEffect(() => {
        if (selectedProviderId) {
            fetchServices(selectedProviderId);
        } else {
            setProviderServices([]);
        }
    }, [selectedProviderId]);

    const fetchServices = async (providerId: string) => {
        setIsLoadingServices(true);
        try {
            const data = await getProviderServicesForImport(providerId);
            setProviderServices(data);
            setSelectedServiceIds(new Set()); // Reset selection
        } catch (_error) {
            toast.error('Не удалось загрузить услуги');
        } finally {
            setIsLoadingServices(false);
        }
    };

    const toggleSelection = (id: number) => {
        const newSet = new Set(selectedServiceIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedServiceIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedServiceIds.size === filteredServices.length) {
            setSelectedServiceIds(new Set());
        } else {
            const newSet = new Set(filteredServices.map(s => s.id));
            setSelectedServiceIds(newSet);
        }
    };

    const handleImport = async () => {
        if (selectedServiceIds.size === 0) return;
        if (!targetCategory) {
            toast.error('Please select a target category');
            return;
        }

        setIsImporting(true);

        const itemsToImport = providerServices
            .filter(s => selectedServiceIds.has(s.id))
            .map(s => ({
                providerId: s.providerId,
                serviceId: s.id,
                name: s.name,
                rawPrice: Number(s.rawPrice)
            }));

        const res = await importProviderServicesAction(itemsToImport, {
            categoryId: targetCategory,
            platform: targetPlatform,
            targetType: targetType,
            priceMultiplier: priceMultiplier
        });

        setIsImporting(false);

        if (res.success) {
            toast.success(`Успешно импортировано ${res.count} услуг`);
            setSelectedServiceIds(new Set()); // Clear selection
            router.refresh();
        } else {
            toast.error(res.error || 'Ошибка импорта');
        }
    };

    const filteredServices = providerServices.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex h-[calc(100vh-200px)] gap-6">
            {/* LEFT: Provider & Filters */}
            <div className="w-64 flex flex-col gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-2">1. Выберите провайдера</h3>
                <div className="space-y-1 overflow-y-auto flex-1 pr-2">
                    {providers.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setSelectedProviderId(p.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all ${selectedProviderId === p.id
                                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                                : 'text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* MIDDLE: Service List */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 ring-blue-500/10 outline-none"
                            placeholder="Поиск услуг провайдера..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>Выбрано: {selectedServiceIds.size}</span>
                        {filteredServices.length > 0 && (
                            <button onClick={toggleSelectAll} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                                {selectedServiceIds.size === filteredServices.length ? 'Снять выделение' : 'Выбрать всё'}
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {isLoadingServices ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">Загрузка услуг...</div>
                    ) : filteredServices.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                            {selectedProviderId ? 'Услуги не найдены' : 'Выберите провайдера для начала'}
                        </div>
                    ) : (
                        filteredServices.map(service => (
                            <div
                                key={service.id}
                                className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedServiceIds.has(service.id)
                                    ? 'bg-blue-50/50 border-blue-200 shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-blue-100'
                                    }`}
                                onClick={() => toggleSelection(service.id)}
                            >
                                <div className={`flex-shrink-0 ${selectedServiceIds.has(service.id) ? 'text-blue-600' : 'text-slate-300'}`}>
                                    {selectedServiceIds.has(service.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-slate-700 truncate">{service.name}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">ID: {service.id}</span>
                                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                            $ {Number(service.rawPrice).toFixed(4)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: Import Settings */}
            <div className="w-80 flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm h-fit">
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2">2. Настройки импорта</h3>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Категория назначения</label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-300"
                            value={targetCategory}
                            onChange={(e) => setTargetCategory(e.target.value)}
                        >
                            <option value="">Выберите категорию...</option>
                            {categories.map(c => (
                                <option key={c.id} value={c.id}>{c.platform} | {c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Платформа</label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-300"
                            value={targetPlatform}
                            onChange={(e) => setTargetPlatform(e.target.value as Platform)}
                        >
                            {Object.keys(Platform).map(p => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-slate-500">Тип цели</label>
                        <select
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-blue-300"
                            value={targetType}
                            onChange={(e) => setTargetType(e.target.value)}
                        >
                            <option value="POST">Пост / Публикация</option>
                            <option value="CHANNEL">Канал / Группа</option>
                            <option value="PROFILE">Профиль / Аккаунт</option>
                            <option value="VIDEO">Видео / Reels</option>
                            <option value="STORY">Сторис</option>
                        </select>
                    </div>

                    <div className="space-y-1 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                        <label className="text-[10px] font-black uppercase text-blue-400">Наценка цены (x)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                step="0.1"
                                min="1"
                                className="w-20 p-2 bg-white border border-blue-200 rounded-lg text-sm font-black text-blue-600 outline-none focus:ring-2 ring-blue-500/20"
                                value={priceMultiplier}
                                onChange={(e) => setPriceMultiplier(Number(e.target.value))}
                            />
                            <div className="text-[10px] text-slate-400 leading-tight">
                                Пример: База $1.00 * 1.5 = <b className="text-slate-600">$1.50</b>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 mt-2">
                    <button
                        onClick={handleImport}
                        disabled={selectedServiceIds.size === 0 || !targetCategory || isImporting}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                        {isImporting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Download size={16} />
                                Импорт {selectedServiceIds.size > 0 ? `${selectedServiceIds.size} элм.` : ''}
                            </>
                        )}
                    </button>
                    {(!targetCategory && selectedServiceIds.size > 0) && (
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-rose-500 font-bold bg-rose-50 px-3 py-2 rounded-lg border border-rose-100">
                            <AlertCircle size={12} />
                            Сначала выберите категорию назначения
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
