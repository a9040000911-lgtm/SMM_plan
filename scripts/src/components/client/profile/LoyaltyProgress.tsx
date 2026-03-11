"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import { Award, TrendingUp, Lock, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoyaltyProgressProps {
    currentTier: {
        name: string;
        discount: number;
        minSpent: number;
    };
    totalSpent: number;
    nextTier?: {
        name: string;
        discount: number;
        minSpent: number;
    };
    isEarlyBird?: boolean;
}

export const LoyaltyProgress: React.FC<LoyaltyProgressProps> = ({
    currentTier,
    totalSpent,
    nextTier,
    isEarlyBird
}) => {
    // Calculate progress percentage
    const progress = nextTier
        ? Math.min(((totalSpent - currentTier.minSpent) / (nextTier.minSpent - currentTier.minSpent)) * 100, 100)
        : 100;

    const remaining = nextTier ? Math.max(nextTier.minSpent - totalSpent, 0) : 0;
    const isMaxTier = !nextTier;

    return (
        <div className="rounded-[3rem] bg-white border border-slate-100 p-8 md:p-10 space-y-10 relative overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.02)]">
            {/* Background Glow Effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-[0.03] rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-500 opacity-[0.02] rounded-full blur-2xl -ml-24 -mb-24" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center border border-blue-100 shadow-inner group-hover:scale-110 transition-transform">
                        <Award size={32} className="drop-shadow-[0_0_10px_rgba(37,99,235,0.2)]" />
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Программа лояльности</h3>
                        <div className="flex items-center gap-3">
                            <span className="text-3xl font-black tracking-tighter italic text-[#171717] uppercase">
                                {currentTier.name}
                            </span>
                            <div className="px-3 py-1 bg-blue-600 text-white rounded-xl text-[10px] font-black shadow-lg shadow-blue-500/20">
                                -{currentTier.discount}%
                            </div>
                        </div>
                    </div>
                </div>

                {nextTier && (
                    <div className="md:text-right px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Следующий уровень</div>
                        <div className="flex items-center md:justify-end gap-2 text-sm font-black text-[#171717] mt-1 italic uppercase">
                            <Lock size={14} className="text-slate-300" />
                            {nextTier.name}
                        </div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#171717]">
                        {isMaxTier ? "МАКСИМАЛЬНЫЙ УРОВЕНЬ" : "ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ"}
                    </span>
                    {!isMaxTier && (
                        <div className="px-4 py-1 bg-[#171717] rounded-full text-white text-[10px] font-black">{progress.toFixed(0)}%</div>
                    )}
                </div>

                {/* Progress Bar Background */}
                <div className="h-6 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-1 relative shadow-inner">
                    {/* Fill */}
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className={cn(
                            "h-full rounded-full relative shadow-lg",
                            isMaxTier
                                ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                                : "bg-gradient-to-r from-blue-600 to-indigo-500"
                        )}
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_2s_infinite]" />
                    </motion.div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-400 uppercase tracking-widest">
                        Потрачено: <span className="text-[#171717] font-black">{totalSpent.toFixed(0)} ₽</span>
                    </span>
                    {!isMaxTier && (
                        <span className="text-[#171717] uppercase tracking-widest">
                            Нужно еще: <span className="font-black text-blue-600">{remaining.toFixed(0)} ₽</span>
                        </span>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pioneer Boost */}
                {isEarlyBird && (
                    <div className="relative z-10 p-6 bg-amber-50 border border-amber-100 rounded-[1.5rem] space-y-3 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-amber-500 shadow-sm transition-transform group-hover:rotate-12">
                                <Zap size={20} className="fill-amber-500" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700">
                                Pioneer Boost Active
                            </span>
                        </div>
                        <div className="text-sm font-bold text-amber-900/70 leading-relaxed">
                            Вы один из первых пользователей! Вам начислена постоянная скидка{" "}
                            <span className="font-black text-amber-600">+20%</span> как первопроходцу.
                        </div>
                    </div>
                )}

                {/* Next Tier Info */}
                {nextTier && (
                    <div className="relative z-10 p-6 bg-blue-50 border border-blue-100 rounded-[1.5rem] space-y-3 shadow-sm group hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-blue-600 shadow-sm transition-transform group-hover:rotate-12">
                                <TrendingUp size={20} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">
                                Следующие бонусы
                            </span>
                        </div>
                        <div className="text-sm font-bold text-blue-900/70 leading-relaxed">
                            Достигните <span className="font-black text-[#171717]">{nextTier.name}</span> и получите скидку{" "}
                            <span className="font-black text-blue-600">-{nextTier.discount}%</span> на все услуги!
                        </div>
                    </div>
                )}
            </div>

            {/* Max Tier Badge */}
            {isMaxTier && (
                <div className="relative z-10 p-8 bg-emerald-50 border border-emerald-100 rounded-[2rem] text-center space-y-4">
                    <Award size={48} className="mx-auto text-emerald-500 drop-shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                    <div>
                        <h4 className="text-xl font-black text-emerald-900 uppercase italic tracking-tight">Максимальный уровень достигнут</h4>
                        <p className="text-sm font-bold text-emerald-800/60 mt-1 uppercase tracking-widest italic">Вы истинная легенда нашего сервиса! 🎉</p>
                    </div>
                </div>
            )}
        </div>
    );
};
