'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Sparkles, RefreshCw, Zap, ShieldCheck, DownloadCloud } from 'lucide-react';
import { smartImportFromProviderAction } from '@/app/admin/services/actions';
import { toast } from 'sonner';

interface SmartImportManagerProps {
    projectId: string;
    providers: any[];
}

export function SmartImportManager({ projectId, providers }: SmartImportManagerProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [filters, setFilters] = useState({ include: '', exclude: '' });

    const handleImport = async (providerId: string) => {
        setIsLoading(providerId);
        try {
            const res = await smartImportFromProviderAction(providerId, projectId, filters);
            if (res.success) {
                toast.success(`Импортировано ${res.count} услуг. Описания подтянуты автоматически.`);
            } else {
                toast.error('Ошибка импорта: ' + res.error);
            }
        } catch (_e) {
            toast.error('Произошла ошибка');
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-200">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                    <Sparkles size={120} />
                </div>

                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-4xl font-black tracking-tighter uppercase italic">Smart Import Engine</h2>
                    </div>
                    <p className="text-indigo-100 max-w-xl font-medium leading-relaxed">
                        Этот режим позволяет мгновенно наполнить проект услугами. Система автоматически проанализирует API провайдера,
                        создаст категории и перенесет описания услуг.
                    </p>

                    {/* Filter Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-indigo-200 pl-1 tracking-widest">Включить только если название содержит (через запятую)</label>
                            <input
                                value={filters.include}
                                onChange={(e) => setFilters({ ...filters, include: e.target.value })}
                                placeholder="real, fast, HQ..."
                                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder:text-indigo-300 focus:bg-white/20 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-indigo-200 pl-1 tracking-widest">Исключить если название содержит</label>
                            <input
                                value={filters.exclude}
                                onChange={(e) => setFilters({ ...filters, exclude: e.target.value })}
                                placeholder="bot, drop, slow..."
                                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-xs font-bold text-white placeholder:text-indigo-300 focus:bg-white/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            <Zap size={14} className="text-amber-400" /> Auto-Descriptions
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                            <ShieldCheck size={14} className="text-emerald-400" /> Global Catalog Sync
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {providers.map((provider) => (
                    <div key={provider.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-8 space-y-6 shadow-sm hover:border-indigo-200 transition-all group">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-xl font-black text-slate-800 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors">{provider.name}</h3>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{provider.type} API Provider</div>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                                <DownloadCloud size={24} className="text-slate-400 group-hover:text-indigo-500" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                Будут импортированы все активные услуги данного провайдера. Наценка по умолчанию: <span className="text-emerald-600 font-black">+50%</span>.
                            </p>
                        </div>

                        <button
                            onClick={() => handleImport(provider.id)}
                            disabled={!!isLoading}
                            className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${isLoading === provider.id
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                                }`}
                        >
                            {isLoading === provider.id ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                            {isLoading === provider.id ? 'Синхронизация...' : 'Запустить импорт'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
