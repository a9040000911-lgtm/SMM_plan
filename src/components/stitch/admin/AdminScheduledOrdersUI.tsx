"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import {
    Clock,
    Trash2, Play,
    Link as LinkIcon, RefreshCcw, Search
} from 'lucide-react';
import { BrandIcon } from '@/components/stitch/ui/BrandIcon';
import { formatAmount } from '@/utils/formatter';
import { toast } from 'sonner';

interface AdminScheduledOrder {
    id: string;
    userId: string;
    projectId: string;
    status: string;
    quantity: number;
    totalPrice: any;
    costPrice: any;
    link: string;
    scheduleTime: Date;
    repeatInterval: number | null;
    createdAt: Date;
    user: {
        email: string | null;
        username: string | null;
    };
    project: {
        name: string;
        brandColor: string | null;
    };
    service: {
        name: string;
        platform: string;
    };
}

interface AdminScheduledOrdersUIProps {
    initialOrders: AdminScheduledOrder[];
}

export function AdminScheduledOrdersUI({ initialOrders }: AdminScheduledOrdersUIProps) {
    const [orders, setOrders] = useState(initialOrders);
    const [search, setSearch] = useState('');

    const filtered = orders.filter(o =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.link.toLowerCase().includes(search.toLowerCase()) ||
        o.user.email?.toLowerCase().includes(search.toLowerCase()) ||
        o.service.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить расписание?')) return;
        try {
            const res = await fetch(`/api/admin/orders/scheduled/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setOrders(prev => prev.filter(o => o.id !== id));
                toast.success('Расписание удалено');
            } else {
                toast.error('Ошибка при удалении');
            }
        } catch (_e) {
            toast.error('Network error');
        }
    };

    const handleForceRun = async (_id: string) => {
        if (!confirm('Запустить выполнение сейчас (вне очереди)?')) return;
        // This would call a specialized endpoint to process it immediately
        toast.info('Функция принудительного запуска в разработке');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по ID, ссылке, email..."
                        className="w-full h-12 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[120px]">Проект</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[300px]">Услуга / Объект</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[200px]">Расписание</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[150px]">Финансы</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right w-[120px]">Действия</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map((order) => (
                                <tr key={order.id} className="hover:bg-slate-50/80 transition-all group">
                                    <td className="px-6 py-6 vertical-align-top">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: order.project.brandColor || '#3b82f6' }} />
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter truncate max-w-[80px]">
                                                    {order.project.name}
                                                </span>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[100px]">
                                                {order.user.email || order.user.username || 'Anon'}
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 vertical-align-top">
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                                    <BrandIcon name={order.service.platform.toLowerCase() as any} size={16} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="text-[11px] font-black text-slate-900 truncate uppercase tracking-tight">
                                                        {order.service.name}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400 truncate">
                                                        <LinkIcon size={10} className="shrink-0" />
                                                        <a href={order.link} target="_blank" rel="noreferrer" className="hover:text-blue-600 underline truncate">
                                                            {order.link}
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 vertical-align-top">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <Clock size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {new Date(order.scheduleTime).toLocaleString('ru-RU')}
                                                </span>
                                            </div>
                                            {order.repeatInterval ? (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <RefreshCcw size={14} className="animate-spin-slow" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                                        Каждые {order.repeatInterval} мин.
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="text-[9px] font-bold text-slate-400 uppercase italic">
                                                    Разовый запуск
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 text-right vertical-align-top">
                                        <div className="flex flex-col items-end">
                                            <div className="text-sm font-black text-slate-900">
                                                {formatAmount(order.totalPrice || 0)} ₽
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 uppercase">
                                                {order.quantity} шт.
                                            </div>
                                            {order.costPrice && (
                                                <div className="text-[9px] font-bold text-emerald-600/60 uppercase italic mt-1 leading-none">
                                                    Закуп: {formatAmount(order.costPrice)}₽
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-6 text-right vertical-align-top">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleForceRun(order.id)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Запустить сейчас"
                                            >
                                                <Play size={16} fill="currentColor" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(order.id)}
                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                title="Отменить"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filtered.length === 0 && (
                        <div className="py-20 text-center text-slate-400 uppercase font-black text-xs tracking-widest">
                            Расписаний не найдено
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
