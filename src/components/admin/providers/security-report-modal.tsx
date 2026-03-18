'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useState, useEffect } from 'react';
import { AdminProvider } from '@/types/admin';
import { getProviderSecurityReportAction } from '@/app/admin/providers/actions';
import { X, ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';

interface SecurityReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    provider: AdminProvider;
}

export function SecurityReportModal({ isOpen, onClose, provider }: SecurityReportModalProps) {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadReport();
        }
    }, [isOpen, provider.id]);

    const loadReport = async () => {
        setLoading(true);
        try {
            const res = await getProviderSecurityReportAction(provider.id);
            if (res.success) {
                setReport(res.report);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${!report ? 'bg-slate-100 text-slate-400' :
                                report.status === 'OK' ? 'bg-emerald-100 text-emerald-600' :
                                    report.status === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                        'bg-rose-100 text-rose-600'
                            }`}>
                            {!report ? <RefreshCw className="animate-spin" /> :
                                report.status === 'OK' ? <ShieldCheck /> :
                                    report.status === 'WARNING' ? <AlertTriangle /> : <ShieldAlert />
                            }
                        </div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-tight uppercase">Отчет безопасности</h3>
                            <p className="text-slate-400 text-sm font-medium">{provider.name}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto space-y-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-4">
                            <RefreshCw className="animate-spin w-8 h-8" />
                            <p className="font-medium animate-pulse">Анализируем транзакции...</p>
                        </div>
                    ) : report ? (
                        <>
                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-black uppercase text-slate-400 mb-1">Фактический расход</p>
                                    <div className="text-2xl font-black text-slate-800">
                                        {report.actualSpend.toFixed(2)} <span className="text-sm text-slate-400 font-bold">{report.currency}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                        Убыль баланса + Пополнения
                                    </p>
                                </div>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                    <p className="text-xs font-black uppercase text-slate-400 mb-1">Ожидаемый расход</p>
                                    <div className="text-2xl font-black text-slate-800">
                                        {report.expectedSpend.toFixed(2)} <span className="text-sm text-slate-400 font-bold">{report.currency}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                                        Сумма заказов в системе (Cost Price)
                                    </p>
                                </div>
                            </div>

                            {/* Slippage Result */}
                            <div className={`p-6 rounded-2xl border-2 ${report.status === 'OK' ? 'border-emerald-100 bg-emerald-50/30' :
                                    report.status === 'WARNING' ? 'border-amber-100 bg-amber-50/30' :
                                        'border-rose-100 bg-rose-50/30'
                                }`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className={`font-black uppercase tracking-wider text-sm mb-1 ${report.status === 'OK' ? 'text-emerald-700' :
                                                report.status === 'WARNING' ? 'text-amber-700' :
                                                    'text-rose-700'
                                            }`}>
                                            {report.status === 'OK' ? 'Финансовых аномалий нет' :
                                                report.status === 'WARNING' ? 'Обнаружено расхождение' :
                                                    'КРИТИЧЕСКАЯ УТЕЧКА СРЕДСТВ'}
                                        </h4>
                                        <p className="text-slate-600 font-medium text-sm">
                                            {report.slippage.toFixed(2)} {report.currency} ({report.slippagePercent.toFixed(1)}%)
                                        </p>
                                    </div>
                                    {report.status !== 'OK' && (
                                        <div className="px-3 py-1 bg-white rounded-lg shadow-sm text-xs font-bold text-slate-500">
                                            {report.status === 'CRITICAL' ? 'Требует внимания!' : 'Проверьте расходы'}
                                        </div>
                                    )}
                                </div>

                                {report.status !== 'OK' && (
                                    <div className="mt-4 pt-4 border-t border-black/5 text-xs text-slate-500 font-medium leading-relaxed">
                                        Возможно, API ключ используется кем-то еще, либо провайдер списал средства за услуги, которые не прошли через нашу систему.
                                    </div>
                                )}
                            </div>

                            {/* Recommendations */}
                            {report.status === 'CRITICAL' && (
                                <div className="space-y-3">
                                    <p className="text-xs font-black text-slate-400 uppercase">Рекомендации</p>
                                    <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                                        Сменить API ключ провайдера
                                    </button>
                                    <button className="w-full py-3 bg-white border border-slate-200 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50 transition-colors">
                                        Приостановить провайдера
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            Не удалось загрузить отчет
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


