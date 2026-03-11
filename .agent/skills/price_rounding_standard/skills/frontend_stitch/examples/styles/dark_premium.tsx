"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, Shield, Zap, Sparkles } from "lucide-react";

/**
 * Style Archetype: Dark Premium (Neo-SMM)
 * 
 * Характеристики:
 * - Глубокий темный фон (Slate 950).
 * - Неоновое свечение (Glow) и градиенты.
 * - Стеклянный морфизм (Glassmorphism).
 * - Высокая контрастность акцентов.
 */

export default function DarkPremiumExample() {
    return (
        <div className="min-h-screen bg-slate-950 text-white p-10 font-sans selection:bg-blue-500/30">
            {/* Background Glow */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-purple-600/10 blur-[100px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto space-y-16">
                <header className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Zap className="fill-white" />
                        </div>
                        <span className="text-2xl font-black tracking-tighter">SMM<span className="text-blue-500">PRO</span></span>
                    </div>
                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
                        <a href="#" className="hover:text-white transition-colors">Сервисы</a>
                        <a href="#" className="hover:text-white transition-colors">Кейсы</a>
                        <a href="#" className="hover:text-white transition-colors">API</a>
                        <button className="bg-white/5 border border-white/10 px-6 py-2.5 rounded-xl hover:bg-white/10 transition-all backdrop-blur-md">
                            Вход
                        </button>
                    </nav>
                </header>

                <section className="text-center space-y-6 py-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest"
                    >
                        <Sparkles className="w-3 h-3" />
                        Будущее SMM уже здесь
                    </motion.div>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight leading-[0.9] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">
                        ВЗРЫВНОЙ <br /> РОСТ
                    </h1>
                    <p className="max-w-xl mx-auto text-slate-400 text-lg">
                        Премиальные инструменты для продвижения в социальных сетях с использованием AI-алгоритмов.
                    </p>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="group p-8 rounded-[2.5rem] bg-white/5 border border-white/10 backdrop-blur-xl hover:bg-white/10 transition-all cursor-pointer">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Star className="text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold">Умные подписчики</h3>
                            <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                                Живые пользователи, которые взаимодействуют с вашим контентом.
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
