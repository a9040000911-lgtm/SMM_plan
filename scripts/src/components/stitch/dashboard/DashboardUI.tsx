"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
    Package, CheckCircle2, Zap,
    ArrowUpRight, Target, Headphones,
    TrendingUp, Wallet, ShieldCheck, Clock
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BrandIcon } from '@/components/stitch/ui/BrandIcon';
import { formatAmount } from '@/utils/formatter';

interface DashboardUIProps {
    user: any;
    stats: {
        activeCount: number;
        completedCount: number;
        totalSpent: number;
    };
    recentOrders: any[];
}

export function DashboardUI({ user, stats, recentOrders }: DashboardUIProps) {
    const [quickLink, setQuickLink] = React.useState('');

    return (
        <div className="space-y-6 pb-20">
            {/* Header / Greeting */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-4"
            >
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-100/50">
                            Личный кабинет
                        </span>
                        {user.role === 'ADMIN' && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-amber-100/50">
                                Admin
                            </span>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900 leading-tight">
                        С возвращением, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic pr-1">
                            {user.username || 'Пользователь'}&nbsp;
                        </span>
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/catalog" className="flex-1 md:flex-none">
                        <button className="w-full px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 shadow-lg shadow-slate-200">
                            Каталог услуг
                        </button>
                    </Link>
                </div>
            </motion.div>

            {/* Bento Grid Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Main Balance Card - More Compact */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-12 xl:col-span-7 relative group p-8 bg-slate-950 rounded-[2rem] overflow-hidden shadow-xl shadow-blue-900/5 flex flex-col md:flex-row gap-8 items-center"
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

                    <div className="relative z-10 flex-1 w-full space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-white/10 backdrop-blur-xl border border-white/10 rounded-xl flex items-center justify-center">
                                    <Wallet className="text-blue-400 w-4 h-4" />
                                </div>
                                <span className="text-blue-100/40 text-[9px] font-black uppercase tracking-[0.2em]">Ваш баланс</span>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-2 text-white">
                            <span className="text-5xl font-black tracking-tighter tabular-nums">
                                {formatAmount(user.balance)}
                            </span>
                            <span className="text-xl font-black text-blue-500 italic uppercase pr-1">rub&nbsp;</span>
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Link href="/dashboard/transactions" className="flex-1">
                                <button className="w-full py-3.5 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-50 transition-all shadow-lg shadow-white/5 active:scale-95">
                                    Пополнить счет
                                </button>
                            </Link>
                            <Link href="/dashboard/transactions" className="p-3.5 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 transition-all">
                                <Clock size={16} />
                            </Link>
                        </div>
                    </div>

                    {/* Quick Order Inline Widget */}
                    <div className="relative z-10 w-full md:w-80 p-6 bg-white/5 backdrop-blur-md rounded-2.5xl border border-white/10 flex flex-col gap-4">
                        <div className="text-[9px] font-black text-blue-300 uppercase tracking-widest flex items-center gap-2">
                            <Zap size={12} /> Мгновенный заказ
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Вставьте ссылку..."
                                value={quickLink}
                                onChange={(e) => setQuickLink(e.target.value)}
                                className="w-full bg-white/10 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white placeholder:text-white/20 outline-none focus:border-blue-500/50 transition-all"
                            />
                            {quickLink && (
                                <Link
                                    href={`/catalog?link=${encodeURIComponent(quickLink)}`}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                                >
                                    <ArrowUpRight size={14} />
                                </Link>
                            )}
                        </div>
                        <p className="text-[8px] text-white/40 font-bold leading-relaxed">
                            ИИ автоматически подберет лучшую <br /> услугу для вашего контента
                        </p>
                    </div>
                </motion.div>

                {/* Vertical Stat Column */}
                <div className="lg:col-span-6 xl:col-span-2 flex flex-col gap-4">
                    <StatCard
                        icon={<CheckCircle2 size={16} />}
                        label="Завершено"
                        value={stats.completedCount}
                        color="emerald"
                        delay={0.1}
                    />
                    <StatCard
                        icon={<Zap size={16} />}
                        label="В работе"
                        value={stats.activeCount}
                        color="blue"
                        delay={0.15}
                    />
                </div>

                {/* Total Spent Widget */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-6 xl:col-span-3 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex flex-col justify-between group overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={100} strokeWidth={3} className="text-slate-900" />
                    </div>

                    <div>
                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center mb-4">
                            <ShieldCheck className="text-slate-400 w-5 h-5" />
                        </div>
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Инвестировано</div>
                        <div className="text-3xl font-black text-slate-900 tracking-tighter">
                            {formatAmount(stats.totalSpent)}
                            <span className="text-sm ml-1 text-slate-300 italic pr-1">₽&nbsp;</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-[9px] uppercase tracking-widest">
                        <TrendingUp size={12} /> Live Статистика
                    </div>
                </motion.div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10">
                {/* Recent Orders - The "Glassy" List */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-7 space-y-6"
                >
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Актуальные заказы</h3>
                        </div>
                        <Link href="/dashboard/orders" className="text-[10px] font-black text-blue-600 border-b border-blue-600/30 hover:border-blue-600 transition-all uppercase tracking-widest">Смотреть историю</Link>
                    </div>

                    <div className="grid gap-3">
                        {recentOrders.length > 0 ? (
                            recentOrders.map((order, idx) => (
                                <OrderListItem key={order.id} order={order} idx={idx} />
                            ))
                        ) : (
                            <div className="py-20 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                                <Package size={40} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">У вас пока нет активных заказов</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Quick Actions & Support */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="lg:col-span-5 space-y-6"
                >
                    <div className="px-2">
                        <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Быстрые действия</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <ActionCard
                            icon={<Target />}
                            title="Массовый заказ"
                            desc="Для крупных партий и агентств"
                            href="/mass"
                            color="indigo"
                        />
                        <ActionCard
                            icon={<Zap />}
                            title="Полный каталог"
                            desc="Более 850+ активных услуг"
                            href="/catalog"
                            color="blue"
                        />
                        <ActionCard
                            icon={<Headphones />}
                            title="Служба заботы"
                            desc="Поможем с любым вопросом"
                            href="/dashboard/support"
                            color="emerald"
                        />
                    </div>

                    {/* Pro Tip Card */}
                    <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] text-white overflow-hidden relative group">
                        <div className="absolute top-0 right-0 p-6 opacity-20 rotate-12 group-hover:rotate-0 transition-transform">
                            <ShieldCheck size={80} />
                        </div>
                        <div className="relative z-10">
                            <h4 className="font-black text-xl mb-2 tracking-tight">Безопасность прежде всего</h4>
                            <p className="text-blue-100 text-xs font-medium leading-relaxed opacity-80">
                                Мы используем алгоритмы плавного запуска <br />
                                для всех услуг, чтобы защитить ваш <br />
                                аккаунт от алгоритмов Instagram и VK.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color, delay }: { icon: any, label: string, value: number, color: 'blue' | 'emerald', delay: number }) {
    const colors = {
        blue: "bg-blue-50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50 text-emerald-600 border-emerald-100"
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay }}
            className="flex-1 p-6 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all group overflow-hidden relative"
        >
            <div className="flex flex-col h-full justify-between">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-4 border transition-all group-hover:rotate-6", colors[color])}>
                    {icon}
                </div>
                <div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{label}</div>
                    <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{value}</div>
                </div>
            </div>
        </motion.div>
    );
}

function OrderListItem({ order, idx }: { order: any, idx: number }) {
    const statusColors: any = {
        'COMPLETED': "bg-emerald-50 text-emerald-600 border-emerald-100",
        'PENDING': "bg-blue-50 text-blue-600 border-blue-100",
        'PROCESSING': "bg-violet-50 text-violet-600 border-violet-100",
        'FAILED': "bg-rose-50 text-rose-600 border-rose-100",
        'CANCELLED': "bg-slate-50 text-slate-500 border-slate-100",
    };

    const statusMap: any = {
        'COMPLETED': 'Выполнен',
        'PENDING': 'Ожидает',
        'PROCESSING': 'В работе',
        'IN_PROGRESS': 'В работе',
        'FAILED': 'Ошибка',
        'CANCELLED': 'Отменен',
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + (idx * 0.05) }}
            className="group p-5 bg-white border border-slate-100 rounded-[2rem] flex flex-col md:flex-row md:items-center gap-4 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all"
        >
            <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                    <BrandIcon name={order.internalService?.platform?.toLowerCase() as any || 'telegram'} size={24} colorMode="original" className="opacity-80 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black text-slate-950 uppercase tracking-tight truncate leading-none">
                            {order.internalService?.name || 'Услуга без названия'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {new Date(order.createdAt).toLocaleDateString('ru-RU')} • ID #{order.id.toString().slice(-6)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-slate-50">
                <div className="text-right">
                    <div className="text-lg font-black text-slate-900 tracking-tight tabular-nums">
                        {formatAmount(order.totalPrice)}₽
                    </div>
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Стоимость</div>
                </div>
                <div className={cn(
                    "px-4 py-2 border rounded-xl text-[10px] font-black uppercase tracking-widest",
                    statusColors[order.status] || statusColors['PENDING']
                )}>
                    {statusMap[order.status] || order.status}
                </div>
            </div>
        </motion.div>
    );
}

function ActionCard({ icon, title, desc, href, color }: { icon: any, title: string, desc: string, href: string, color: 'blue' | 'indigo' | 'emerald' }) {
    const colors = {
        blue: "text-blue-500 bg-blue-50/50 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-500/20",
        indigo: "text-indigo-500 bg-indigo-50/50 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-500/20",
        emerald: "text-emerald-500 bg-emerald-50/50 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-emerald-500/20"
    };

    return (
        <Link href={href}>
            <div className="group flex items-center gap-5 p-5 bg-white border border-slate-50 rounded-[2.5rem] hover:border-white hover:shadow-2xl hover:shadow-slate-200 transition-all">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300", colors[color])}>
                    {React.cloneElement(icon, { size: 24 })}
                </div>
                <div className="flex-1">
                    <div className="text-sm font-black text-slate-950 uppercase tracking-tight flex items-center justify-between">
                        {title}
                        <ArrowUpRight size={14} className="text-slate-300 group-hover:text-slate-900 transition-colors" />
                    </div>
                    <div className="text-xs text-slate-400 font-bold tracking-tight mt-0.5">{desc}</div>
                </div>
            </div>
        </Link>
    );
}
