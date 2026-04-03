"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft, ExternalLink, Clock, CheckCircle2,
    Package, AlertTriangle, Link2, Hash, CreditCard,
    TrendingUp, Zap, ShieldCheck,
    Calendar, ArrowRight, Loader2, AlertCircle, XCircle
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { BrandIcon } from '@/components/stitch/ui/BrandIcon';
import { ChurnIndicator } from '@/components/client/ChurnIndicator';
import { SmartUpsell } from '@/components/marketing/SmartUpsell';

interface Order {
    id: number;
    status: string;
    quantity: number;
    totalPrice: any;
    link: string;
    initialCount: number | null;
    remains: number | null;
    createdAt: Date;
    updatedAt: Date;
    serviceId?: number;
    isCancelEnabled?: boolean;
    cancelRequested?: boolean;
    internalService?: {
        name: string;
        platform: string;
        category: string;
        requirements?: string | null;
        numericId?: number;
    };
}

interface OrderDetailsUIProps {
    order: Order;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
    PENDING: { label: 'Ожидает', color: 'text-blue-600', bg: 'bg-blue-50', icon: Clock },
    PROCESSING: { label: 'В работе', color: 'text-violet-600', bg: 'bg-violet-50', icon: Zap },
    IN_PROGRESS: { label: 'Выполняется', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: TrendingUp },
    COMPLETED: { label: 'Завершен', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    PARTIAL: { label: 'Частично', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle },
    CANCELED: { label: 'Отменен', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle },
    ERROR: { label: 'Ошибка', color: 'text-rose-600', bg: 'bg-rose-50', icon: AlertTriangle },
};

export function OrderDetailsUI({ order }: OrderDetailsUIProps) {
    const [canceling, setCanceling] = useState(false);
    const sc = statusConfig[order.status] || statusConfig.PENDING;
    const StatusIcon = sc.icon;

    const isCancelable = order.isCancelEnabled &&
        ['PENDING', 'AWAITING_PAYMENT', 'PROCESSING', 'IN_PROGRESS'].includes(order.status) &&
        !order.cancelRequested;

    const handleCancel = async () => {
        if (!confirm('Вы уверены, что хотите отменить этот заказ?')) return;
        setCanceling(true);
        try {
            const res = await fetch(`/api/client/orders/${order.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'CANCEL' })
            });
            const data = await res.json();
            if (data.success) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message || data.error);
                if (!data.error) window.location.reload();
            }
        } catch {
            alert('Ошибка при попытке отменить заказ');
        } finally {
            setCanceling(false);
        }
    };

    const isFinished = order.status === 'COMPLETED';
    const isStarting = ['PENDING', 'PROCESSING', 'ERROR', 'CANCELED'].includes(order.status);

    let completed = 0;
    let progress = 0;

    if (isFinished) {
        completed = order.quantity;
        progress = 100;
    } else if (!isStarting) {
        const remains = order.remains ?? order.quantity;
        completed = Math.max(0, order.quantity - remains);
        progress = order.quantity > 0 ? Math.min(100, Math.round((completed / order.quantity) * 100)) : 0;
    }

    return (
        <div className="space-y-10 pb-20 max-w-5xl">
            {/* Back Navigation */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/dashboard/orders" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">
                    <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                        <ArrowLeft size={16} />
                    </div>
                    Назад к истории
                </Link>
            </motion.div>

            {/* Header Hero */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                            <BrandIcon name={order.internalService?.platform.toLowerCase() as any || 'telegram'} size={24} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] leading-none mb-1">
                                {order.internalService?.platform} • {order.internalService?.category} {(order.internalService?.numericId) && `• ID: #${order.internalService.numericId}`}
                            </p>
                            <h1 className="text-4xl font-black text-slate-950 tracking-tighter uppercase italic">{order.internalService?.name}</h1>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "px-8 py-4 rounded-[2rem] border-2 flex items-center gap-4 text-xs font-black uppercase tracking-widest shadow-xl shadow-current/5 transition-all duration-700",
                    sc.bg, sc.color, "border-current/10"
                )}>
                    <StatusIcon size={18} strokeWidth={2.5} />
                    {sc.label}
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Progress Tracking Column */}
                <div className="lg:col-span-12 space-y-8">
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-blue-900/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex items-center justify-between mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                    <TrendingUp size={24} />
                                </div>
                                <h2 className="text-xl font-black text-slate-950 uppercase tracking-tight italic">Диспетчер <span className="text-blue-600">выполнения</span></h2>
                            </div>
                            <div className="text-3xl font-black text-slate-950 tracking-tighter tabular-nums">{progress}%</div>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 2, ease: "easeOut" }}
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 relative",
                                        isFinished ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)] animate-shimmer" />
                                </motion.div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
                                <StatItem label="На старте" value={order.initialCount ?? '-'} icon={<Zap size={12} />} />
                                <StatItem label="Выполнено" value={completed.toLocaleString('ru-RU')} icon={<CheckCircle2 size={12} />} active />
                                <StatItem label="Всего" value={order.quantity.toLocaleString('ru-RU')} icon={<Package size={12} />} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Cards Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Link Card */}
                    <div className="bg-slate-950 rounded-[3rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5">
                                <Link2 size={24} />
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-widest">Целевой объект</h3>
                        </div>

                        <a href={order.link} target="_blank" className="relative z-10 group/link flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 border border-white/5 rounded-[2rem] transition-all overflow-hidden duration-500">
                            <span className="text-blue-200 font-bold break-all pr-10">{order.link}</span>
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center opacity-0 group-hover/link:opacity-100 -translate-x-4 group-hover/link:translate-x-0 transition-all">
                                <ExternalLink size={20} />
                            </div>
                        </a>
                    </div>

                    {order.internalService?.requirements && (
                        <div className="flex gap-4 p-6 bg-amber-50 border border-amber-200 rounded-[2rem] text-amber-900 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                            <div className="mt-1 shrink-0">
                                <AlertTriangle size={24} className="text-amber-500" />
                            </div>
                            <div className="space-y-1 relative z-10">
                                <h4 className="text-xs font-black uppercase tracking-widest text-amber-700">Важное техническое требование</h4>
                                <p className="text-sm font-medium text-amber-900/80 leading-relaxed">
                                    {order.internalService.requirements}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Timeline Card */}
                    <div className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-12 shadow-sm">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                                <Clock size={24} />
                            </div>
                            <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight italic">Информационное <span className="text-blue-600">табло</span></h3>
                        </div>

                        <div className="space-y-0 relative pl-4 lg:pl-6">
                            <div className="absolute left-6 lg:left-8 top-4 bottom-8 w-px bg-slate-100" />

                            <TimelineEvent label="Заказ зарегистрирован" date={order.createdAt} active />

                            {order.status !== 'PENDING' && (
                                <TimelineEvent label="Принят в облачную сеть Smmplan" date={order.updatedAt} active />
                            )}

                            {['IN_PROGRESS', 'COMPLETED', 'PARTIAL'].includes(order.status) && (
                                <TimelineEvent label="Трафик успешно запущен" date={order.updatedAt} active />
                            )}

                            {order.status === 'COMPLETED' && (
                                <TimelineEvent label="Услуга полностью оказана" date={order.updatedAt} active isLast />
                            )}

                            {['CANCELED', 'ERROR'].includes(order.status) && (
                                <TimelineEvent label="Процесс остановлен системой" date={order.updatedAt} active error isLast />
                            )}
                        </div>
                    </div>
                </div>

                {/* Fast Specs Column */}
                <div className="lg:col-span-4 space-y-6">
                    <SpecCard label="ID Операции" value={`#${order.id}`} icon={<Hash size={16} />} />
                    <SpecCard label="Стоимость" value={`${Number(order.totalPrice)} ₽`} icon={<CreditCard size={16} />} color="emerald" />
                    <SpecCard label="Дата создания" value={new Date(order.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })} icon={<Calendar size={16} />} />

                    <div className="p-8 bg-blue-50 border border-blue-100 rounded-[2.5rem] space-y-4">
                        <div className="flex items-center gap-3 text-blue-600">
                            <ShieldCheck size={20} />
                            <span className="text-[10px] font-black uppercase tracking-widest">SMM Warranty</span>
                        </div>
                        <p className="text-[10px] font-bold text-blue-700/60 leading-relaxed uppercase tracking-tight">Если количество участников упадет ниже заданного уровня, воспользуйтесь формой поддержки для восстановления.</p>
                        <Link href="/dashboard/support">
                            <button className="flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase hover:translate-x-1 transition-transform">Связаться с нами <ArrowRight size={14} /></button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Churn Prediction & Marketing Upsell */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="space-y-6">
                <ChurnIndicator orderId={String(order.id)} />
                {(order.status === 'PROCESSING' || order.status === 'COMPLETED' || order.status === 'IN_PROGRESS') && order.serviceId && (
                    <SmartUpsell originalServiceId={String(order.serviceId)} />
                )}
            </motion.div>

            {/* Cancel & Support Actions */}
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-6">
                    {isCancelable && (
                        <button
                            disabled={canceling}
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-6 py-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all disabled:opacity-50"
                        >
                            {canceling ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Отменить заказ {order.status === 'PROCESSING' && '(Запрос)'}
                        </button>
                    )}

                    {order.cancelRequested && (
                        <span className="flex items-center gap-2 px-6 py-3 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">
                            <Clock size={14} /> Ожидает отмены (Рассматривается)
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatItem({ label, value, icon, active }: { label: string, value: string | number, icon: any, active?: boolean }) {
    return (
        <div className={cn("p-6 rounded-2.5xl flex flex-col items-center justify-center text-center gap-2 transition-all", active ? "bg-slate-950 text-white shadow-xl" : "bg-slate-50 text-slate-400")}>
            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-1", active ? "bg-blue-600 text-white" : "bg-white text-slate-300")}>
                {icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</span>
            <span className="text-xl font-black tracking-tight leading-none">{value}</span>
        </div>
    );
}

function SpecCard({ label, value, icon, color = 'blue' }: { label: string, value: string, icon: any, color?: 'blue' | 'emerald' }) {
    const cls = color === 'blue' ? "text-blue-600 bg-blue-50" : "text-emerald-600 bg-emerald-50";
    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm group hover:shadow-xl hover:shadow-blue-900/5 transition-all">
            <div className="flex items-center gap-4 mb-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", cls)}>
                    {icon}
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
            </div>
            <div className="text-2xl font-black text-slate-950 tracking-tighter uppercase italic">{value}</div>
        </div>
    );
}

function TimelineEvent({ label, date, active, error, isLast }: { label: string, date: Date, active: boolean, error?: boolean, isLast?: boolean }) {
    return (
        <div className={cn("flex items-start gap-8 relative", !isLast && "pb-10")}>
            <div className="flex flex-col items-center shrink-0 relative z-10">
                <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-white shadow-md border",
                    error ? "bg-rose-500 border-rose-600" : active ? "bg-blue-600 border-blue-700" : "bg-slate-200 border-slate-300"
                )}>
                    {active && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                </div>
            </div>
            <div className="space-y-1">
                <p className={cn("text-sm font-black uppercase tracking-tight leading-none", error ? "text-rose-600" : active ? "text-slate-900" : "text-slate-300")}>{label}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(date).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
        </div>
    );
}


