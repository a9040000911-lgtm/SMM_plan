'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import {
    Smile,
    Meh,
    Frown,
    Calendar,
    MessageCircle,
    TrendingDown,
    TrendingUp
} from 'lucide-react';
import { NPSCharts } from '@/components/admin/analytics/nps-charts';
import { useLanguage } from '@/providers/language-provider';

export default function NPSDashboard() {
    const { t } = useLanguage();
    const nt = t.admin.nps;
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchNPS() {
            try {
                const res = await fetch('/api/admin/advocacy/nps');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (err) {
                console.error('Failed to fetch NPS data:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchNPS();
    }, []);

    if (loading) {
        return (
            <div className="p-8 animate-pulse space-y-8">
                <div className="h-8 w-64 bg-slate-200 rounded"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-100 rounded-[2rem]"></div>)}
                </div>
                <div className="h-96 bg-slate-100 rounded-[3rem]"></div>
            </div>
        );
    }

    if (!data) return <div className="p-8">{nt.error}</div>;

    const npsScore = data.analytics?.score || 0;
    const scoreColor = npsScore > 50 ? 'text-emerald-500' : npsScore > 0 ? 'text-amber-500' : 'text-rose-500';

    // Trend calculation safety
    const trend = data.trend || [];
    const hasTrend = trend.length > 0;
    const isTrendPositive = hasTrend && trend.length >= 2
        ? trend[trend.length - 1].score >= trend[0].score
        : true;

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{nt.title}</h1>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{nt.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
                    <Calendar size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-600 uppercase">{nt.period_30}</span>
                </div>
            </div>

            {/* Основные метрики */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* NPS Score Card */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10 flex flex-col justify-between h-full">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{nt.score_card}</span>
                        <div className="mt-4 flex items-end gap-2">
                            <span className={`text-5xl font-black ${scoreColor}`}>{npsScore}</span>
                            <span className="text-slate-400 font-bold mb-1">/ 100</span>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            {isTrendPositive ? (
                                <TrendingUp size={16} className="text-emerald-500" />
                            ) : (
                                <TrendingDown size={16} className="text-rose-500" />
                            )}
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                {hasTrend ? nt.trend_dynamic : nt.no_trend}
                            </span>
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <Smile size={100} />
                    </div>
                </div>

                {/* Count Cards */}
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2">
                            <Smile size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{nt.types.promoters}</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-black text-slate-900">{data.analytics.promoters}</span>
                            <span className="text-xs text-slate-500 ml-2 font-bold">
                                ({data.analytics.totalResponses ? Math.round((data.analytics.promoters / data.analytics.totalResponses) * 100) : 0}%)
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{nt.ranges.promoters}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2">
                            <Meh size={14} className="text-amber-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{nt.types.passives}</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-black text-slate-900">{data.analytics.passives}</span>
                            <span className="text-xs text-slate-500 ml-2 font-bold">
                                ({data.analytics.totalResponses ? Math.round((data.analytics.passives / data.analytics.totalResponses) * 100) : 0}%)
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{nt.ranges.passives}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                    <div className="flex flex-col justify-between h-full">
                        <div className="flex items-center gap-2">
                            <Frown size={14} className="text-rose-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{nt.types.detractors}</span>
                        </div>
                        <div className="mt-4">
                            <span className="text-3xl font-black text-slate-900">{data.analytics.detractors}</span>
                            <span className="text-xs text-slate-500 ml-2 font-bold">
                                ({data.analytics.totalResponses ? Math.round((data.analytics.detractors / data.analytics.totalResponses) * 100) : 0}%)
                            </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{nt.ranges.detractors}</p>
                    </div>
                </div>
            </div>

            {/* Графики */}
            <NPSCharts data={data} />

            {/* Последние опросы */}
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        {nt.recent}
                    </h3>
                </div>
                <div className="divide-y divide-slate-50">
                    {data.recentSurveys && data.recentSurveys.length > 0 ? (
                        data.recentSurveys.map((survey: any) => (
                            <div key={survey.id} className="p-6 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row gap-6">
                                <div className="flex items-center gap-4 min-w-[150px]">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-lg ${survey.score >= 9 ? 'bg-emerald-50 text-emerald-600' :
                                        survey.score >= 7 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                        {survey.score}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900 truncate max-w-[100px]">{survey.username}</span>
                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                                            {new Date(survey.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex-1">
                                    {survey.comment ? (
                                        <div className="flex items-start gap-2">
                                            <MessageCircle size={14} className="text-slate-300 mt-1 shrink-0" />
                                            <p className="text-sm text-slate-600 italic">«{survey.comment}»</p>
                                        </div>
                                    ) : (
                                        <p className="text-[10px] text-slate-400 uppercase font-bold italic tracking-widest">{nt.no_comment}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase">
                                        {survey.serviceName}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-400 uppercase font-bold text-xs">
                            {nt.empty}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
