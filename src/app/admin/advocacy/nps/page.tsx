/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
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
import { getAdminSession } from '@/utils/admin-session';
import { redirect } from 'next/navigation';
import { AdvocacyService } from '@/services/advocacy/advocacy.service';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { dictionaries, Locale } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

export default async function NPSDashboard() {
    const session = await getAdminSession();
    if (!session) redirect('/admin/login');

    const cookieStore = await cookies();
    const lang = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
    const nt = dictionaries[lang].admin.nps;

    const user = await prisma.user.findUnique({ where: { id: session.id } });
    if (!user || !['ADMIN', 'SEO'].includes(user.role)) redirect('/admin/login');

    // Get NPS analytics
    const analytics = await AdvocacyService.getNPSAnalytics(user.projectId || undefined);

    // Get recent surveys with user details
    const recentSurveys = await prisma.nPSSurvey.findMany({
        where: user.projectId ? { projectId: user.projectId } : {},
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            user: { select: { username: true, tgId: true } },
            order: { select: { id: true, internalService: { select: { name: true } } } }
        }
    });

    // NPS trend (last 30 days, grouped by week)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const surveysLast30Days = await prisma.nPSSurvey.findMany({
        where: {
            ...(user.projectId ? { projectId: user.projectId } : {}),
            createdAt: { gte: thirtyDaysAgo }
        },
        orderBy: { createdAt: 'asc' },
        select: { score: true, createdAt: true }
    });

    // Group by week
    const weeklyData: Record<string, { promoters: number; passives: number; detractors: number; total: number }> = {};
    surveysLast30Days.forEach((s: any) => {
        const weekStart = new Date(s.createdAt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        if (!weeklyData[weekKey]) weeklyData[weekKey] = { promoters: 0, passives: 0, detractors: 0, total: 0 };
        weeklyData[weekKey].total++;
        if (s.score >= 9) weeklyData[weekKey].promoters++;
        else if (s.score >= 7) weeklyData[weekKey].passives++;
        else weeklyData[weekKey].detractors++;
    });

    const trend = Object.entries(weeklyData).map(([week, data]: [string, any]) => ({
        week,
        score: Math.round(((data.promoters / data.total) - (data.detractors / data.total)) * 100),
        total: data.total
    }));

    const recentMapped = recentSurveys.map((s: any) => ({
        id: s.id,
        score: s.score,
        comment: s.comment,
        username: s.user.username || `User ${s.user.tgId}`,
        serviceName: s.order?.internalService.name || 'N/A',
        createdAt: s.createdAt.toISOString()
    }));

    const data = { analytics, recentSurveys: recentMapped, trend };

    const npsScore = analytics?.score || 0;
    const scoreColor = npsScore > 50 ? 'text-emerald-500' : npsScore > 0 ? 'text-amber-500' : 'text-rose-500';
    const hasTrend = trend.length > 0;
    const isTrendPositive = hasTrend && trend.length >= 2
        ? trend[trend.length - 1].score >= trend[0].score
        : true;

    return (
        <div className="p-4 sm:p-5 space-y-8 max-w-7xl mx-auto">
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
                            <span className="text-3xl font-black text-slate-900">{analytics.promoters}</span>
                            <span className="text-xs text-slate-500 ml-2 font-bold">
                                ({analytics.totalResponses ? Math.round((analytics.promoters / analytics.totalResponses) * 100) : 0}%)
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
                            <span className="text-3xl font-black text-slate-900">{analytics.passives}</span>
                            <span className="text-xs text-slate-500 ml-2 font-bold">
                                ({analytics.totalResponses ? Math.round((analytics.passives / analytics.totalResponses) * 100) : 0}%)
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
                            <span className="text-3xl font-black text-slate-900">{analytics.detractors}</span>
                            <span className="text-xs text-slate-500 ml-2 font-bold">
                                ({analytics.totalResponses ? Math.round((analytics.detractors / analytics.totalResponses) * 100) : 0}%)
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
                    {recentMapped.length > 0 ? (
                        recentMapped.map((survey: any) => (
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
