'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Search, CheckSquare, Download
} from "lucide-react";
import { toast } from 'sonner';
import { getProviderServicesForImport, smartImportProviderServicesAction } from '@/app/admin/services/actions';
// import { Platform } from '@/generated/client'; // Unused in this file
import { detectServiceDetails, DetectionResult } from '@/lib/services/smart-detector';
import { smartSearch } from '@/utils/smart-search';

interface SmartServiceImporterProps {
    providers: any[];
    categories: any[];
}

export function SmartServiceImporter({ providers, categories: _categories }: SmartServiceImporterProps) {
    const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);
    const [providerServices, setProviderServices] = useState<any[]>([]);
    const [isLoadingServices, setIsLoadingServices] = useState(false);
    const [selectedServiceIds, setSelectedServiceIds] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isImporting, setIsImporting] = useState(false);

    // Import Settings
    const [priceMultiplier, setPriceMultiplier] = useState<number>(1.5);

    // Detections cache
    const [detections, setDetections] = useState<Record<number, DetectionResult>>({});

    useEffect(() => {
        if (selectedProviderId) {
            fetchServices(selectedProviderId);
        }
    }, [selectedProviderId]);

    const fetchServices = async (providerId: string) => {
        setIsLoadingServices(true);
        try {
            const data = await getProviderServicesForImport(providerId);
            setProviderServices(data);

            // Run smart detection on all
            const newDetections: Record<number, DetectionResult> = {};
            data.forEach((s: any) => {
                newDetections[s.id] = detectServiceDetails(s.name);
            });
            setDetections(newDetections);
            setSelectedServiceIds(new Set());
        } catch (_error) {
            toast.error('Не удалось загрузить услуги');
        } finally {
            setIsLoadingServices(false);
        }
    };

    const filteredServices = useMemo(() => {
        if (!searchTerm) return providerServices;
        return providerServices.filter(s =>
            smartSearch(searchTerm, `${s.id} ${s.name}`)
        );
    }, [providerServices, searchTerm]);

    const handleImport = async () => {
        if (selectedServiceIds.size === 0) return;
        setIsImporting(true);

        try {
            const selectedItems = providerServices
                .filter(s => selectedServiceIds.has(s.id))
                .map(s => ({
                    providerId: s.providerId,
                    serviceId: s.id,
                    name: s.name,
                    rawPrice: Number(s.rawPrice),
                    detection: detections[s.id]
                }));

            const res = await smartImportProviderServicesAction(selectedItems, {
                priceMultiplier: priceMultiplier
            });

            if (res.success) {
                toast.success(`Успешно импортировано ${res.count} услуг`);
                setSelectedServiceIds(new Set());
            } else {
                toast.error(res.error || 'Ошибка импорта');
            }
        } catch (error: any) {
            toast.error('Произошла ошибка при импорте');
            console.error(error);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-250px)] gap-4">
            {/* Header & Provider Select */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Источник</label>
                    <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 ring-blue-500/10"
                        value={selectedProviderId || ''}
                        onChange={(e) => setSelectedProviderId(e.target.value)}
                    >
                        <option value="">Выберите провайдера...</option>
                        {providers.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex-1 relative">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Поиск</label>
                    <Search className="absolute left-3 bottom-2.5 text-slate-400" size={14} />
                    <input
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 ring-blue-500/10"
                        placeholder="ID или название..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="w-40 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <label className="text-[10px] font-black uppercase text-blue-400 block mb-1">Наценка (x)</label>
                    <input
                        type="number"
                        step="0.1"
                        min="1"
                        className="w-full p-1 bg-white border border-blue-200 rounded-lg text-sm font-black text-blue-600 outline-none focus:ring-2 ring-blue-500/20"
                        value={priceMultiplier}
                        onChange={(e) => setPriceMultiplier(Number(e.target.value))}
                    />
                </div>

                <div className="pt-5">
                    <button
                        onClick={handleImport}
                        disabled={selectedServiceIds.size === 0 || isImporting}
                        className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {isImporting ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Download size={16} />}
                        Импорт ({selectedServiceIds.size})
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 px-6 py-3 flex items-center text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                    <div className="w-10">#</div>
                    <div className="flex-1">Услуга Провайдера</div>
                    <div className="w-24 text-center">Цена (база)</div>
                    <div className="w-32">Платформа</div>
                    <div className="w-32">Категория</div>
                    <div className="w-32">Тип Ссылки</div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
                    {isLoadingServices ? (
                        <div className="p-20 text-center text-slate-400 text-xs">Загрузка...</div>
                    ) : filteredServices.length === 0 ? (
                        <div className="p-20 text-center text-slate-400 text-xs">Нет данных</div>
                    ) : (
                        filteredServices.map(service => {
                            const det = detections[service.id];
                            return (
                                <div
                                    key={service.id}
                                    className={`flex items-center px-6 py-3 hover:bg-blue-50/30 transition-colors group ${selectedServiceIds.has(service.id) ? 'bg-blue-50/50' : ''}`}
                                    onClick={() => {
                                        const next = new Set(selectedServiceIds);
                                        if (next.has(service.id)) next.delete(service.id);
                                        else next.add(service.id);
                                        setSelectedServiceIds(next);
                                    }}
                                >
                                    <div className="w-10 flex-shrink-0">
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedServiceIds.has(service.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 group-hover:border-blue-300'}`}>
                                            {selectedServiceIds.has(service.id) && <CheckSquare size={12} />}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="text-xs font-bold text-slate-700 truncate">{service.name}</div>
                                        <input
                                            className="w-full mt-1 px-2 py-0.5 bg-blue-50/50 border border-blue-100 rounded text-[10px] font-bold text-blue-700 focus:bg-white outline-none"
                                            value={det?.suggestedName || ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setDetections(prev => ({
                                                    ...prev,
                                                    [service.id]: { ...prev[service.id], suggestedName: val }
                                                }));
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            placeholder="Suggested name..."
                                        />
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {service.id}</div>
                                    </div>
                                    <div className="w-24 text-center font-mono text-[11px] font-bold text-emerald-600">
                                        ${Number(service.rawPrice).toFixed(4)}
                                    </div>

                                    {/* Smart Detections */}
                                    <div className="w-32 px-1">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${det?.platform === 'OTHER' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'}`}>
                                            {det?.platform}
                                        </span>
                                    </div>
                                    <div className="w-32 px-1">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${det?.category === 'OTHER' ? 'bg-slate-100 text-slate-400' : 'bg-purple-100 text-purple-600'}`}>
                                            {det?.category}
                                        </span>
                                    </div>
                                    <div className="w-32 px-1">
                                        <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-600">
                                            {det?.targetType}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
