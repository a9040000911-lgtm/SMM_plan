"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useMemo } from 'react';
import { TrendingDown, Unlink, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useServiceDashboard } from './manager-context';
import { cn } from '@/lib/utils';

export function HealthCheckWidget() {
    const { services, overrides, isGlobal } = useServiceDashboard();

    const stats = useMemo(() => {
        let moneyBurners = 0;
        let brokenBridges = 0;
        let fragileMappings = 0;

        services.forEach(s => {
            const override = overrides.find(o => o.internalServiceId === s.id);
            const isActive = isGlobal ? s.isActive : (override ? override.isActive : false);

            if (!isActive) return;

            const currentPrice = Number(isGlobal ? s.pricePer1000 : (override?.customPrice || s.pricePer1000));
            const cost = Number(s.lastProviderPrice) || 0;

            if (cost > 0 && currentPrice < cost) {
                moneyBurners++;
            }

            if (s.providerMappings.length === 0) {
                brokenBridges++;
            }

            const primaryMapping = s.providerMappings.find((m: any) => m.priority === 1);
            if (primaryMapping && !primaryMapping.isActive) {
                fragileMappings++;
            }
        });

        return { moneyBurners, brokenBridges, fragileMappings };
    }, [services, overrides, isGlobal]);

    const hasIssues = stats.moneyBurners > 0 || stats.brokenBridges > 0 || stats.fragileMappings > 0;

    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <ActivityIcon className={cn("w-4 h-4", hasIssues ? "text-rose-500" : "text-emerald-500")} />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Состояние каталога</span>
                </div>
                {hasIssues && (
                    <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase rounded-full animate-pulse">
                        Требует внимания
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 overflow-hidden pr-1">
                {/* Money Burners */}
                <HealthItem
                    icon={<TrendingDown />}
                    label="Убытки"
                    count={stats.moneyBurners}
                    color={stats.moneyBurners > 0 ? "rose" : "emerald"}
                    description="Ниже закупки"
                />

                {/* Broken Bridges */}
                <HealthItem
                    icon={<Unlink />}
                    label="Разрывы"
                    count={stats.brokenBridges}
                    color={stats.brokenBridges > 0 ? "rose" : "emerald"}
                    description="Нет маппинга"
                />

                {/* Fragile Mappings */}
                <HealthItem
                    icon={<AlertTriangle />}
                    label="Риски"
                    count={stats.fragileMappings}
                    color={stats.fragileMappings > 0 ? "amber" : "emerald"}
                    description="Провайдер выкл"
                />
            </div>

            {!hasIssues && (
                <div className="mt-4 p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-700 leading-tight">
                        Все системы в норме. Проект работает эффективно.
                    </p>
                </div>
            )}
        </div>
    );
}

function HealthItem({ icon, label, count, color, description }: any) {
    const isGood = count === 0;
    const colorClasses = {
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
        rose: "bg-rose-50 text-rose-600 border-rose-100",
        amber: "bg-amber-50 text-amber-600 border-amber-100"
    }[color as 'emerald' | 'rose' | 'amber'];

    return (
        <div className={cn(
            "p-3 rounded-2xl border transition-all flex items-center justify-between group h-full",
            isGood ? "bg-white border-slate-50 opacity-60" : colorClasses
        )}>
            <div className="flex items-center gap-2 min-w-0">
                <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0",
                    isGood ? "bg-slate-50 text-slate-300" : "bg-white"
                )}>
                    {isGood ? <CheckCircle2 size={16} /> : React.cloneElement(icon as React.ReactElement, { size: 16 } as any)}
                </div>
                <div className="flex flex-col min-w-0">
                    <div className="text-[10px] font-black uppercase">{label}</div>
                    <div className="text-[9px] font-bold opacity-60 leading-none mt-0.5">{description}</div>
                </div>
            </div>
            <div className="flex items-center gap-2 ml-2 shrink-0">
                <span className="text-sm font-black italic">{count}</span>
            </div>
        </div>
    );
}

function ActivityIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
    );
}
