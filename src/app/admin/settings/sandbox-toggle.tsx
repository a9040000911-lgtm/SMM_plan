'use client';

/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 * 
 * SandboxToggle — Admin panel toggle for Sandbox Mode with TTL selector and data purge.
 */
import { useState, useEffect, useCallback } from 'react';
import { FlaskConical, Trash2, Clock, Power, Loader2, AlertTriangle } from 'lucide-react';

const TTL_OPTIONS = [
    { label: '30 мин', value: 30 },
    { label: '1 час', value: 60 },
    { label: '2 часа', value: 120 },
    { label: '4 часа', value: 240 },
];

export function SandboxToggle() {
    const [status, setStatus] = useState<{ enabled: boolean; expiresAt: string | null; enabledBy: string | null } | null>(null);
    const [loading, setLoading] = useState(false);
    const [ttl, setTtl] = useState(120);
    const [purgeResult, setPurgeResult] = useState<{ orders: number; transactions: number; tickets: number } | null>(null);

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/sandbox');
            if (res.ok) setStatus(await res.json());
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchStatus(); }, [fetchStatus]);

    const toggle = async () => {
        setLoading(true);
        setPurgeResult(null);
        try {
            const action = status?.enabled ? 'disable' : 'enable';
            await fetch('/api/admin/sandbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, ttlMinutes: ttl })
            });
            await fetchStatus();
        } catch { /* ignore */ }
        setLoading(false);
    };

    const purge = async () => {
        if (!confirm('Удалить ВСЕ тестовые данные? Это действие необратимо.')) return;
        setLoading(true);
        try {
            const res = await fetch('/api/admin/sandbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'purge' })
            });
            if (res.ok) {
                const data = await res.json();
                setPurgeResult({ orders: data.orders, transactions: data.transactions, tickets: data.tickets });
            }
        } catch { /* ignore */ }
        setLoading(false);
    };

    if (!status) return null;

    const expiresAt = status.expiresAt ? new Date(status.expiresAt) : null;
    const timeLeft = expiresAt ? Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 60000)) : null;

    return (
        <div className={`rounded-2xl border-2 p-6 transition-all ${status.enabled ? 'border-amber-400 bg-amber-50' : 'border-slate-200 bg-white'}`}>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${status.enabled ? 'bg-amber-400 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <FlaskConical size={20} />
                </div>
                <div>
                    <h3 className="text-base font-bold text-slate-800">Режим Песочницы</h3>
                    <p className="text-xs text-slate-500">Безопасное E2E тестирование с мок-провайдерами</p>
                </div>
                {status.enabled && (
                    <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-200 px-3 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        АКТИВНА
                    </span>
                )}
            </div>

            {/* Warning */}
            {!status.enabled && (
                <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl mb-4 text-xs text-slate-600">
                    <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                    <span>
                        Включение Песочницы переключит платёжную систему в TEST-режим и перенаправит все заказы на эмулятор провайдеров.
                        Реальные клиенты НЕ смогут пополнять баланс.
                    </span>
                </div>
            )}

            {/* TTL Selector (before enable) */}
            {!status.enabled && (
                <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                        <Clock size={12} className="inline mr-1" />
                        Авто-отключение через:
                    </label>
                    <div className="flex gap-2">
                        {TTL_OPTIONS.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setTtl(opt.value)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                    ttl === opt.value 
                                        ? 'bg-slate-800 text-white border-slate-800' 
                                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Active status */}
            {status.enabled && timeLeft !== null && (
                <div className="flex items-center gap-2 p-3 bg-amber-100 rounded-xl mb-4 text-xs text-amber-800 font-medium">
                    <Clock size={14} />
                    Авто-отключение через {timeLeft} мин
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={toggle}
                    disabled={loading}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-50 ${
                        status.enabled
                            ? 'bg-slate-800 text-white hover:bg-slate-900'
                            : 'bg-amber-400 text-amber-900 hover:bg-amber-500'
                    }`}
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
                    {status.enabled ? 'Выключить Песочницу' : 'Включить Песочницу'}
                </button>

                <button
                    onClick={purge}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 rounded-xl border border-rose-200 hover:bg-rose-100 transition-all disabled:opacity-50"
                    title="Удалить все тестовые заказы, транзакции и тикеты"
                >
                    <Trash2 size={16} />
                    Очистить тестовые данные
                </button>
            </div>

            {/* Purge result */}
            {purgeResult && (
                <div className="mt-3 p-3 bg-green-50 rounded-xl text-xs text-green-700 font-medium border border-green-200">
                    ✅ Удалено: {purgeResult.orders} заказов, {purgeResult.transactions} транзакций, {purgeResult.tickets} тикетов
                </div>
            )}
        </div>
    );
}
