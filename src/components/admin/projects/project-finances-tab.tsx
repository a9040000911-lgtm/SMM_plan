'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, History } from 'lucide-react';
import { formatAmount } from '@/utils/formatter';

interface ProjectFinancesTabProps {
    stats: {
        totalIncome: number;
        totalExpenses: number;
        profit: number;
    };
    recentTransactions: any[];
    recentExpenses: any[];
}

export function ProjectFinancesTab({ stats, recentTransactions, recentExpenses }: ProjectFinancesTabProps) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                            <TrendingUp size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Доход проекта</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{formatAmount(stats.totalIncome)}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 group-hover:scale-110 transition-transform" />
                    <div className="relative">
                        <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 mb-4">
                            <TrendingDown size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Расходы проекта</p>
                        <p className="text-2xl font-black text-slate-800 mt-1">{formatAmount(stats.totalExpenses)}</p>
                    </div>
                </div>

                <div className="p-0.5 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-100">
                    <div className="bg-white p-6 rounded-[1.9rem] h-full relative overflow-hidden group">
                        <div className="relative">
                            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg">
                                <DollarSign size={20} />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Прибыль</p>
                            <p className={`text-2xl font-black mt-1 ${stats.profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {formatAmount(stats.profit)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <History size={18} className="text-blue-500" />
                            Последние транзакции
                        </h3>
                    </div>
                    <div className="flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {recentTransactions.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <p className="text-xs font-bold uppercase tracking-widest">Транзакций пока нет</p>
                            </div>
                        ) : (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Дата</th>
                                        <th className="px-6 py-4">Тип</th>
                                        <th className="px-6 py-4">Сумма</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentTransactions.map((tx) => (
                                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {new Date(tx.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${tx.type === 'DEPOSIT' ? 'bg-blue-50 text-blue-600' :
                                                        tx.type === 'REFUND' ? 'bg-amber-50 text-amber-600' :
                                                            'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`px-6 py-4 font-black ${['DEPOSIT', 'REFUND'].includes(tx.type) ? 'text-emerald-600' : 'text-slate-700'
                                                }`}>
                                                {formatAmount(tx.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Recent Expenses */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                        <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                            <TrendingDown size={18} className="text-rose-500" />
                            Последние расходы
                        </h3>
                    </div>
                    <div className="flex-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {recentExpenses.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <p className="text-xs font-bold uppercase tracking-widest">Расходов пока нет</p>
                            </div>
                        ) : (
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0">
                                    <tr>
                                        <th className="px-6 py-4">Дата</th>
                                        <th className="px-6 py-4">Описание</th>
                                        <th className="px-6 py-4 text-right">Сумма</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentExpenses.map((ex) => (
                                        <tr key={ex.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 font-medium">
                                                {new Date(ex.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 font-bold truncate max-w-[200px]">
                                                {ex.description || 'Без описания'}
                                            </td>
                                            <td className="px-6 py-4 text-right text-rose-600 font-black">
                                                -{formatAmount(ex.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
