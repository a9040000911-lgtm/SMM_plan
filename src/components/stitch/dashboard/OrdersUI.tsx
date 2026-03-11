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
    Package, Search, Calendar,
    Hash, AlignLeft,
    ArrowUpRight, Clock, RotateCcw, Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BrandIcon } from '@/components/stitch/ui/BrandIcon';
import { formatAmount } from '@/utils/formatter';

interface Order {
    id: number;
    status: string;
    quantity: number;
    totalPrice: any; // Decimal form prisma
    link: string;
    initialCount: number | null;
    remains: number | null;
    createdAt: Date;
    internalService?: {
        name: string;
        platform: string;
    };
}

interface OrdersUIProps {
    initialOrders: Order[];
}

const statusFilters = [
    { key: 'ALL', label: 'Все заказы', icon: <AlignLeft size={14} /> },
    { key: 'ACTIVE', label: 'В работе', icon: <Zap size={14} /> },
    { key: 'COMPLETED', label: 'Завершено', icon: <CheckCircle2 size={14} /> },
    { key: 'ERROR', label: 'Проблемные', icon: <AlertCircle size={14} /> },
];

const statusConfig: Record<string, { color: string, label: string }> = {
    PENDING: { color: 'bg-blue-50 text-blue-600 border-blue-100', label: 'Ожидает' },
    PROCESSING: { color: 'bg-violet-50 text-violet-600 border-violet-100', label: 'В работе' },
    IN_PROGRESS: { color: 'bg-indigo-50 text-indigo-600 border-indigo-100', label: 'Выполняется' },
    COMPLETED: { color: 'bg-emerald-50 text-emerald-600 border-emerald-100', label: 'Выполнен' },
    PARTIAL: { color: 'bg-orange-50 text-orange-600 border-orange-100', label: 'Частично' },
    CANCELED: { color: 'bg-rose-50 text-rose-600 border-rose-100', label: 'Отменен' },
    ERROR: { color: 'bg-rose-50 text-rose-600 border-rose-100', label: 'Ошибка' },
};

import { Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export function OrdersUI({ initialOrders }: OrdersUIProps) {
    const [filter, setFilter] = useState('ALL');
    const [search, setSearch] = useState('');

    const filtered = initialOrders.filter(o => {
        const matchesFilter = filter === 'ALL'
            || (filter === 'ACTIVE' && ['PENDING', 'PROCESSING', 'IN_PROGRESS'].includes(o.status))
            || (filter === 'COMPLETED' && o.status === 'COMPLETED')
            || (filter === 'ERROR' && ['ERROR', 'CANCELED', 'PARTIAL'].includes(o.status));

        const matchesSearch = !search || o.id.toString().includes(search)
            || o.internalService?.name?.toLowerCase().includes(search.toLowerCase())
            || o.link?.toLowerCase().includes(search.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    return (
        <div className="space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Мои <span className="text-blue-600">Заказы</span></h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Полная история вашей активности</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Обновлено только что</span>
                    </div>
                    <Link href="/catalog">
                        <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95">
                            <Plus size={16} /> Новый заказ
                        </button>
                    </Link>
                </div>
            </div>

            {/* Filters & Search - Premium Bar */}
            <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                <div className="flex p-1.5 bg-slate-100/50 backdrop-blur-xl border border-slate-100 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
                    {statusFilters.map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                                filter === f.key
                                    ? "bg-white text-slate-900 shadow-xl shadow-slate-200 border border-slate-200/50"
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {f.icon}
                            {f.label}
                        </button>
                    ))}
                </div>

                <div className="relative w-full lg:max-w-md lg:ml-auto group">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                        <Search size={18} />
                    </div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Поиск по ID, названию или ссылке..."
                        className="w-full bg-white border border-slate-100 rounded-[2rem] py-4 pl-14 pr-6 text-xs font-bold text-slate-950 placeholder:text-slate-300 outline-none focus:border-blue-500/30 focus:shadow-2xl focus:shadow-blue-500/5 transition-all"
                    />
                </div>
            </div>

            {/* List Header Labels (Desktop Only) */}
            <div className="hidden lg:grid grid-cols-12 gap-6 px-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                <div className="col-span-1">Платформа</div>
                <div className="col-span-5">Подробности заказа</div>
                <div className="col-span-2 text-center">Прогресс</div>
                <div className="col-span-2 text-right">Стоимость</div>
                <div className="col-span-2 text-right">Статус</div>
            </div>

            {/* Orders List */}
            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode='popLayout'>
                    {filtered.length > 0 ? (
                        filtered.map((order, idx) => (
                            <OrderCard key={order.id} order={order} idx={idx} />
                        ))
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="py-32 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem]"
                        >
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <Package className="w-8 h-8 text-slate-200" />
                            </div>
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Пусто</h3>
                            <p className="text-xs font-bold text-slate-400">Ни одного заказа не найдено по вашему запросу</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function OrderCard({ order, idx }: { order: Order, idx: number }) {
    const isFinished = order.status === 'COMPLETED';
    const isStarting = ['PENDING', 'PROCESSING', 'ERROR', 'CANCELED'].includes(order.status);

    let completed = 0;
    let displayProgress = 0;

    if (isFinished) {
        completed = order.quantity;
        displayProgress = 100;
    } else if (!isStarting) {
        const remains = order.remains ?? order.quantity;
        completed = Math.max(0, order.quantity - remains);
        displayProgress = order.quantity > 0
            ? Math.min(100, Math.round((completed / order.quantity) * 100))
            : 0;
    }

    const conf = statusConfig[order.status] || statusConfig['PENDING'];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: Math.min(idx * 0.05, 0.5) }}
            className="group relative"
        >
            <Link href={`/dashboard/orders/${order.id}`}>
                <div className="bg-white border border-slate-100 rounded-[2.5rem] p-5 lg:p-8 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:items-center transition-all duration-500 hover:border-blue-100 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1">

                    {/* Platform Icon */}
                    <div className="lg:col-span-1 flex justify-center lg:justify-start">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all duration-300">
                            <BrandIcon name={order.internalService?.platform?.toLowerCase() as any || 'telegram'} size={24} colorMode="original" className="group-hover:scale-110 transition-transform" />
                        </div>
                    </div>

                    {/* Order Details */}
                    <div className="lg:col-span-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <h3 className="text-sm lg:text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate">
                                {order.internalService?.name || 'Услуга без названия'}
                            </h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-1.5"><Hash size={12} className="text-slate-300" /> {order.id}</div>
                            <div className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-300" /> {new Date(order.createdAt).toLocaleDateString('ru-RU')}</div>
                        </div>
                    </div>

                    {/* Hover Actions Bar */}
                    <div className="lg:col-span-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                        <Link href={`/catalog?repeat=${order.id}`} className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-slate-200" title="Повторить заказ">
                            <RotateCcw size={14} />
                        </Link>
                        <Link href="/dashboard/support" className="p-2.5 bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 rounded-xl transition-all shadow-sm" title="Поддержка">
                            <Headphones size={14} />
                        </Link>
                    </div>

                    {/* Progress */}

                    {/* Progress */}
                    <div className="lg:col-span-2 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-400">Пульс</span>
                            <span className="text-slate-900">{displayProgress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${displayProgress}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full",
                                    isFinished ? "bg-emerald-500" : "bg-gradient-to-r from-blue-400 to-blue-600"
                                )}
                            />
                        </div>
                        <div className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-widest">
                            {completed} / {order.quantity}
                        </div>
                    </div>

                    {/* Price */}
                    <div className="lg:col-span-2 text-center lg:text-right">
                        <div className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums">
                            {formatAmount(order.totalPrice)}
                            <span className="text-xs ml-1 text-slate-300 italic pr-1">₽&nbsp;</span>
                        </div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Итоговая сумма</div>
                    </div>

                    {/* Status Toggle */}
                    <div className="lg:col-span-2 flex justify-center lg:justify-end">
                        <div className={cn(
                            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm",
                            conf.color
                        )}>
                            {conf.label}
                        </div>
                    </div>

                    {/* Hover Decoration */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={16} className="text-slate-300" />
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

import { Plus } from 'lucide-react';
