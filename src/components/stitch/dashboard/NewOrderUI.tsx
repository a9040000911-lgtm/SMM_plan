"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Link as LinkIcon, Hash,
    AlertCircle, Loader2, CheckCircle2,
    ArrowRight, ArrowLeft, Zap, Info,
    ShieldCheck, MousePointer2, Sparkles
} from 'lucide-react';
import Link from "next/link";
import { numberToWordsRu } from '@/utils/number-to-words';
import { BrandIcon } from '@/components/stitch/ui/BrandIcon';
import { getWebSmartHint } from '@/utils/tips';


interface NewOrderUIProps {
    initialService: any;
    serviceId: string;
}

export function NewOrderUI({ initialService, serviceId }: NewOrderUIProps) {
    const router = useRouter();
    const [link, setLink] = useState('');
    const [quantity, setQuantity] = useState<number | ''>(initialService?.minQty || 100);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleTime, setScheduleTime] = useState('');
    const [repeatInterval, setRepeatInterval] = useState<number | ''>('');

    const priceVal = typeof quantity === 'number'
        ? Number(((initialService.pricePer1000 * quantity) / 1000).toFixed(4))
        : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const res = await fetch('/api/client/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    serviceId,
                    link,
                    quantity,
                    scheduleTime: isScheduled ? scheduleTime : undefined,
                    repeatInterval: (isScheduled && repeatInterval) ? repeatInterval : undefined
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Ошибка при создании заказа');
            } else {
                if (data.requiresPayment && data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else {
                    setSuccess(true);
                    setTimeout(() => router.push('/dashboard/orders'), 2000);
                }
            }
        } catch { setError('Ошибка сети'); } finally { setSubmitting(false); }
    };

    if (success) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-xl mx-auto py-20 text-center space-y-8">
                <div className="w-24 h-24 bg-emerald-500 rounded-full mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-950 uppercase italic tracking-tight">Заказ запущен!</h1>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-relaxed">Система успешно приняла вашу заявку <br /> и передала её в обработку.</p>
                </div>
                <div className="pt-4">
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2 }} className="h-full bg-blue-600" />
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mt-3">Автоматический переход в личный кабинет...</p>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-10 pb-24 max-w-5xl mx-auto">
            {/* Simple Back Link */}
            <Link href="/catalog" className="group flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">
                <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-all">
                    <ArrowLeft size={16} />
                </div>
                Назад к выбору услуг
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Order Form Side */}
                <div className="lg:col-span-12">
                    <div className="bg-white border border-slate-100 rounded-[3rem] shadow-2xl shadow-blue-900/5 relative overflow-hidden">

                        {/* Status Bar / Service Name */}
                        <div className="p-8 lg:p-12 bg-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-5">
                                <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-600/20">
                                    <BrandIcon name={initialService.platform.toLowerCase() as any} size={28} />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-950 uppercase tracking-tight italic">{initialService.name}</h1>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mt-1">{initialService.platform} • {initialService.category}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <Zap className="text-amber-500" size={16} fill="currentColor" />
                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Мгновенный запуск</span>
                            </div>
                        </div>

                        {/* Actual Form */}
                        <form onSubmit={handleSubmit} className="p-8 lg:p-12 space-y-10">
                            {error && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-6 bg-rose-50 border border-rose-100 rounded-[1.5rem] text-rose-600">
                                    <AlertCircle size={20} />
                                    <p className="text-xs font-black uppercase tracking-tight">{error}</p>
                                </motion.div>
                            )}

                            {initialService.requirements && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 p-6 bg-amber-50 border border-amber-200 rounded-[1.5rem] text-amber-900 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                                    <div className="mt-1 shrink-0">
                                        <AlertCircle size={24} className="text-amber-500" />
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-amber-700">Важное техническое требование</h4>
                                        <p className="text-sm font-medium text-amber-900/80 leading-relaxed">
                                            {initialService.requirements}
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Целевая ссылка (Link)</label>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                            <LinkIcon size={20} />
                                        </div>
                                        <input
                                            required
                                            type="url"
                                            value={link}
                                            onChange={(e) => setLink(e.target.value)}
                                            placeholder="https://t.me/your_channel..."
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2.5xl py-6 pl-16 pr-8 text-sm font-bold text-slate-950 outline-none focus:bg-white focus:border-blue-500/20 transition-all placeholder:text-slate-200"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 ml-4 text-slate-400">
                                        <Info size={12} className="shrink-0" />
                                        <p className="text-[9px] font-bold uppercase tracking-widest">{getWebSmartHint(initialService.platform || initialService.ProviderService?.platform)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between ml-4">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Количество</label>
                                        <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                            Min: {initialService.minQty} / Max: {initialService.maxQty}
                                        </span>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                                            <Hash size={20} />
                                        </div>
                                        <input
                                            required
                                            type="number"
                                            min={initialService.minQty}
                                            max={initialService.maxQty}
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value))}
                                            className="w-full bg-slate-50 border-2 border-slate-50 rounded-2.5xl py-6 pl-16 pr-8 text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-blue-500/20 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Итого к оплате</label>
                                    <div className="w-full h-[76px] bg-slate-950 rounded-2.5xl px-8 flex items-center justify-between shadow-2xl shadow-blue-900/20 border border-white/5 group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-full bg-blue-600/10 skew-x-[30deg] translate-x-10" />
                                        <span className="text-3xl font-black text-white tracking-tighter tabular-nums relative z-10">{priceVal.toFixed(2)} <span className="text-blue-500 text-xl italic uppercase ml-1">₽</span></span>
                                        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-xl border border-white/5 relative z-10" title={numberToWordsRu(priceVal)}>
                                            <MousePointer2 size={12} className="text-blue-400 italic" />
                                            <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest">Auto Pricing</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 border-t border-slate-50 space-y-8">
                                <div className="flex items-center gap-4 ml-4">
                                    <div className="relative inline-flex items-center cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            id="schedule-toggle"
                                            checked={isScheduled}
                                            onChange={(e) => setIsScheduled(e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-12 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        <label htmlFor="schedule-toggle" className="ml-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 cursor-pointer group-hover:text-blue-600 transition-colors">
                                            Запланировать на будущее
                                        </label>
                                    </div>
                                    <Sparkles size={14} className="text-amber-500 animate-pulse" />
                                </div>

                                <AnimatePresence>
                                    {isScheduled && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, y: -10, height: 0 }}
                                            className="grid grid-cols-1 md:grid-cols-2 gap-8 overflow-hidden"
                                        >
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 italic">Дата и время запуска</label>
                                                <input
                                                    type="datetime-local"
                                                    value={scheduleTime}
                                                    onChange={(e) => setScheduleTime(e.target.value)}
                                                    required={isScheduled}
                                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2.5xl py-6 px-8 text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-blue-500/20 transition-all"
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 italic">Повтор (каждые N минут)</label>
                                                <input
                                                    type="number"
                                                    placeholder="Оставьте пустым для разового"
                                                    value={repeatInterval}
                                                    onChange={(e) => setRepeatInterval(e.target.value === '' ? '' : parseInt(e.target.value))}
                                                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-2.5xl py-6 px-8 text-sm font-black text-slate-950 outline-none focus:bg-white focus:border-blue-500/20 transition-all"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="pt-8 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-4 text-slate-300">
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-relaxed">Безопасная оплата <br /> средствами с баланса</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting || !link || !quantity}
                                    className="w-full sm:w-auto h-20 px-12 bg-blue-600 text-white rounded-2.5xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-950 active:scale-95 transition-all shadow-2xl shadow-blue-600/20 flex items-center justify-center gap-4 group"
                                >
                                    {submitting ? <Loader2 size={24} className="animate-spin" /> : (
                                        <>
                                            Запустить проект <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}


