'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { getFinanceMetricsAction } from '@/app/admin/finance/actions';
import { TrendingUp, TrendingDown, LayoutDashboard, Wallet, Loader2 } from 'lucide-react';
import { formatAmount } from '@/utils/formatter';

export function FinanceSummary() {
    const [period, setPeriod] = useState<'all' | 'month' | 'today'>('all');
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMetrics();
    }, [period]);

    const loadMetrics = async () => {
        setLoading(true);
        try {
            const data = await getFinanceMetricsAction(period);
            setMetrics(data);
        } catch (error) {
            console.error('Failed to load finance metrics', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !metrics) {
        return <div className="p-8 text-center text-slate-400"><Loader2 className="animate-spin mx-auto" /></div>;
    }

    return (
        <div className="mb-8 space-y-4">
            <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Период:</span>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                    {(['today', 'month', 'all'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all uppercase ${period === p ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            {p === 'today' ? 'Сегодня' : p === 'month' ? 'Месяц' : 'Все время'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* 1. Свободные средства (балансы) */}
                {/* 1. Свободные средства (балансы) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                <Wallet size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Балансы Клиентов</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            {formatAmount(metrics?.totalBalance || 0)} ₽
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 font-medium leading-normal opacity-80">
                            Все деньги, которые сейчас лежат на счетах пользователей. Это наши обязательства перед клиентами.
                        </p>
                    </div>
                </div>

                {/* 2. Доход */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Оборот (Пополнения)</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            {formatAmount(metrics?.totalDeposits || 0)} ₽
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 font-medium leading-normal opacity-80">
                            Общая сумма всех успешных платежей от клиентов (поступления на ЮKassa/Robokassa).
                        </p>
                    </div>
                </div>

                {/* 3. Расход */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                                <TrendingDown size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Себестоимость</span>
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight">
                            {formatAmount(metrics?.totalExpenses || 0)} ₽
                        </div>
                        <p className="text-[11px] text-slate-500 mt-2 font-medium leading-normal opacity-80">
                            Сумма, потраченная нами на закупку услуг у поставщиков + операционные расходы.
                        </p>
                    </div>
                </div>

                {/* 4. Чистая прибыль */}
                <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden group hover:shadow-2xl hover:shadow-emerald-500/10 transition-all">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-transparent rounded-bl-[150px] -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-slate-800 text-emerald-400 rounded-lg border border-slate-700">
                                <LayoutDashboard size={20} />
                            </div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Наша Прибыль</span>
                        </div>
                        <div className={`text-3xl font-black tracking-tight ${metrics?.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {metrics?.netProfit > 0 ? '+' : ''}{formatAmount(metrics?.netProfit || 0)} ₽
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 font-mono uppercase tracking-widest opacity-60">
                            (ОБОРОТ - СЕБЕСТОИМОСТЬ) ДО ВЫЧЕТА НАЛОГОВ
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
