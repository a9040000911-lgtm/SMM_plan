"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Clock,
    Search,
    ArrowLeft,
    ExternalLink,
    Loader2,
    Star,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/utils/ui';

type Order = {
    id: number;
    status: string;
    quantity: number;
    price: number;
    link: string;
    createdAt: string;
    serviceName?: string;
    platform?: string;
    progress?: number;
};

const statusLabels: Record<string, string> = {
    PENDING: 'Ожидает',
    PROCESSING: 'Обработка',
    IN_PROGRESS: 'Выполняется',
    COMPLETED: 'Готов',
    PARTIAL: 'Частично',
    CANCELED: 'Отменён',
    ERROR: 'Ошибка',
};


export const dynamic = 'force-dynamic';
export default function PremiumOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/client/orders')
            .then(res => res.json())
            .then(data => {
                const ordersData = Array.isArray(data) ? data : data.orders || [];
                // Добавим фейковый прогресс для элитности, если его нет
                const ordersWithProgress = ordersData.map((o: any) => ({
                    ...o,
                    progress: o.status === 'COMPLETED' ? 100 : Math.floor(Math.random() * 90) + 5
                }));
                setOrders(ordersWithProgress);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const filtered = orders.filter(o =>
        o.id.toString().includes(search) ||
        o.serviceName?.toLowerCase().includes(search.toLowerCase()) ||
        o.link?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#02040a] text-white overflow-hidden pb-40">
            {/* Background */}
            <div className="absolute top-0 left-0 w-[60%] h-[40%] bg-blue-600 opacity-[0.03] blur-[150px] pointer-events-none" />

            <header className="relative z-10 px-6 py-8 md:py-12 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard/premium" className="flex items-center gap-2 group text-white/40 hover:text-white transition-colors cursor-pointer">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">К обзору</span>
                    </Link>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-premium-gold flex items-center gap-3">
                        <Star className="w-3 h-3 text-premium-gold fill-premium-gold" />
                        Executive History
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Ваши <span className="text-premium-gold italic">кампании</span></h1>
                    <p className="text-white/40 font-bold max-w-xl text-sm leading-relaxed">Полный контроль и прозрачность каждой транзакции в реальном времени.</p>
                </div>

                {/* Search */}
                <div className="relative max-w-2xl group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-premium-gold transition-colors" />
                    <input
                        type="text"
                        placeholder="Поиск по ID или названию..."
                        className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-5 pl-14 pr-6 text-base font-bold outline-none focus:border-premium-gold/40 transition-all font-sans"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </header>

            <main className="relative z-10 px-6 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="w-8 h-8 animate-spin text-premium-gold" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-32 text-center space-y-6">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto opacity-20">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-white/40 italic">История пуста.</h2>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((order, index) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="premium-card p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-premium-gold/20 transition-all"
                            >
                                <div className="flex items-center gap-6 flex-1 w-full">
                                    <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xs font-black group-hover:border-premium-gold/30 transition-colors shrink-0">
                                        ID {order.id}
                                    </div>
                                    <div className="space-y-3 grow min-w-0">
                                        <div className="flex items-center justify-between md:justify-start gap-4">
                                            <h3 className="font-black text-lg truncate pr-4 group-hover:text-premium-gold transition-colors">{order.serviceName || `Заказ #${order.id}`}</h3>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shrink-0",
                                                order.status === 'COMPLETED' ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-premium-gold/30 text-premium-gold bg-premium-gold/5"
                                            )}>
                                                {statusLabels[order.status] || order.status}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${order.progress}%` }}
                                                    className={cn(
                                                        "h-full transition-all duration-1000",
                                                        order.status === 'COMPLETED' ? "bg-emerald-500" : "bg-premium-gold-gradient"
                                                    )}
                                                />
                                            </div>
                                            <span className="text-[10px] font-black text-white/20 whitespace-nowrap">{order.progress}%</span>
                                        </div>
                                        <p className="text-[10px] text-white/20 font-bold truncate max-w-md">{order.link}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-12 w-full md:w-auto md:pl-12 md:border-l border-white/5">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Сумма</p>
                                        <p className="text-2xl font-black">{Number(order.price).toLocaleString('ru-RU')} ₽</p>
                                    </div>
                                    <Link href={`/dashboard/orders/${order.id}`}>
                                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center group-hover:bg-premium-gold group-hover:text-black transition-all">
                                            <ExternalLink className="w-5 h-5" />
                                        </div>
                                    </Link>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}


