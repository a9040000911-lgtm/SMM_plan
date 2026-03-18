"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertCircle, CheckCircle2, XCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { cn } from '@/utils/ui';
import { getStuckOrdersAction, resolveStuckOrderAction } from '@/app/admin/orders/actions';
import { toast } from 'sonner';

export function StuckOrdersWidget() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolvingId, setResolvingId] = useState<number | null>(null);

    const fetchStuckOrders = async () => {
        setLoading(true);
        try {
            const res = await getStuckOrdersAction();
            if (res.success) {
                setOrders(res.orders || []);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStuckOrders();
    }, []);

    const handleResolve = async (id: number, action: 'CONFIRM' | 'REFUND') => {
        let externalId = '';
        if (action === 'CONFIRM') {
            const input = prompt('Введите External ID заказа из панели провайдера:');
            if (!input) return;
            externalId = input;
        } else {
            if (!confirm('Вы уверены, что хотите отменить этот заказ и вернуть деньги? Сначала убедитесь, что его нет у провайдера!')) return;
        }

        setResolvingId(id);
        try {
            const res = await resolveStuckOrderAction(id, action, externalId);
            if (res.success) {
                toast.success(action === 'CONFIRM' ? 'Заказ подтвержден' : 'Заказ отменен и возвращен');
                setOrders(prev => prev.filter(o => o.id !== id));
            } else {
                toast.error(res.error || 'Ошибка разрешения');
            }
        } finally {
            setResolvingId(null);
        }
    };

    if (!loading && orders.length === 0) return null;

    return (
        <div className="bg-rose-50 border border-rose-100 rounded-[2rem] p-6 shadow-sm flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-500 text-white rounded-lg animate-pulse">
                        <ShieldAlert size={16} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-400">Внимание: Зависшие заказы</span>
                        <h4 className="text-sm font-black text-rose-900 leading-none mt-1">Требуют ручной проверки</h4>
                    </div>
                </div>
                <button
                    onClick={fetchStuckOrders}
                    disabled={loading}
                    className="p-2 hover:bg-rose-100 rounded-full text-rose-500 transition-colors"
                >
                    <RefreshCw size={14} className={cn(loading && "animate-spin")} />
                </button>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {orders.map(o => (
                    <div key={o.id} className="bg-white border border-rose-200/50 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-black text-slate-800">Заказ #{o.id}</span>
                                    <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase shrink-0">Timeout</span>
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 truncate">{o.serviceName}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">@{o.username}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{o.quantity} шт.</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    onClick={() => handleResolve(o.id, 'CONFIRM')}
                                    disabled={resolvingId === o.id}
                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                    title="Подтвердить (заказ создан у провайдера)"
                                >
                                    <CheckCircle2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleResolve(o.id, 'REFUND')}
                                    disabled={resolvingId === o.id}
                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                    title="Отменить и вернуть (заказ НЕ создан)"
                                >
                                    <XCircle size={16} />
                                </button>
                            </div>
                        </div>
                        {o.error && (
                            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                                <AlertCircle size={10} className="text-rose-400 shrink-0" />
                                <span className="text-[9px] font-medium text-slate-400 font-mono truncate">{o.error}</span>
                            </div>
                        )}
                        <a
                            href={o.link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-1 text-[9px] font-black uppercase text-blue-500 hover:text-blue-700 transition-colors py-1 border-t border-slate-50 mt-1"
                        >
                            Проверить ссылку <ExternalLink size={10} />
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}


