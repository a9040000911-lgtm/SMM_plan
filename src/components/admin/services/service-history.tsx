'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { History, Clock, ArrowRight, CornerDownRight, Loader2 } from 'lucide-react';
import { getServiceHistoryAction } from '@/app/admin/services/actions';
import { formatAmount } from '@/utils/formatter';
import { cn } from '@/utils/ui';

interface ServiceHistoryProps {
    serviceId: string;
}

export function ServiceHistory({ serviceId }: ServiceHistoryProps) {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function fetchLogs() {
            setIsLoading(true);
            try {
                const data = await getServiceHistoryAction(serviceId);
                setLogs(data);
            } catch (error) {
                console.error('Failed to fetch history:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLogs();
    }, [serviceId]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                <Loader2 size={24} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Загрузка истории...</span>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <History size={32} className="opacity-20" />
                <span className="text-[10px] font-bold uppercase tracking-widest">История изменений пуста</span>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {logs.map((log) => {
                const isPrice = log.type === 'PRICE_CHANGE';
                const isMarkup = log.type === 'MARKUP_CHANGE';

                return (
                    <div key={log.id} className="group relative pl-8 pb-4 last:pb-0 border-l border-slate-100 last:border-l-0">
                        <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-slate-200 border-2 border-white group-hover:bg-blue-500 transition-colors" />

                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm group-hover:border-blue-100 transition-all">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={cn(
                                        "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tight",
                                        isPrice ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                                    )}>
                                        {isPrice ? 'Цена' : isMarkup ? 'Наценка' : log.type}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {log.reason && (
                                    <span className="text-[9px] font-bold text-slate-400 italic">
                                        {log.reason}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Было</span>
                                    <span className="text-xs font-bold text-slate-500 line-through decoration-slate-300">
                                        {isPrice ? `${formatAmount(log.oldValue)}₽` : `${log.oldValue}%`}
                                    </span>
                                </div>

                                <ArrowRight size={14} className="text-slate-300" />

                                <div className="flex flex-col">
                                    <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter">Стало</span>
                                    <span className="text-sm font-black text-slate-900 flex items-baseline gap-1">
                                        {isPrice ? `${formatAmount(log.newValue)}₽` : `${log.newValue}%`}
                                        {isPrice && (
                                            <span className={cn(
                                                "text-[10px] font-bold",
                                                Number(log.newValue) > Number(log.oldValue) ? "text-rose-500" : "text-emerald-500"
                                            )}>
                                                {Number(log.newValue) > Number(log.oldValue) ? '↑' : '↓'}
                                                {Math.abs(Number(log.newValue) - Number(log.oldValue)).toFixed(2)}₽
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400 font-medium bg-slate-50 p-2 rounded-lg">
                                <CornerDownRight size={12} />
                                <span>ID изменения: <span className="font-mono">{log.id.split('-')[0]}</span></span>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}


