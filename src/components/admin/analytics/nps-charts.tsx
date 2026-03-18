'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import { useLanguage } from '@/providers/language-provider';

const NPS_COLORS = {
    promoters: '#10b981', // Green
    passives: '#f59e0b',  // Orange
    detractors: '#ef4444' // Red
};

export function NPSCharts({ data }: { data: any }) {
    const { t } = useLanguage();
    const nt = t.admin.nps;

    const pieData = [
        { name: nt.types.promoters, value: data.analytics.promoters, color: NPS_COLORS.promoters },
        { name: nt.types.passives, value: data.analytics.passives, color: NPS_COLORS.passives },
        { name: nt.types.detractors, value: data.analytics.detractors, color: NPS_COLORS.detractors },
    ].filter(d => d.value > 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* NPS Distribution Pie Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    {nt.charts.distribution}
                </h3>
                <div className="h-[300px] w-full flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-6 flex justify-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">{nt.types.promoters}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">{nt.types.passives}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase">{nt.types.detractors}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* NPS Trend Line Chart */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    {nt.charts.trend}
                </h3>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.trend}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                domain={[-100, 100]}
                                tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="score"
                                stroke="#3b82f6"
                                strokeWidth={4}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}


