'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Trash2, CheckCircle2, XCircle, Eye, Sparkles, AlertTriangle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { unlinkProviderService, updateProviderMapping, syncProviderMappingAction } from '@/app/admin/services/actions';
import { toast } from 'sonner';
import { usePriceDisplay } from '../services/price-display-context';

import { SerializedMapping } from '@/types/admin';

export function MappingList({
    _internalServiceId,
    mappings,
    internalPrice
}: {
    _internalServiceId: string,
    mappings: SerializedMapping[],
    internalPrice: number
}) {
    const [isBusy, setIsBusy] = useState<string | null>(null);
    const [localMappings, setLocalMappings] = useState<SerializedMapping[]>(mappings);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const { formatPrice, unit } = usePriceDisplay();

    // Sync local state when props change
    React.useEffect(() => {
        setLocalMappings(mappings);
    }, [mappings]);

    const handleUnlink = async (mappingId: string, providerName: string) => {
        if (!confirm(`Удалить привязку к ${providerName}?`)) return;

        setIsBusy(mappingId);
        try {
            const res = await unlinkProviderService(mappingId);
            if (res.success) {
                toast.success('Привязка удалена');
            } else {
                toast.error(res.error || 'Ошибка удаления');
            }
        } catch (_e) {
            toast.error('Ошибка при удалении привязки');
        } finally {
            setIsBusy(null);
        }
    };

    const handleUpdate = async (mappingId: string, data: Partial<SerializedMapping>) => {
        setIsBusy(mappingId);
        try {
            const res = await updateProviderMapping(mappingId, data);
            if (res.success) {
                toast.success('Настройки привязки обновлены');
            } else {
                toast.error(res.error || 'Ошибка обновления');
            }
        } catch (_e) {
            toast.error('Ошибка сети');
        } finally {
            setIsBusy(null);
        }
    };

    const handleManualSync = async (mappingId: string) => {
        setIsBusy(`sync-${mappingId}`);
        try {
            const res = await syncProviderMappingAction(mappingId);
            if (res.success) {
                toast.success('Цена и данные обновлены из API');
            } else {
                toast.error(res.error || 'Ошибка синхронизации');
            }
        } catch (_e) {
            toast.error('Ошибка сети');
        } finally {
            setIsBusy(null);
        }
    };

    const updateLocalField = (id: string, field: keyof SerializedMapping, value: any) => {
        setLocalMappings(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
    };

    if (localMappings.length === 0) {
        return (
            <div className="p-12 text-center">
                <div className="inline-flex p-4 bg-slate-50 rounded-full mb-4">
                    <ArrowUpCircle size={32} className="text-slate-200" />
                </div>
                <p className="text-slate-400 text-sm italic">
                    Нет привязанных провайдеров. <br />
                    Добавьте поставщика справа, чтобы заказы выполнялись автоматически.
                </p>
            </div>
        );
    }

    // Sort by priority locally for better UX
    const sortedMappings = [...localMappings].sort((a, b) => a.priority - b.priority);

    return (
        <div className="divide-y divide-slate-100">
            {sortedMappings.map((m) => {
                const providerName = m.provider?.name || 'Unknown';
                const busyKey = m.id;
                const isLoading = isBusy === busyKey;
                const isSyncing = isBusy === `sync-${m.id}`;

                const cost = Number(m.providerService?.rawPrice || 0);
                const profit = internalPrice - cost;
                const margin = cost > 0 ? (profit / cost) * 100 : 100;
                const isExpanded = expandedId === m.id;

                return (
                    <div key={m.id} className={`flex flex-col transition-all ${!m.isActive ? 'opacity-60 grayscale bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                        <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-4 flex-1">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs uppercase shadow-sm border ${m.isActive ? 'bg-white text-blue-600 border-blue-100' : 'bg-slate-100 text-slate-400 border-slate-200'
                                    }`}>
                                    {providerName.substring(0, 2)}
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{providerName}</span>
                                        {m.priority === 1 && m.isActive && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded-full tracking-widest border border-blue-200 animate-pulse-subtle">
                                                <Sparkles size={8} />
                                                Источник цены
                                            </div>
                                        )}
                                        {m.priority !== 1 && m.isActive && (
                                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded tracking-widest">Резерв</span>
                                        )}
                                        {profit < 0 && m.isActive && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-500 text-white text-[8px] font-black uppercase rounded-full tracking-widest animate-bounce-subtle shadow-lg shadow-rose-500/20">
                                                <AlertTriangle size={8} />
                                                Убыточно
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 font-bold truncate max-w-[250px]" title={m.providerService?.name}>
                                        {m.providerService?.name || 'Service data missing'}
                                    </div>
                                    <div className="text-[9px] text-slate-300 font-mono mt-0.5">ID: {m.providerServiceId}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 lg:gap-8 bg-white/50 md:bg-transparent p-3 md:p-0 rounded-xl border md:border-none border-slate-100">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Приоритет</label>
                                    <input
                                        type="number"
                                        value={m.priority}
                                        onChange={(e) => updateLocalField(m.id, 'priority', parseInt(e.target.value || '1'))}
                                        onBlur={() => handleUpdate(m.id, { priority: m.priority })}
                                        className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-center focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                </div>

                                <div className="text-right min-w-[120px]">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">ROI / ПРИБЫЛЬ {unit === 1 ? '(1 шт)' : ''}</label>
                                    <div className={`text-sm font-black tracking-tighter ${profit < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {profit > 0 ? '+' : ''}{Math.round(margin)}% ({formatPrice(profit)})
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400 tracking-tight flex items-center gap-1 justify-end">
                                        Закупка: {formatPrice(cost)}
                                        {m.providerService?.rawPriceOriginal && (
                                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 font-mono">
                                                {m.providerService.rawPriceOriginal}{m.providerService.rawCurrencyOriginal === 'USD' ? '$' : m.providerService.rawCurrencyOriginal === 'EUR' ? '€' : ` ${m.providerService.rawCurrencyOriginal}`}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : m.id)}
                                        className={`p-2 rounded-xl transition-all ${isExpanded ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                                        title="Сравнить данные"
                                    >
                                        <Eye size={18} />
                                    </button>

                                    <button
                                        onClick={() => handleManualSync(m.id)}
                                        disabled={isSyncing}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                        title="Синхронизировать цену из API"
                                    >
                                        <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                                    </button>

                                    <button
                                        onClick={() => handleUpdate(m.id, { isActive: !m.isActive })}
                                        disabled={isLoading}
                                        className={`p-2 rounded-xl transition-all border ${m.isActive
                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100'
                                            : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                                            }`}
                                        title={m.isActive ? 'Деактивировать' : 'Активировать'}
                                    >
                                        {m.isActive ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                    </button>

                                    <button
                                        onClick={() => handleUnlink(m.id, providerName)}
                                        disabled={isLoading}
                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* EXPANDED COMPARISON VIEW */}
                        {isExpanded && (
                            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-4 opacity-5">
                                        <RefreshCw size={120} />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Данные провайдера (Original)</h5>
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="text-[9px] text-slate-500 uppercase font-bold">Название у них</div>
                                                    <div className="text-xs font-bold text-slate-200 uppercase leading-tight mt-1">{m.providerService?.name}</div>
                                                </div>
                                                <div>
                                                    <div className="text-[9px] text-slate-500 uppercase font-bold">Оригинальное описание</div>
                                                    <div className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 max-h-32 overflow-y-auto custom-scrollbar">
                                                        {((m.providerService?.rawData as Record<string, unknown>)?.description as string) || ((m.providerService?.rawData as Record<string, unknown>)?.name as string) || 'Нет описания'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 border-l border-slate-800 pl-8">
                                            <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Анализ соответствия</h5>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Цена провайдера</span>
                                                    <span className="text-xs font-black font-mono">{formatPrice(cost)}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Наша маржа</span>
                                                    <span className={`text-xs font-black ${margin > 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                        {margin > 0 ? '+' : ''}{formatPrice(profit)} ({Math.round(margin)}%)
                                                    </span>
                                                </div>
                                                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-400">
                                                        <AlertTriangle size={12} /> Совет инспектора
                                                    </div>
                                                    <p className="text-[10px] text-blue-200/70 mt-1 leading-tight italic">
                                                        {margin < 20 ? 'Маржа слишком низкая. Рекомендуем поднять цену продажи.' : 'Наценка в пределах нормы для этой категории.'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
