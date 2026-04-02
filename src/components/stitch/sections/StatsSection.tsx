/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
"use client";

import React from "react";
import { Rocket, Sparkles, Star } from "lucide-react";
import type { GlobalStats } from "@/app/(client)/actions";

export const StatsSection = ({ globalStats }: { globalStats?: GlobalStats | null }) => {
    const stats = [
        { label: 'Заказов выполнено', value: globalStats?.formatted?.orders || '854k+', icon: <Rocket size={14} className="text-blue-500" /> },
        { label: 'Счастливых клиентов', value: globalStats?.formatted?.users || '12.4k+', icon: <Star size={14} className="text-amber-500" /> },
        { label: 'Успешных стартов', value: '99.9%', icon: <Sparkles size={14} className="text-emerald-500" /> },
        { label: 'Средняя скорость', value: '~4м', icon: <Rocket size={14} className="text-blue-400 rotate-90" /> }
    ];

    return (
        <section className="w-full bg-white py-24 px-6 border-t border-slate-100 relative z-10 shadow-[0_-1px_0_0_rgba(0,0,0,0.05)]">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="flex flex-col items-center md:items-start group transition-all duration-500 hover:translate-y-[-4px]">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 group-hover:border-blue-500/30 group-hover:bg-blue-50/50 transition-all shadow-sm">
                                    {stat.icon}
                                </div>
                                <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter group-hover:text-blue-600 transition-colors italic pr-2 overflow-visible">
                                    {stat.value}
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-500 transition-colors">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
