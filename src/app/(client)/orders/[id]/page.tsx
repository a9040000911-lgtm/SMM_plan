"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { 
    Loader2, ArrowLeft, Link as LinkIcon, 
    Calendar, Activity, 
    ShieldCheck, HelpCircle, ExternalLink,
    CheckCircle2, Clock, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChurnIndicator } from "@/components/client/ChurnIndicator";
import { SmartUpsell } from "@/components/marketing/SmartUpsell";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';

export default function OrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [canceling, setCanceling] = useState(false);
    const [supportBot, setSupportBot] = useState('smmplan_support_bot');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                // We reuse the list endpoint with a filter or create a new dedicated one.
                // For simplicity, let's assume we need a dedicated ID endpoint or filter the list.
                // Ideally, we'd have /api/client/orders/[id], but I'll update the plan to create it or skip it efficiently.
                // Wait, I didn't create /api/client/orders/[id]/route.ts yet. 
                // I will fetch the list and find one for now to save time, OR implement the route.
                // Implementing route is better.
                const res = await fetch(`/api/client/orders/${params.id}`);
                if (res.ok) setOrder(await res.json());
                else if (res.status === 404) router.push('/orders');

                const confRes = await fetch('/api/client/config');
                if (confRes.ok) {
                    const confDat = await confRes.json();
                    if (confDat?.config?.supportBot) setSupportBot(confDat.config.supportBot);
                }
            } catch (_error) { console.error(_error); }
            finally { setLoading(false); }
        };

        fetchOrder();
    }, [params.id, router]);

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
                // eslint-disable-next-line no-undef
                alert(data.message);
                window.location.reload();
            } else {
                // eslint-disable-next-line no-undef
                alert(data.message || data.error);
                if (!data.error) window.location.reload(); // Also reload to see cancelRequested if it was a request
            }
        } catch (e: any) {
            // eslint-disable-next-line no-undef
            alert('Ошибка при попытке отменить заказ');
        } finally {
            setCanceling(false);
        }
    };

    const isCancelable = order?.isCancelEnabled && ['PENDING', 'AWAITING_PAYMENT', 'PROCESSING', 'IN_PROGRESS'].includes(order?.status) && !order?.cancelRequested;

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;
    if (!order) return null;

    return (
        <div className="max-w-3xl mx-auto space-y-8 pb-32">
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
            >
                <Link href="/orders" className="group inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all text-[11px] font-black uppercase tracking-[0.2em]">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
                    Назад к истории
                </Link>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-slate-100 rounded-[3rem] p-10 md:p-14 shadow-2xl shadow-blue-500/5 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
                
                <div className="relative z-10 space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-50">
                        <div className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600/50">Детали заказа</span>
                            <h1 className="text-4xl font-black italic tracking-tighter text-slate-950 flex items-center gap-4">
                                #{order.publicId || order.id}
                                <span className="text-sm font-bold text-slate-300 not-italic">SMM-2026</span>
                            </h1>
                        </div>
                        <BadgeStatus status={order.status} size="lg" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Activity size={12} className="text-blue-600" /> Выбранная услуга
                                </label>
                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:border-blue-200 transition-colors">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">
                                        {order.platform} • {order.category}
                                    </div>
                                    <div className="font-black text-xl text-slate-950 uppercase italic leading-tight">{order.serviceName}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <LinkIcon size={12} className="text-blue-600" /> Целевая ссылка
                                </label>
                                <div className="flex items-center gap-3 p-5 bg-white border border-slate-100 rounded-2xl group cursor-pointer hover:border-blue-500 transition-all overflow-hidden"
                                     onClick={() => window.open(order.link, '_blank')}>
                                    <div className="text-xs font-bold text-slate-500 truncate flex-1 tracking-tight">{order.link}</div>
                                    <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-600 shrink-0" />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-6 bg-slate-950 rounded-[2.5rem] text-white space-y-2 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500 opacity-10" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Количество</span>
                                    <div className="font-black text-3xl tabular-nums italic">{order.quantity}</div>
                                </div>
                                <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] space-y-2 group hover:border-emerald-200 transition-colors">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">Инвестиции</span>
                                    <div className="font-black text-3xl tabular-nums italic text-slate-950">
                                        {Number(order.totalPrice || order.price).toFixed(0)}
                                        <span className="text-lg text-slate-300 ml-1">₽</span>
                                    </div>
                                </div>
                            </div>

                            {order.status === 'PROCESSING' && (
                                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100/50 space-y-4">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-blue-600">
                                        <span>Прогресс выполнения</span>
                                        <span className="animate-pulse">Active</span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="h-3 w-full bg-white rounded-full overflow-hidden border border-blue-100">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: '45%' }}
                                                className="h-full bg-blue-600 rounded-full"
                                            />
                                        </div>
                                        <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                            <span>Начало: {order.start_count || 0}</span>
                                            <span>Цель: {(order.start_count || 0) + order.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-6 bg-slate-50 rounded-[2rem] flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <span className="flex items-center gap-2"><Calendar size={14} className="text-blue-500" /> {new Date(order.createdAt).toLocaleDateString()}</span>
                                <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Churn Prediction Indicator */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <ChurnIndicator orderId={order.id} />
                
                {/* Marketing Post-Purchase Funnel */}
                {(order.status === 'PROCESSING' || order.status === 'COMPLETED' || order.status === 'IN_PROGRESS') && order.serviceId && (
                    <SmartUpsell originalServiceId={order.serviceId} />
                )}
            </motion.div>

            <div className="flex flex-col items-center gap-6 pt-4">
                <div className="flex items-center gap-6">
                    <a href={`https://t.me/${supportBot}?start=support_order_${order.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors group">
                        <HelpCircle size={16} className="group-hover:rotate-12 transition-transform" /> Поддержка 24/7
                    </a>
                    
                    {isCancelable && (
                        <button 
                            disabled={canceling}
                            onClick={handleCancel}
                            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-500 transition-colors group disabled:opacity-50"
                        >
                            {canceling ? <Loader2 size={16} className="animate-spin" /> : <AlertCircle size={16} className="group-hover:shake" />}
                            Отменить заказ {order.status === 'PROCESSING' && '(Запрос)'}
                        </button>
                    )}
                    
                    {order.cancelRequested && (
                        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-500">
                            <Clock size={16} /> Ожидает отмены (Рассматривается)
                        </span>
                    )}
                </div>
                
                <div className="p-6 bg-white border border-slate-100 rounded-3xl max-w-sm w-full text-center space-y-4">
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                        Мы гарантируем выполнение в полном объеме. Если статус заказа не меняется более 24 часов — пожалуйста, напишите нам.
                    </p>
                    <div className="flex justify-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                            <ShieldCheck size={16} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface BadgeStatusProps {
    status: string;
    size?: 'sm' | 'lg';
}

const BadgeStatus = ({ status, size = 'sm' }: BadgeStatusProps) => {
    const config: Record<string, { color: string, label: string, icon: any }> = {
        PENDING: { color: "bg-amber-50 text-amber-600 border-amber-100", label: "Ожидание", icon: <Clock size={size === 'lg' ? 14 : 10} className="animate-pulse" /> },
        PROCESSING: { color: "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20", label: "В процессе", icon: <Activity size={size === 'lg' ? 14 : 10} /> },
        COMPLETED: { color: "bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20", label: "Исполнено", icon: <CheckCircle2 size={size === 'lg' ? 14 : 10} /> },
        PARTIAL: { color: "bg-orange-50 text-orange-600 border-orange-100", label: "Частично", icon: <AlertCircle size={size === 'lg' ? 14 : 10} /> },
        CANCELED: { color: "bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-500/20", label: "Отмена", icon: <AlertCircle size={size === 'lg' ? 14 : 10} /> },
        AWAITING_PAYMENT: { color: "bg-slate-100 text-slate-400 border-slate-200", label: "Ждет оплаты", icon: <Clock size={size === 'lg' ? 14 : 10} /> }
    };

    const current = config[status] || { color: "bg-slate-50 text-slate-400 border-slate-100", label: status, icon: null };

    return (
        <span className={`${size === 'lg' ? 'text-[11px] px-5 py-2.5 rounded-2xl' : 'text-[9px] px-3 py-1.5 rounded-lg'} font-black uppercase tracking-widest border leading-none inline-flex items-center gap-3 transition-all ${current.color}`}>
            {current.icon}
            {current.label}
        </span>
    );
};
