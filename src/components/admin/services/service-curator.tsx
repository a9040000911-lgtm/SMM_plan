'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Download, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getProviderServicesAction, ignoreServicesAction, importServicesAction, ServiceFilter } from '@/app/admin/services/curator/actions';

import { 
    PLATFORMS, 
    CATEGORIES, 
    PLATFORM_LABELS 
} from '@/services/providers/smart-analyzer.logic';
import { getActivityLabel } from '@/utils/order-utils';

export function ServiceCurator({ providers }: { providers: any[] }) {
    const [filter, setFilter] = useState<ServiceFilter>({
        page: 1,
        limit: 50,
        showIgnored: false,
        platform: 'TELEGRAM' // Default
    });

    const [services, setServices] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set()); // Key: "providerName:id"

    // Bulk Import State
    const [markup, setMarkup] = useState(200);
    const [targetType, setTargetType] = useState('CHANNEL');
    const [isImporting, setIsImporting] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getProviderServicesAction(filter);
            setServices(res.items);
            setTotal(res.total);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSelect = (providerName: string, id: number) => {
        const key = `${providerName}:${id}`;
        const newSelected = new Set(selected);
        if (newSelected.has(key)) newSelected.delete(key);
        else newSelected.add(key);
        setSelected(newSelected);
    };

    const handleSelectAll = () => {
        if (selected.size === services.length) {
            setSelected(new Set());
        } else {
            const newSelected = new Set<string>();
            services.forEach(s => newSelected.add(`${s.providerName}:${s.id}`));
            setSelected(newSelected);
        }
    };

    const handleImport = async () => {
        if (!confirm(`Import ${selected.size} services with ${markup}% markup?`)) return;

        setIsImporting(true);
        const toImport = services
            .filter(s => selected.has(`${s.providerName}:${s.id}`))
            .map(s => ({ id: s.id, providerName: s.providerName, name: s.name, rawPrice: Number(s.rawPrice) }));

        const res = await importServicesAction(toImport, {
            markupPercent: markup,
            platform: filter.platform || 'OTHER',
            category: filter.category || 'OTHER',
            targetType
        });

        if (res.success) {
            alert(`Successfully imported ${res.importedCount} services!`);
            setSelected(new Set());
            loadData();
        }
        setIsImporting(false);
    };

    const handleIgnore = async () => {
        if (!confirm(`Hide ${selected.size} services?`)) return;

        // Group by provider
        const toIgnore: Record<string, number[]> = {};
        selected.forEach(key => {
            const [pName, idStr] = key.split(':');
            if (!toIgnore[pName]) toIgnore[pName] = [];
            toIgnore[pName].push(Number(idStr));
        });

        for (const [pName, ids] of Object.entries(toIgnore)) {
            await ignoreServicesAction(ids, pName);
        }

        setSelected(new Set());
        loadData();
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-140px)]">
            {/* Sidebar Filters */}
            <div className="xl:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 space-y-6 overflow-y-auto h-full">
                <div>
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Filter size={18} /> Filters
                    </h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Search</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 ring-blue-100 outline-none"
                                    placeholder="Keywords..."
                                    value={filter.search || ''}
                                    onChange={e => setFilter(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Provider</label>
                            <select
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                                value={filter.provider || ''}
                                onChange={e => setFilter(prev => ({ ...prev, provider: e.target.value || undefined, page: 1 }))}
                            >
                                <option value="">All Providers</option>
                                {providers.map(p => (
                                    <option key={p.name} value={p.name}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Platform</label>
                            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                {PLATFORMS.map(p => (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setFilter(prev => ({ ...prev, platform: p, page: 1 }))}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-left truncate ${filter.platform === p ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                        title={PLATFORM_LABELS[p] || p}
                                    >
                                        {PLATFORM_LABELS[p] || p}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                            <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                                {CATEGORIES.map(c => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setFilter(prev => ({ ...prev, category: c === filter.category ? undefined : c, page: 1 }))}
                                        className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${filter.category === c ? 'bg-emerald-500 text-white' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                                    >
                                        {getActivityLabel(c)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Download size={18} /> Bulk Actions
                    </h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Target Type</label>
                            <select
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium"
                                value={targetType}
                                onChange={e => setTargetType(e.target.value)}
                            >
                                <option value="CHANNEL">Channel</option>
                                <option value="POST">Post</option>
                                <option value="GROUP">Group</option>
                                <option value="BOT">Bot</option>
                                <option value="STORY">Story</option>
                                <option value="VIDEO">Video</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Markup %</label>
                            <input
                                type="number"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                                value={markup}
                                onChange={e => setMarkup(Number(e.target.value))}
                            />
                        </div>

                        <button
                            disabled={selected.size === 0 || isImporting}
                            onClick={handleImport}
                            className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-slate-800 transition-colors"
                        >
                            {isImporting ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                            Import ({selected.size})
                        </button>

                        <button
                            disabled={selected.size === 0}
                            onClick={handleIgnore}
                            className="w-full py-3 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-rose-100 transition-colors"
                        >
                            <Check size={16} /> Hide Selected
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="xl:col-span-3 flex flex-col h-full space-y-4">
                {/* Checkbox Header */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={selected.size === services.length && services.length > 0}
                            onChange={handleSelectAll}
                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-600">Select All on Page ({services.length})</span>
                    </div>
                    <div className="text-sm font-bold text-slate-400">
                        Total Unlinked: {total}
                    </div>
                </div>

                {/* Grid List */}
                <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-slate-200 p-2 space-y-1">
                    {loading ? (
                        <div className="h-full flex items-center justify-center text-slate-400">
                            <Loader2 className="animate-spin mb-2" size={32} />
                        </div>
                    ) : (
                        services.map(s => {
                            const isSelected = selected.has(`${s.providerName}:${s.id}`);
                            return (
                                <div
                                    key={`${s.providerName}:${s.id}`}
                                    className={`p-3 rounded-xl border transition-all flex items-center gap-4 group ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => handleSelect(s.providerName, s.id)}
                                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-black uppercase md:tracking-wider">{s.providerName}</span>
                                            <span className="text-[10px] font-mono text-slate-400">ID: {s.id}</span>
                                        </div>
                                        <div className="text-sm font-bold text-slate-800 truncate" title={s.name}>{s.name}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-black text-emerald-600">{Number(s.rawPrice).toFixed(4)}₽</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Cost</div>
                                    </div>
                                    <div className="text-right pl-4 border-l border-slate-100">
                                        <div className="text-sm font-black text-blue-600">{(Number(s.rawPrice) * (1 + markup / 100)).toFixed(2)}₽</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Sell</div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <button
                        disabled={filter.page === 1}
                        onClick={() => setFilter(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                        className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-bold text-slate-600">Page {filter.page}</span>
                    <button
                        disabled={(filter.page || 1) * (filter.limit || 50) >= total}
                        onClick={() => setFilter(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                        className="p-2 hover:bg-slate-100 rounded-lg disabled:opacity-50"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}


