"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, Award, Zap, Activity, Cpu, ShieldCheck } from "lucide-react";

interface UserDashboardProps {
    user: {
        balance: number;
        spent: number;
        loyalty: {
            name: string;
            discount: number;
            isEarlyBird: boolean;
        };
    };
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ user }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Balance Card - COMMAND CENTER STYLE */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="cyber-box group p-8 relative overflow-hidden bg-slate-950/40"
            >
                {/* HUD Decorations */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-30" />
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Cpu size={24} />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-primary/10 text-primary border border-primary/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_var(--primary-glow)]">
                        <Wallet size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">ФИНАНСОВЫЙ_УЗЕЛ</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ТЕКУЩИЙ БАЛАНС</span>
                    </div>
                </div>

                <div className="flex items-baseline gap-3">
                    <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-5xl font-mono font-black tracking-tighter text-white italic"
                    >
                        {user.balance.toFixed(2)}
                    </motion.span>
                    <span className="text-sm font-black text-primary uppercase italic tracking-widest">RUB</span>
                </div>

                <div className="mt-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">Node_A1: ACTIVE_CONNECTION</span>
                </div>

                <div className="scan-line opacity-10" />
            </motion.div>

            {/* Spent Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="cyber-box group p-8 relative overflow-hidden bg-slate-950/40"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent opacity-30" />
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <Activity size={24} />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                        <TrendingUp size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 italic">ЛОГ_ОПЕРАЦИЙ</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ВСЕГО ПОТРАЧЕНО</span>
                    </div>
                </div>

                <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-mono font-black tracking-tighter text-white italic">
                        {user.spent.toFixed(2)}
                    </span>
                    <span className="text-sm font-black text-indigo-400 uppercase italic tracking-widest">RUB</span>
                </div>

                <div className="mt-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">DATA_STREAM: VERIFIED</span>
                </div>

                <div className="scan-line opacity-10" />
            </motion.div>

            {/* Loyalty Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="cyber-box group p-8 relative overflow-hidden bg-slate-950/40"
            >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-transparent opacity-30" />
                <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-30 transition-opacity">
                    <ShieldCheck size={24} />
                </div>

                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-accent/10 text-accent border border-accent/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_var(--accent-glow)]">
                        <Award size={22} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent italic">РАНГ_ДОСТУПА</span>
                        <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">ЛОЯЛЬНОСТЬ</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-2xl font-black tracking-tighter text-white italic uppercase underline decoration-accent/30 underline-offset-4">
                            {user.loyalty.name}
                        </span>
                        {user.loyalty.isEarlyBird && (
                            <div className="text-[8px] font-black uppercase tracking-[0.2em] text-accent flex items-center gap-1">
                                <Zap size={8} className="fill-current" /> БОНУС ПЕРВОПРОХОДЦА
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-center justify-center bg-accent/10 border border-accent/20 w-16 h-16 rounded-full relative">
                        <Zap size={16} className="text-accent fill-current absolute -top-1 -right-1 animate-pulse" />
                        <span className="text-xl font-mono font-black text-white italic">-{user.loyalty.discount}%</span>
                    </div>
                </div>

                <div className="mt-6 flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-[0.4em]">RANK: AUTHENTICATED</span>
                </div>

                <div className="scan-line opacity-10" />
            </motion.div>
        </div>
    );
};
