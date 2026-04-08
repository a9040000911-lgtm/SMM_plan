'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useMemo } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar
} from 'recharts';
import { DailyChartData } from '@/services/admin/microservices/admin-statistics.service';
import { formatAmount } from '@/utils/formatter';
import { AdminTableCard } from '@/components/admin/core/admin-table-card';
import { Activity, Users, ShoppingCart, MessageSquare, IndianRupee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/utils/ui';

interface StatisticsChartsProps {
    data: DailyChartData[];
    period: '7' | '30' | 'all';
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900 border border-slate-700 text-slate-300 p-3 rounded-xl shadow-xl text-xs">
                <p className="font-bold text-white mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-400 capitalize">{entry.name}:</span>
                        <span className="font-mono font-bold text-white">
                            {entry.name === 'Выручка' ? `${formatAmount(entry.value)} ₽` : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export function StatisticsCharts({ data, period }: StatisticsChartsProps) {
    const router = useRouter();

    const handlePeriodChange = (p: string) => {
        router.push(`/admin/analytics/statistics?period=${p}`);
    };

    // Aggregate totals
    const totals = useMemo(() => {
        return data.reduce((acc, curr) => ({
            orders: acc.orders + curr.orders,
            users: acc.users + curr.users,
            tickets: acc.tickets + curr.tickets,
            revenue: acc.revenue + curr.revenue,
        }), { orders: 0, users: 0, tickets: 0, revenue: 0 });
    }, [data]);

    return (
        <div className="space-y-6">
            {/* Period Toggles */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                {(['7', '30', 'all'] as const).map(p => (
                    <button
                        key={p}
                        onClick={() => handlePeriodChange(p)}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all",
                            period === p 
                                ? "bg-white text-blue-600 shadow-sm" 
                                : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"
                        )}
                    >
                        {p === '7' ? 'За 7 дней' : p === '30' ? 'За 30 дней' : 'За все время'}
                    </button>
                ))}
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-500 mb-2">
                        <IndianRupee size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Суммарная Выручка</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{formatAmount(totals.revenue)} ₽</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-indigo-500 mb-2">
                        <ShoppingCart size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Всего заказов</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{totals.orders.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-500 mb-2">
                        <Users size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Новых юзеров</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{totals.users.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <MessageSquare size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Новых тикетов</span>
                    </div>
                    <div className="text-2xl font-black text-slate-800">{totals.tickets.toLocaleString()}</div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Revenue Chart */}
                <AdminTableCard title="Динамика Выручки" icon={Activity} className="col-span-1 lg:col-span-2">
                    <div className="h-[300px] w-full p-4 pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#94a3b8'}}
                                    dy={10}
                                    minTickGap={20}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fill: '#94a3b8'}}
                                    tickFormatter={(val) => `${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                                    dx={-10}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" name="Выручка" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </AdminTableCard>

                {/* Orders Chart */}
                <AdminTableCard title="Количество заказов" icon={ShoppingCart}>
                    <div className="h-[250px] w-full p-4 pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} minTickGap={20} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dx={-10} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                                <Bar dataKey="orders" name="Заказы" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </AdminTableCard>

                {/* Users Chart */}
                <AdminTableCard title="Регистрации пользователей" icon={Users}>
                    <div className="h-[250px] w-full p-4 pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} minTickGap={20} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dx={-10} />
                                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f1f5f9'}} />
                                <Bar dataKey="users" name="Пользователи" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </AdminTableCard>

                {/* Tickets Chart */}
                <AdminTableCard title="Новые тикеты" icon={MessageSquare}>
                    <div className="h-[250px] w-full p-4 pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <defs>
                                    <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dy={10} minTickGap={20} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} dx={-10} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="tickets" name="Тикеты" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorTickets)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </AdminTableCard>

            </div>
        </div>
    );
}
