"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, Zap, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export const QuickOrder = () => {
    const [step, setStep] = useState(1);
    const [link, setLink] = useState("");
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        if (!link) return;
        if (!consent) {
            alert("Пожалуйста, подтвердите согласие на обработку персональных данных");
            return;
        }
        setLoading(true);
        // Имитация анализа ссылки
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 1500);
    };

    return (
        <section className="py-24 px-6 bg-slate-50 relative overflow-hidden">
            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-4">
                        Быстрый старт
                    </h2>
                    <p className="text-slate-500 font-medium">Оформите заказ за 30 секунд без регистрации</p>
                </div>

                <div className="bg-white p-2 border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200/50">
                    <div className="p-8 md:p-12">
                        <AnimatePresence mode="wait">
                            {step === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="space-y-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
                                            Ссылка на профиль или пост
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors">
                                                <Link2 size={24} />
                                            </div>
                                            <input
                                                type="text"
                                                placeholder="https://instagram.com/p/..."
                                                value={link}
                                                onChange={(e) => setLink(e.target.value)}
                                                className="w-full pl-16 pr-6 py-6 bg-slate-50 border-2 border-transparent focus:border-blue-600/20 focus:bg-white rounded-3xl text-lg font-bold outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 px-1">
                                        <input
                                            type="checkbox"
                                            id="quick_consent"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="mt-1 shrink-0 w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                        />
                                        <label htmlFor="quick_consent" className="text-xs text-slate-500 font-medium leading-relaxed">
                                            Нажимая кнопку «Продолжить», я даю согласие на обработку моих персональных данных в соответствии с{' '}
                                            <a href="/docs/policy" target="_blank" className="text-blue-600 hover:underline">Политикой конфиденциальности</a>
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleNext}
                                        disabled={!link || !consent || loading}
                                        className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all"
                                    >
                                        {loading ? (
                                            <Loader2 className="animate-spin" />
                                        ) : (
                                            <>
                                                Продолжить <ArrowRight size={24} />
                                            </>
                                        )}
                                    </button>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-8 text-center py-10"
                                >
                                    <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-900">Ссылка проанализирована!</h3>
                                    <p className="text-slate-500 font-medium">Мы подобрали лучшие услуги для вашего аккаунта.</p>
                                    <button className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-bold flex items-center gap-2 mx-auto hover:bg-slate-800 transition-all">
                                        Перейти к выбору услуг <Zap size={18} className="fill-current" />
                                    </button>
                                    <button onClick={() => setStep(1)} className="text-sm font-bold text-slate-400 hover:text-slate-600">
                                        Изменить ссылку
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Background patterns */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        </section>
    );
};


