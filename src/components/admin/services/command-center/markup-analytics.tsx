"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, AlertTriangle, ShieldAlert, Skull, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/utils/ui';
import { getMarkupStatsAction } from '@/app/admin/services/actions';
import Link from 'next/link';

export function MarkupAnalyticsWidget() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        async function load() {
            const stats = await getMarkupStatsAction();
            setData(stats);
            setLoading(false);
        }
        load();
    }, []);

    if (loading || !data || !data.stats) return null;

    const { stats, extremeServices } = data;

    const levels = [
        { label: 'Норма', count: stats.normal, color: 'bg-emerald-500', icon: TrendingUp, range: '< 300%' },
        { label: 'Высокая', count: stats.high, color: 'bg-amber-500', icon: AlertTriangle, range: '300-1500%' },
        { label: 'Тревога', count: stats.alert, color: 'bg-rose-500', icon: ShieldAlert, range: '1500-5000%' },
        { label: 'Экстрим', count: stats.extreme, color: 'bg-slate-900', icon: Skull, range: '> 5000%' },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-1 md:col-span-2 lg:col-span-1 bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm flex flex-col gap-4 overflow-hidden"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                        <TrendingUp size={20} />
                    </div>
                    <div>
                        <div className="text-sm font-black text-slate-800 uppercase ">Анализ прибыли</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Контроль наценок</div>
                    </div>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="p-2 hover:bg-slate-50 rounded-xl transition-colors text-slate-400"
                >
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
                {levels.map((level, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                        <div className={cn("w-full h-1.5 rounded-full", level.color)} />
                        <div className="text-[14px] font-black text-slate-800">{level.count}</div>
                        <div className="text-[8px] font-bold text-slate-400 uppercase er text-center">{level.label}</div>
                    </div>
                ))}
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden flex flex-col gap-3 pt-2 border-t border-slate-50"
                    >
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Топ аномальных наценок</div>
                        <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                            {extremeServices.map((s: any) => (
                                <Link
                                    key={s.id}
                                    href={`/admin/services/${s.id}`}
                                    className="flex items-center justify-between p-2 rounded-xl border border-slate-50 hover:bg-slate-50 transition-all group"
                                >
                                    <div className="flex flex-col">
                                        <div className="text-[11px] font-bold text-slate-800 truncate max-w-[120px]">{s.name}</div>
                                        <div className="text-[9px] font-bold text-slate-400 uppercase">{s.platform}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-end">
                                            <div className="text-[11px] font-black text-rose-600">+{s.markup}%</div>
                                            <div className="text-[9px] font-bold text-slate-400">{s.price}₽</div>
                                        </div>
                                        <ExternalLink size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                    </div>
                                </Link>
                            ))}
                            {extremeServices.length === 0 && (
                                <div className="py-4 text-center text-[10px] font-bold text-slate-400 uppercase">Аномалий не обнаружено</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {stats.loss > 0 && (
                <div className="mt-auto p-3 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3">
                    <ShieldAlert className="text-rose-500" size={18} />
                    <div className="text-[10px] font-bold text-rose-700 leading-tight">
                        Внимание! У вас есть <span className="font-black underline">{stats.loss}</span> услуг, торгующих в убыток.
                    </div>
                </div>
            )}
        </motion.div>
    );
}


