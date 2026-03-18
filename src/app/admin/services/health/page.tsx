'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import useSWR from 'swr';
import {
    AlertTriangle,
    Activity,
    Power,
    ExternalLink,
    Loader2
} from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ServiceHealthPage() {
    const { data, isLoading } = useSWR('/api/admin/services/health', fetcher);

    if (isLoading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
            <Loader2 className="animate-spin text-blue-600" size={48} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Анализ стабильности провайдеров...</p>
        </div>
    );

    const health = data?.health || [];
    const incidents = data?.incidents || { stuckCount: 0, stuckExamples: [], highFailureServices: [] };

    const unstableCount = health?.filter((s: any) => s.successRate < 70 && s.total > 2).length || 0;

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight italic uppercase">Мониторинг здоровья услуг</h2>
                    <p className="text-sm text-slate-500 font-medium">Анализ стабильности и прибыльности тарифов за последние 500 заказов.</p>
                </div>

                {(unstableCount > 0 || incidents.stuckCount > 0) && (
                    <div className="flex items-center gap-3 px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 animate-pulse">
                        <AlertTriangle size={20} />
                        <span className="text-xs font-black uppercase">
                            {unstableCount > 0 ? `${unstableCount} проблемных услуг` : ''}
                            {unstableCount > 0 && incidents.stuckCount > 0 ? ' и ' : ''}
                            {incidents.stuckCount > 0 ? `${incidents.stuckCount} зависших заказов` : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Incident Section */}
            {(incidents.stuckCount > 0 || incidents.highFailureServices.length > 0) && (
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-900/40">
                    <div className="flex items-center gap-3">
                        <Activity className="text-rose-500" />
                        <h3 className="text-lg font-black uppercase tracking-tight">Радар инцидентов (Аномалии)</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {incidents.stuckCount > 0 && (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">⚠️ Зависшие заказы (в работе &gt;12ч):</p>
                                <div className="space-y-2">
                                    {incidents.stuckExamples.map((o: any) => (
                                        <div key={o.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-white/5">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-100">#{o.id}</span>
                                                <span className="text-[9px] text-slate-500 font-medium uppercase">{o.service}</span>
                                            </div>
                                            <Link href={o.link} target="_blank" className="p-2 text-blue-400 hover:text-blue-300">
                                                <ExternalLink size={14} />
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {incidents.highFailureServices.length > 0 && (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">❌ Аномальный процент отмен (24ч):</p>
                                <div className="space-y-2">
                                    {incidents.highFailureServices.map((s: any) => (
                                        <div key={s.name} className="flex items-center justify-between p-3 bg-rose-950/30 rounded-xl border border-rose-500/20">
                                            <span className="text-xs font-bold text-rose-100">{s.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">{s.count} зак.</span>
                                                <span className="px-2 py-1 bg-rose-500 text-white text-[9px] font-black rounded-lg">{s.rate}% Сбоев</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {health?.map((service: any) => {
                    const isCritical = service.successRate < 50 && service.total > 2;
                    const isWarning = service.successRate < 80 && service.total > 2;

                    return (
                        <div key={service.id} className={`bg-white rounded-[2.5rem] border-2 shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md ${isCritical ? 'border-rose-200' : isWarning ? 'border-amber-100' : 'border-slate-100'}`}>
                            <div className="p-6 flex-1 space-y-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-slate-800 text-sm line-clamp-1 uppercase tracking-tight">{service.id}</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{service.provider}</span>
                                        </div>
                                    </div>
                                    <div className={`p-2.5 rounded-xl ${isCritical ? 'bg-rose-100 text-rose-600' : isWarning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                        <Activity size={20} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Успешность (Rate)</span>
                                        <span className={`text-lg font-black ${isCritical ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {service.successRate.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className={`h-full transition-all duration-1000 ${isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                            style={{ width: `${service.successRate}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4">
                                    <div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Всего заказов</div>
                                        <div className="text-sm font-bold text-slate-700">{service.total}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Прибыль (Net)</div>
                                        <div className={`text-sm font-bold ${service.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {formatAmount(service.profit)}₽
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                                <Link
                                    href={`/admin/services/${service.id}`}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-600 hover:bg-slate-100 transition-all"
                                >
                                    <ExternalLink size={12} /> Настроить
                                </Link>
                                {service.successRate < 70 && (
                                    <button className="p-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-all shadow-lg shadow-rose-900/20">
                                        <Power size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}


