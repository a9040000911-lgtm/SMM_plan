/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { knowledgeBase } from '@/data/kb-content';
import {
    BookOpen,
    ChevronRight,
    AlertCircle,
    PlayCircle,
    HelpCircle,
    Info,
    ArrowRight,
    Layers,
    Zap,
    ShieldCheck,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';

export default function KnowledgeBasePage() {
    return (
        <div className="max-w-6xl mx-auto space-y-12 pb-20 px-4">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-slate-800 tracking-tight">База Знаний</h1>
                        <p className="text-slate-500 font-medium">Ваш навигатор по интеллектуальным модулям SMM-платформы</p>
                    </div>
                </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {knowledgeBase.map((module) => (
                    <div key={module.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:border-blue-200 transition-all group">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <module.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">{module.title}</h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Модуль {module.id.toUpperCase()}</p>
                                </div>
                            </div>
                            <p className="mt-4 text-slate-600 font-medium leading-relaxed italic text-sm">
                                "{module.description}"
                            </p>
                        </div>

                        <div className="p-8 space-y-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Layers size={14} /> Доступные функции
                            </h4>
                            <div className="space-y-3">
                                {module.functions.map((fn) => (
                                    <Link key={fn.id} href={`#${fn.id}`}>
                                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-all group/item border border-transparent hover:border-blue-100 mb-2 cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-white rounded-xl text-slate-400 group-hover/item:text-blue-600 shadow-sm">
                                                    <fn.icon size={16} />
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover/item:text-blue-700">{fn.title}</span>
                                            </div>
                                            <ChevronRight size={16} className="text-slate-300 group-hover/item:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Detailed Content Section */}
            <div className="space-y-16 mt-20">
                <div className="h-px bg-slate-200 w-full relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6">
                        <div className="px-4 py-1.5 bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            Подробные спецификации
                        </div>
                    </div>
                </div>

                {knowledgeBase.map((module) => (
                    <div key={`details-${module.id}`} className="space-y-12">
                        {module.functions.map((fn) => (
                            <section id={fn.id} key={fn.id} className="scroll-mt-24">
                                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                                    <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/30">
                                        <div className="flex items-center gap-6">
                                            <div className="p-5 bg-white rounded-[2rem] text-blue-600 shadow-xl shadow-blue-100 flex items-center justify-center">
                                                <fn.icon size={32} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-lg">Функция</span>
                                                    <span className="text-slate-300 text-xs font-bold"># {fn.id}</span>
                                                </div>
                                                <h2 className="text-3xl font-black text-slate-800 tracking-tight">{fn.title}</h2>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex -space-x-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center"><Zap size={12} className="text-indigo-600" /></div>
                                                <div className="w-8 h-8 rounded-full bg-emerald-50 border-2 border-white flex items-center justify-center"><ShieldCheck size={12} className="text-emerald-600" /></div>
                                                <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-blue-600">v2</div>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 border-l border-slate-200 ml-2">Smart Module</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 p-10">
                                        {/* Left Side: How it works */}
                                        <div className="space-y-10">
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 text-blue-600">
                                                    <PlayCircle size={20} />
                                                    <h3 className="font-black uppercase tracking-widest text-xs">Принцип работы</h3>
                                                </div>
                                                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 relative overflow-hidden group">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <HelpCircle size={80} />
                                                    </div>
                                                    <p className="text-slate-700 font-medium leading-relaxed relative z-10 text-lg">
                                                        {fn.howItWorks}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center gap-3 text-slate-800">
                                                    <Info size={20} />
                                                    <h3 className="font-black uppercase tracking-widest text-xs">Инструкция и применение</h3>
                                                </div>
                                                <p className="text-slate-600 font-medium leading-relaxed pl-4 border-l-2 border-slate-200">
                                                    {fn.usage}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Side: Risks & Alerts */}
                                        <div className="space-y-10">
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-3 text-rose-600">
                                                    <AlertCircle size={20} />
                                                    <h3 className="font-black uppercase tracking-widest text-xs tracking-[0.2em]">Ограничения и риски</h3>
                                                </div>
                                                <div className="p-8 bg-rose-50 rounded-[2.5rem] border-2 border-rose-100 shadow-sm">
                                                    <ul className="space-y-4">
                                                        <li className="flex items-start gap-4">
                                                            <div className="p-1.5 bg-rose-200 text-rose-700 rounded-lg mt-1"><AlertCircle size={14} /></div>
                                                            <p className="text-rose-900 font-bold text-sm leading-relaxed">
                                                                {fn.risks}
                                                            </p>
                                                        </li>
                                                        <li className="flex items-start gap-4">
                                                            <div className="p-1.5 bg-rose-100 text-rose-500 rounded-lg mt-1"><ArrowRight size={14} /></div>
                                                            <p className="text-rose-800/60 font-medium text-xs">
                                                                Неправильная настройка может привести к блокировкам на стороне соцсети.
                                                            </p>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>

                                            {/* Example Card */}
                                            <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white overflow-hidden relative group">
                                                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-all"></div>
                                                <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                                                    <TrendingUp size={12} /> Pro-Tip
                                                </h4>
                                                <p className="text-sm font-medium text-slate-300 leading-relaxed mb-6">
                                                    Для достижения максимального эффекта "органического роста" рекомендуем сочетать {fn.title} с естественными задержками (Smart Pacing).
                                                </p>
                                                <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest cursor-pointer hover:text-blue-400 transition-colors">
                                                    Перейти к настройке <ArrowRight size={12} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        ))}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="pt-20 text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 rounded-2xl text-emerald-700 font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                    <ShieldCheck size={14} /> Все модули активны и защищены алгоритмами v6.0
                </div>
                <p className="text-slate-400 text-xs font-medium italic">Обновлено: 08.02.2026. SMMPlan Intelligence Engine.</p>
            </div>
        </div>
    );
}


