"use client";

import React from "react";
import { motion } from "framer-motion";
import { Briefcase, BarChart3, Globe, CheckCircle2, ChevronRight } from "lucide-react";

/**
 * Style Archetype: Corporate Modern (Professional)
 * 
 * Характеристики:
 * - Строгий белый фон.
 * - Индиго и темно-синие акценты (Indigo 600/950).
 * - Геометрическая четкость, небольшие радиусы скругления (rounded-xl).
 * - Акцент на цифрах, фактах и надежности.
 * - Тонкие границы (border-slate-200).
 */

export default function CorporateModernExample() {
    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans">
            {/* Top Bar */}
            <div className="bg-slate-900 text-slate-400 py-2 px-10 text-xs flex justify-between items-center tracking-wide">
                <div className="flex gap-4">
                    <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> RU / EN</span>
                    <span>Поддержка 24/7</span>
                </div>
                <div>
                    Личный кабинет специалиста
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-10">
                <nav className="flex items-center justify-between py-8 border-b border-slate-100">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <span className="text-xl font-black text-indigo-950 uppercase tracking-tighter">Smm<span className="text-indigo-600">Corp</span></span>
                        </div>
                        <div className="hidden lg:flex gap-6 text-sm font-bold text-slate-600 uppercase tracking-widest">
                            <a href="#" className="hover:text-indigo-600 transition-colors">Пакеты</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">API для партнеров</a>
                            <a href="#" className="hover:text-indigo-600 transition-colors">О нас</a>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">
                        Начать работу
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </nav>

                <section className="py-24 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <div className="space-y-8">
                        <div className="flex items-center gap-3 text-indigo-600">
                            <div className="h-px w-10 bg-indigo-600" />
                            <span className="text-sm font-black uppercase tracking-widest">Enterprise Solution</span>
                        </div>
                        <h1 className="text-5xl lg:text-6xl font-black text-indigo-950 leading-[1.1] tracking-tight">
                            Инструменты SMM <br /> промышленного <br /> масштаба
                        </h1>
                        <p className="text-slate-500 text-xl leading-relaxed">
                            Обеспечиваем стабильный охват и вовлеченность для крупных брендов и медиа-агентств через инновационную сеть поставщиков.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                "Гарантированный SLA 99.9%",
                                "Личный менеджер",
                                "Индивидуальные API лимиты",
                                "Закрывающие документы"
                            ].map(text => (
                                <div key={text} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    {text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-4 shadow-2xl">
                            <div className="bg-white rounded-[1.5rem] p-8 border border-slate-100 space-y-6">
                                <div className="h-4 w-1/3 bg-slate-100 rounded-full" />
                                <div className="space-y-3">
                                    <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl" />
                                    <div className="h-10 w-full bg-slate-50 border border-slate-100 rounded-xl" />
                                </div>
                                <div className="h-32 w-full bg-indigo-50/50 border border-indigo-100 border-dashed rounded-2xl flex items-center justify-center">
                                    <BarChart3 className="text-indigo-200 w-12 h-12" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
