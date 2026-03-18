"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, Hash, Link as LinkIcon,
    Trash2, RefreshCcw
} from 'lucide-react';
import { BrandIcon } from '@/components/stitch/ui/BrandIcon';
import { formatAmount } from '@/utils/formatter';
import { toast } from 'sonner';

interface ScheduledOrder {
    id: string;
    status: string;
    quantity: number;
    totalPrice: any;
    link: string;
    scheduleTime: Date;
    repeatInterval: number | null;
    createdAt: Date;
    service?: {
        name: string;
        platform: string;
    };
}

interface ScheduledOrdersUIProps {
    initialOrders: ScheduledOrder[];
}

export function ScheduledOrdersUI({ initialOrders }: ScheduledOrdersUIProps) {
    const [orders, setOrders] = useState(initialOrders);

    const handleCancel = async (id: string) => {
        if (!confirm('Вы уверены, что хотите отменить этот запланированный заказ?')) return;

        try {
            const res = await fetch(`/api/client/orders/scheduled/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setOrders(prev => prev.filter(o => o.id !== id));
                toast.success('Запланированный заказ отменен');
            } else {
                toast.error('Ошибка при отмене заказа');
            }
        } catch (_e) {
            toast.error('Ошибка сети');
        }
    };

    return (
        <div className="space-y-10 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
                        Запланированные <span className="text-blue-600">Заказы</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Управление будущими и регулярными задачами
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <AnimatePresence mode='popLayout'>
                    {orders.length > 0 ? (
                        orders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                                className="group bg-white border border-slate-100 rounded-[2.5rem] p-6 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 items-center shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
                            >
                                {/* Icon */}
                                <div className="lg:col-span-1">
                                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                        <BrandIcon name={order.service?.platform?.toLowerCase() as any || 'telegram'} size={24} />
                                    </div>
                                </div>

                                {/* Main Info */}
                                <div className="lg:col-span-4 space-y-2">
                                    <h3 className="text-base font-black text-slate-900 uppercase truncate">
                                        {order.service?.name || 'Услуга'}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5"><Hash size={12} /> {order.id.slice(0, 8)}</div>
                                        <div className="flex items-center gap-1.5 truncate max-w-[200px]"><LinkIcon size={12} /> {order.link}</div>
                                    </div>
                                </div>

                                {/* Schedule Details */}
                                <div className="lg:col-span-3">
                                    <div className="p-4 bg-blue-50/50 rounded-2xl space-y-2">
                                        <div className="flex items-center gap-2 text-blue-700">
                                            <Calendar size={14} />
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
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Разовый запуск</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Price / Qty */}
                                <div className="lg:col-span-2 text-center lg:text-right">
                                    <div className="text-xl font-black text-slate-900 tracking-tighter tabular-nums">
                                        {formatAmount(order.totalPrice || 0)} ₽
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {order.quantity} шт.
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="lg:col-span-2 flex justify-center lg:justify-end gap-3">
                                    <button
                                        onClick={() => handleCancel(order.id)}
                                        className="w-12 h-12 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="py-24 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3.5rem] space-y-6">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                                <Calendar className="w-10 h-10 text-slate-200" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm">Нет запланированных заказов</h3>
                                <p className="text-xs font-bold text-slate-400">Вы можете запланировать выполнение услуги при на этапе оформления заказа</p>
                            </div>
                            <Link href="/catalog" className="inline-block px-8 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-slate-900 transition-all">
                                Перейти в каталог
                            </Link>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


