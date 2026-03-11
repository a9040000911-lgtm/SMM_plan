'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { TrendingDown } from 'lucide-react';

interface ChurnData {
    timeline: { date: string; count: number }[];
    risks: { name: string; churn: number }[];
    totalProjectedChurn: number;
}

export function ChurnDashboard({ data }: { data: ChurnData }) {
    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-rose-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                            <TrendingDown size={18} />
                        </div>
                        <span className="text-xs font-black text-rose-400 uppercase tracking-widest">Прогноз оттока (30 дн)</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">
                        {data.totalProjectedChurn.toLocaleString()}
                        <span className="text-sm font-medium text-slate-400 ml-2">подписок</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        Календарь окончаний гарантии
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.timeline}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                    dy={10}
                                    tickFormatter={(val) => new Date(val).getDate().toString()}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 10, fontWeight: 'bold', fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    cursor={{ fill: '#f1f5f9' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                                    formatter={(value: any) => [`${value} шт.`, 'Отток']}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}
                                />
                                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                    {data.timeline.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#f43f5e" fillOpacity={0.8} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Risk List */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        Рисковые услуги
                    </h3>
                    <div className="space-y-6">
                        {data.risks.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-slate-600 truncate group-hover:text-slate-900 transition-colors">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg">
                                    -{item.churn}
                                </span>
                            </div>
                        ))}
                        {data.risks.length === 0 && (
                            <div className="text-center text-slate-400 text-xs py-8">
                                Нет данных о рисках
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
