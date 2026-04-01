"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, Suspense } from "react";
import { 
    Loader2, ExternalLink, ShoppingBag, 
    AlertCircle, CheckCircle2, ArrowRight,
    LogIn, PackageOpen, HelpCircle,
    Activity, Clock
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/utils/ui";
import { motion, AnimatePresence } from "framer-motion";

export const dynamic = 'force-dynamic';

export default function OrdersPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-20"><Loader2 className="animate-spin text-blue-600" /></div>}>
            <OrdersContent />
        </Suspense>
    );
}

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const page = parseInt(searchParams.get("page") || "1");
    const paymentStatus = searchParams.get("payment") || searchParams.get("status");

    const [orders, setOrders] = useState<any[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(true);

    useEffect(() => {
        // --- BROKEN LOOP CLEANUP ---
        // If we arrived with payment=success, clear any remaining drafts
        if (paymentStatus === 'success') {
            localStorage.removeItem('smmplan_draft_order');
            localStorage.removeItem('smmplan_draft_cart');
            localStorage.removeItem('cart'); // Clear main cart too on success
            window.dispatchEvent(new Event('cart-updated'));
        }

        const fetchOrders = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/client/orders?page=${page}&limit=20`);
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data.orders);
                    setTotalPages(data.totalPages);
                    setIsAuthenticated(true);
                } else if (res.status === 401) {
                    setIsAuthenticated(false);
                }
            } catch (_error) { 
                console.error(_error); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchOrders();
    }, [page, paymentStatus]);

    const handlePageChange = (newPage: number) => {
        router.push(`/orders?page=${newPage}`);
    };

    return (
        <div className="min-h-screen bg-white selection:bg-blue-600/10 selection:text-blue-600">
            {/* Background Aura */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.05)_0%,transparent_70%)] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 relative z-10">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
                    <div className="space-y-4">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest"
                        >
                            <PackageOpen size={12} /> История активности
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl font-black text-slate-950 leading-none tracking-tight">
                            Мои <span className="text-blue-600 italic">Заказы</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-xl">
                            Здесь отображаются все ваши текущие и прошлые заказы. Отслеживайте статус и прогресс выполнения в режиме реального времени.
                        </p>
                    </div>

                    <Link href="/catalog">
                        <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                            Создать новый заказ <ArrowRight size={16} />
                        </button>
                    </Link>
                </div>

                {/* Status Banners */}
                <AnimatePresence>
                    {paymentStatus === 'success' && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-10 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center gap-6 shadow-xl shadow-emerald-500/5"
                        >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-emerald-500 shrink-0">
                                <CheckCircle2 size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight italic">Заказ успешно оплачен!</h3>
                                <p className="text-sm text-slate-500 font-medium">Ваш платеж принят. Заказы уже поступили в работу и скоро начнут выполняться.</p>
                            </div>
                        </motion.div>
                    )}

                    {(paymentStatus === 'failed' || paymentStatus === 'fail') && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="mb-10 p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-6"
                        >
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-rose-500 shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-black text-slate-900 uppercase tracking-tight">Оплата не удалась</h3>
                                <p className="text-sm text-slate-500 font-medium">К сожалению, платеж не был завершен. Попробуйте еще раз или выберите другой способ оплаты.</p>
                            </div>
                            <Link href="/catalog">
                                <button className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-600 transition-all">
                                    Повторить
                                </button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <div className="bg-white border border-slate-100 rounded-[2.5rem] shadow-sm overflow-hidden relative min-h-[400px]">
                    {loading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-white/80 backdrop-blur-sm z-20">
                            <Loader2 className="animate-spin text-blue-600" size={40} />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Синхронизация данных...</span>
                        </div>
                    ) : null}

                    {!isAuthenticated ? (
                        <div className="py-32 px-10 text-center flex flex-col items-center max-w-lg mx-auto">
                            <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-8 rotate-3">
                                <LogIn className="text-blue-600 w-10 h-10" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-950 mb-4 uppercase leading-none tracking-tight">Требуется вход</h2>
                            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                                Чтобы просматривать историю своих заказов, необходимо войти в личный кабинет. Если вы оформили заказ как гость, данные для входа были отправлены на вашу почту.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full">
                                <Link href="/login" className="flex-1">
                                    <button className="w-full px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                                        Войти в аккаунт
                                    </button>
                                </Link>
                                <Link href="/support" className="flex-1">
                                    <button className="w-full px-8 py-4 bg-white border border-slate-100 text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                                        Помощь
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : orders.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                                {orders.map((order, idx) => (
                                    <motion.div
                                        key={order.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => router.push(`/orders/${order.id}`)}
                                        className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 blur-2xl pointer-events-none group-hover:bg-blue-100/50 transition-colors" />
                                        
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                                        {order.platform}
                                                    </span>
                                                    <span className="text-[10px] text-slate-300 font-black italic tracking-tighter">#{order.publicId || order.id}</span>
                                                </div>
                                                <h3 className="font-black text-slate-950 uppercase italic text-sm leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                                                    {order.serviceName}
                                                </h3>
                                            </div>
                                            <BadgeStatus status={order.status} />
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100/50">
                                                <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors shadow-sm">
                                                    <ExternalLink size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5 leading-none">Ссылка</p>
                                                    <p className="text-[11px] font-medium text-slate-500 truncate">{order.link}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="p-4 bg-slate-50/80 rounded-2xl text-center space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Пакет</span>
                                                    <span className="font-black text-lg text-slate-950 leading-none">{order.quantity}</span>
                                                </div>
                                                <div className="p-4 bg-slate-50/80 rounded-2xl text-center space-y-1">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Цена</span>
                                                    <span className="font-black text-lg text-slate-950 leading-none tracking-tighter">{Number(order.price).toFixed(0)} ₽</span>
                                                </div>
                                            </div>

                                            {order.status === 'PROCESSING' && (
                                                <div className="pt-2">
                                                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-blue-600 mb-2 px-1">
                                                        <span>В процессе исполнения</span>
                                                        <Activity size={10} className="animate-pulse" />
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '65%' }}
                                                            className="h-full bg-blue-600 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="p-8 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => handlePageChange(page - 1)}
                                        className="px-6 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Назад
                                    </button>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                        Страница <span className="text-blue-600">{page}</span> из {totalPages}
                                    </div>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => handlePageChange(page + 1)}
                                        className="px-6 py-2.5 bg-white border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition-all shadow-sm"
                                    >
                                        Вперед
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="py-32 px-10 text-center flex flex-col items-center max-w-lg mx-auto">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8 -rotate-3 group relative overflow-hidden">
                                <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <ShoppingBag className="text-slate-300 w-10 h-10 relative z-10 group-hover:text-white transition-colors" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-950 mb-4 uppercase leading-none tracking-tight">Пока пусто</h2>
                            <p className="text-slate-500 font-medium mb-10 leading-relaxed">
                                Вы еще не оформили ни одного заказа. Начните продвижение своего проекта прямо сейчас, выбрав подходящую услугу из нашего обширного каталога.
                            </p>
                            <Link href="/catalog" className="w-full sm:w-auto">
                                <button className="w-full px-12 py-5 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-2xl shadow-blue-500/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3">
                                    Перейти в каталог <ArrowRight size={18} />
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer Assist */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-4">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
                        <HelpCircle size={14} className="text-blue-600" /> Есть вопросы? Наша поддержка работает 24/7
                    </div>
                    <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Link href="/faq" className="hover:text-blue-600 transition-colors">Частые вопросы</Link>
                        <Link href="/legal/terms" className="hover:text-blue-600 transition-colors">Условия</Link>
                        <Link href="/support" className="hover:text-blue-600 transition-colors">Связаться</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

const BadgeStatus = ({ status }: { status: string }) => {
    const config: Record<string, { color: string, label: string, icon: any }> = {
        PENDING: { color: "bg-amber-50 text-amber-600 border-amber-100", label: "Ожидание", icon: <Clock size={10} className="animate-pulse" /> },
        PROCESSING: { color: "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20", label: "В работе", icon: <Activity size={10} /> },
        COMPLETED: { color: "bg-emerald-500 text-white border-emerald-500 shadow-xl shadow-emerald-500/20", label: "Завершено", icon: <CheckCircle2 size={10} /> },
        PARTIAL: { color: "bg-orange-50 text-orange-600 border-orange-100", label: "Частично", icon: <AlertCircle size={10} /> },
        CANCELED: { color: "bg-rose-600 text-white border-rose-600 shadow-xl shadow-rose-500/20", label: "Отмена", icon: <AlertCircle size={10} /> },
        ERROR: { color: "bg-rose-50 text-rose-600 border-rose-100", label: "Ошибка", icon: <AlertCircle size={10} /> },
        AWAITING_PAYMENT: { color: "bg-slate-100 text-slate-400 border-slate-200", label: "Оплата", icon: <Loader2 size={10} className="animate-spin" /> }
    };

    const current = config[status] || { color: "bg-slate-50 text-slate-400 border-slate-100", label: status, icon: null };

    return (
        <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-3 py-1.5 border leading-none rounded-lg inline-flex items-center gap-2",
            current.color
        )}>
            {current.icon}
            {current.label}
        </span>
    );
};


