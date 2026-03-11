'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React, { useState, useEffect } from 'react';
import {
    Trophy,
    Gift,
    TrendingUp,
    Users,
    Loader2
} from 'lucide-react';
import { LoyaltyForm } from '@/components/admin/users/loyalty-form';
import { useLanguage } from '@/providers/language-provider';

// Data fetching moved to API route for client component

export default function LoyaltyBuilderPage() {
    const { t } = useLanguage();
    const lt = t.admin.loyalty;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/loyalty/stats') // I need to create this API or keep it as is if I pass data
            .then(res => res.json())
            .then(d => {
                setData(d);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    const { levels, rules, stats, loyaltyStats } = data;

    return (
        <div className="space-y-8 max-w-6xl pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <Trophy size={24} className="text-amber-500" />
                        </div>
                        {lt.builder_title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{lt.builder_subtitle}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <TrendingUp size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lt.stats_turnover}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{Number(stats._sum.spent || 0).toLocaleString()}₽</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Users size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lt.stats_clients}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{stats._count.id}</div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                            <Gift size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lt.stats_bonuses}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">
                        {Number(loyaltyStats._sum.value || 0).toLocaleString()}₽
                        <span className="text-sm font-medium text-slate-400 ml-2">({loyaltyStats._count.id})</span>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                            <Trophy size={18} />
                        </div>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{lt.stats_rules}</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{rules.length}</div>
                </div>
            </div>

            <LoyaltyForm initialLevels={levels} initialRules={rules} />
        </div>
    );
}
