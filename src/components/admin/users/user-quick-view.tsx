'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Mail,
    CreditCard,
    ShoppingBag,
    Users,
    ShieldAlert,
    ExternalLink,
    Loader2,
    X
} from 'lucide-react';
import { getUserQuickViewData } from '@/app/admin/users/actions';
import { formatAmount } from '@/utils/formatter';
import Link from 'next/link';

interface UserQuickViewProps {
    userId: string;
    trigger: React.ReactNode;
}

export function UserQuickView({ userId, trigger }: UserQuickViewProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchUserData = async () => {
        if (data || isLoading) return;
        setIsLoading(true);
        setError(null);
        try {
            const result = await getUserQuickViewData(userId);
            setData(result);
        } catch (e: any) {
            setError(e.message || 'Ошибка загрузки');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchUserData();
        }
    }, [isOpen]);

    return (
        <div className="relative inline-block">
            <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
                {trigger}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop for mobile or just to close on click outside */}
                        <div
                            className="fixed inset-0 z-40 bg-transparent"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute left-0 bottom-full mb-2 z-50 w-72 bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
                        >
                            <div className="p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <div className="text-sm font-black text-slate-900 truncate max-w-[140px]">
                                                @{data?.username || 'Загрузка...'}
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                                {data?.role || '...'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                {isLoading ? (
                                    <div className="py-8 flex flex-col items-center justify-center space-y-2">
                                        <Loader2 className="animate-spin text-blue-500" size={24} />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Синхронизация данных...</span>
                                    </div>
                                ) : error ? (
                                    <div className="py-4 text-center text-rose-500 text-xs font-bold uppercase">
                                        {error}
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                                                    <CreditCard size={10} /> Баланс
                                                </div>
                                                <div className="text-sm font-black text-slate-900">
                                                    {formatAmount(data.balance)}₽
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">
                                                    <ShoppingBag size={10} /> Заказы
                                                </div>
                                                <div className="text-sm font-black text-slate-900">
                                                    {data._count.orders}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                                                <Mail size={12} className="text-slate-400" />
                                                <span className="truncate">{data.email || 'Email не указан'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                                                <Users size={12} className="text-slate-400" />
                                                <span>Рефералы: {data._count.referrals}</span>
                                            </div>
                                            {data.isPermanentlyBanned && (
                                                <div className="flex items-center gap-2 text-[11px] text-rose-600 font-black uppercase">
                                                    <ShieldAlert size={12} />
                                                    <span>Заблокирован</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-2 border-t border-slate-100">
                                            <Link
                                                href={`/admin/users/${userId}`}
                                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
                                            >
                                                Перейти в профиль <ExternalLink size={12} />
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}


