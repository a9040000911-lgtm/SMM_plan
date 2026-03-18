'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useEffect, useState } from 'react';
import { getSecurityRisksAction } from './actions';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SecurityPage() {
    const [risks, setRisks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRisks();
    }, []);

    const loadRisks = async () => {
        setLoading(true);
        try {
            const res = await getSecurityRisksAction();
            if (res.success) {
                setRisks(res.risks || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-[1600px] mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-rose-600" size={32} />
                        Аудит и Безопасность
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Мониторинг финансовых аномалий (LTV Monitor)</p>
                </div>
                <button onClick={loadRisks} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors">
                    Обновить отчет
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <h3 className="text-slate-400 font-bold uppercase text-xs tracking-wider mb-2">Всего аномалий</h3>
                    <div className="text-4xl font-black text-rose-600">
                        {risks.length}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-black text-slate-400 uppercase tracking-wider">Пользователь</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Текущий баланс</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Ожидаемый</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Gap (Аномалия)</th>
                                <th className="px-6 py-4 text-right text-xs font-black text-slate-400 uppercase tracking-wider">Пополнения</th>
                                <th className="px-6 py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">Риск</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-400">Загрузка данных...</td></tr>
                            ) : risks.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-emerald-600 font-medium">Аномалий не обнаружено. Все чисто! 🛡️</td></tr>
                            ) : (
                                risks.map((risk) => (
                                    <tr key={risk.userId} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-900">@{risk.username || 'No Username'}</span>
                                                <span className="text-xs text-slate-400">{risk.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-600">
                                            {risk.currentBalance.toFixed(2)}₽
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-slate-400">
                                            {risk.expectedBalance.toFixed(2)}₽
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="font-black text-rose-600">+{risk.gap.toFixed(2)}₽</span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-slate-500">
                                            {risk.totalDeposited.toFixed(2)}₽
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {risk.riskLabel === 'CRITICAL' ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-800">
                                                    CRITICAL
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    WARNING
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/admin/users/${risk.userId}`} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                <ArrowRight size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}


