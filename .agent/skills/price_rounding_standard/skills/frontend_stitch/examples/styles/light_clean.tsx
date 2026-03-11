"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Search } from "lucide-react";

/**
 * Style Archetype: Light Clean (Breezy)
 * 
 * Характеристики:
 * - Светлый, "воздушный" фон (Slate 50).
 * - Мягкие тени (shadow-sm) и закругленные углы.
 * - Яркие, но не кричащие акценты (Blue 600).
 * - Много свободного пространства (Whitespace).
 */

export default function LightCleanExample() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
            <div className="max-w-5xl mx-auto space-y-12">
                <nav className="flex items-center justify-between bg-white px-8 py-4 rounded-3xl shadow-sm border border-slate-100">
                    <div className="text-2xl font-bold tracking-tight text-blue-600">breezy<span className="text-slate-400">smm</span></div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex gap-6 text-sm font-semibold text-slate-500">
                            <a href="#" className="hover:text-blue-600">Цены</a>
                            <a href="#" className="hover:text-blue-600">Поддержка</a>
                        </div>
                        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/10">
                            Попробовать
                        </button>
                    </div>
                </nav>

                <section className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-8">
                    <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600">
                        <Heart className="fill-blue-600 w-10 h-10" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                        Развивайте соцсети <br /> с любовью и легкостью
                    </h1>
                    <p className="max-w-lg text-slate-500 text-lg">
                        Мы создали самый простой и понятный инструмент для тех, кто ценит качество и эстетику.
                    </p>
                    <div className="w-full max-w-md relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Какую услугу ищем?"
                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition-all font-medium"
                        />
                    </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { label: "Лайки", icon: Heart, val: "от 49₽" },
                        { label: "Комментарии", icon: MessageCircle, val: "от 89₽" },
                        { label: "Репосты", icon: Share2, val: "от 39₽" },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 rounded-[2rem] border border-slate-100 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5 transition-all group"
                        >
                            <item.icon className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform" />
                            <h3 className="mt-6 text-xl font-bold">{item.label}</h3>
                            <p className="text-slate-400 mt-1 text-sm font-medium">{item.val} за 1000 шт.</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
