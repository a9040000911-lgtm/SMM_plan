"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { MessageSquare, Mail, HelpCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export function SupportClient() {
    const [config, setConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/client/config')
            .then(res => res.json())
            .then(data => {
                setConfig(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const supportBot = config?.config?.supportBot || process.env.NEXT_PUBLIC_SUPPORT_BOT || 'smmplan_support_bot';
    const supportEmail = config?.config?.supportEmail || 'support@smmplan.ru';

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin opacity-20" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-20 pt-10">
            <div className="space-y-4 text-center">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
                >
                    Центр помощи
                </motion.div>
                <h1 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">
                    Поддержка 24/7
                </h1>
                <p className="text-slate-500 text-sm max-w-lg mx-auto font-medium">
                    Мы всегда на связи. Выберите удобный способ связи, и мы ответим в кратчайшие сроки (обычно 15-30 минут).
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.a 
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    href={`https://t.me/${supportBot}`} 
                    target="_blank" 
                    className="block group"
                >
                    <div className="bg-white border border-slate-100 p-8 rounded-[3rem] transition-all shadow-xl hover:shadow-blue-500/10 relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-blue-500/10 transition-colors" />
                        <div className="relative space-y-6">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center shadow-sm">
                                <MessageSquare size={32} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Telegram Bot</h2>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Мгновенные ответы, статус заказов и прямая связь с оператором через нашего официального бота.
                                </p>
                            </div>
                            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
                                Написать в Telegram
                            </span>
                        </div>
                    </div>
                </motion.a>

                <motion.a 
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    href={`mailto:${supportEmail}`} 
                    className="block group"
                >
                    <div className="bg-white border border-slate-100 p-8 rounded-[3rem] transition-all shadow-xl hover:shadow-indigo-500/10 relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />
                        <div className="relative space-y-6">
                            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-sm">
                                <Mail size={32} />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Email Почта</h2>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                    Для официальных запросов, деловых предложений и сложных технических вопросов, требующих вложений документов.
                                </p>
                            </div>
                            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-6 py-3 rounded-xl shadow-lg group-hover:bg-black transition-colors">
                                Отправить письмо
                            </span>
                        </div>
                    </div>
                </motion.a>
            </div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-50 p-10 rounded-[3.5rem] text-center space-y-8 border border-slate-100"
            >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-sm text-slate-400">
                    <HelpCircle size={32} />
                </div>
                <div className="space-y-3">
                    <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Есть готовые ответы</h3>
                    <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed">
                        Мы собрали ответы на самые популярные вопросы в нашей базе знаний. Возможно, ваше решение уже там.
                    </p>
                </div>
                <Link href="/faq" className="inline-block">
                    <button className="px-10 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                        Открыть базу знаний (FAQ)
                    </button>
                </Link>
            </motion.div>
        </div>
    );
}
