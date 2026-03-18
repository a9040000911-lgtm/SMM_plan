"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
    CreditCard,
    RefreshCw,
    Globe,
    Briefcase
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { formatAmount } from '@/utils/formatter';
import { motion } from 'framer-motion';

interface ProviderHubProps {
    providers: any[];
    onTopUp: (provider: any) => void;
    onSync: (providerId: string) => void;
    syncingId?: string | null;
}

export function ProviderHub({ providers, onTopUp, onSync, syncingId }: ProviderHubProps) {
    if (!providers?.length) return null;

    return (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[380px] pr-2 custom-scrollbar py-1">
            {providers.map((p) => {
                const isSyncing = syncingId === p.id;
                const isCritical = parseFloat(p.currentBalance) < parseFloat(p.balanceThreshold);
                const symbol = '₽';

                return (
                    <motion.div
                        key={p.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "flex items-center justify-between p-3 rounded-2xl border transition-all hover:shadow-sm group relative overflow-hidden",
                            isCritical ? "border-rose-100 bg-rose-50/30" : "bg-white border-slate-100"
                        )}
                    >
                        {/* Info Section */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={cn(
                                "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                                isCritical ? "bg-rose-100 text-rose-600" : "bg-slate-50 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors"
                            )}>
                                {p.projectId ? (
                                    <Briefcase size={14} />
                                ) : (
                                    <Globe size={14} />
                                )}
                            </div>
                            <div className="truncate">
                                <div className="flex items-center gap-1.5 leading-none">
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate">
                                        {p.name}
                                    </span>
                                    <div className={cn(
                                        "w-1 h-1 rounded-full shrink-0",
                                        p.isEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                                    )} />
                                </div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                    {p.isEnabled ? 'В сети' : 'Откл'}
                                </div>
                            </div>
                        </div>

                        {/* Balance Section */}
                        <div className="flex items-center gap-4 px-4 border-l border-slate-50">
                            <div className="text-right">
                                <div className={cn(
                                    "text-sm font-black italic leading-none",
                                    isCritical ? "text-rose-600" : "text-slate-900"
                                )}>
                                    {symbol}{formatAmount(p.currentBalance)}
                                </div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                    Порог: {p.balanceThreshold}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => onSync(p.id)}
                                disabled={isSyncing}
                                className="p-2 hover:bg-slate-50 rounded-lg text-slate-300 hover:text-blue-600 transition-all disabled:opacity-50"
                                title="Синхронизировать"
                            >
                                <RefreshCw size={14} className={cn(isSyncing && "animate-spin")} />
                            </button>
                            <button
                                onClick={() => onTopUp(p)}
                                className={cn(
                                    "p-2 rounded-lg transition-all active:scale-95",
                                    isCritical ? "bg-rose-500 text-white shadow-lg shadow-rose-200" : "text-slate-300 hover:bg-blue-50 hover:text-blue-600"
                                )}
                                title="Пополнить"
                            >
                                <CreditCard size={14} />
                            </button>
                        </div>

                        {/* Critical Alert Dot */}
                        {isCritical && (
                            <div className="absolute top-1 right-1">
                                <div className="w-1 h-1 bg-rose-500 rounded-full animate-ping" />
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </div>
    );
}


