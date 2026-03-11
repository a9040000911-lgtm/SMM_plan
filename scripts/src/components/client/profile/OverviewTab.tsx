"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import { Wallet, Activity, AlertCircle } from "lucide-react";
import { LoyaltyProgress } from "./LoyaltyProgress";
import { AIInsights } from "./AIInsights";

interface OverviewTabProps {
    userData: any;
    stats: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ userData, stats }) => {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Balance Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-xl transition-all relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.03] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Wallet size={24} />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Баланс</span>
                            <div className="h-1 w-8 bg-blue-600 rounded-full" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter italic text-[#171717]">{userData.balance.toFixed(2)}</span>
                        <span className="text-sm font-black text-slate-300 uppercase italic">RUB</span>
                    </div>
                </motion.div>

                {/* Active Streams Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.02)] hover:shadow-xl transition-all relative overflow-hidden group"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-[0.03] rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner">
                            <Activity size={24} />
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Активные заказы</span>
                            <div className="h-1 w-8 bg-blue-600 rounded-full" />
                        </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black tracking-tighter italic text-[#171717]">{stats?.activeOrders || 0}</span>
                        <span className="text-sm font-black text-slate-300 uppercase italic">STREAMS</span>
                    </div>
                </motion.div>
            </div>

            {/* AI Insights & Adaptive UI */}
            <AIInsights />

            {/* Loyalty Progress */}
            <LoyaltyProgress
                currentTier={{
                    name: userData.loyalty.name,
                    discount: userData.loyalty.discount,
                    minSpent: userData.loyalty.min || 0
                }}
                totalSpent={userData.spent || 0}
                isEarlyBird={userData.loyalty.isEarlyBird}
                nextTier={userData.loyalty.nextLevel ? {
                    name: userData.loyalty.nextLevel.name,
                    discount: userData.loyalty.nextLevel.discount,
                    minSpent: userData.loyalty.nextLevel.min
                } : undefined}
            />

            {/* Additional Overview Info (e.g. Unread Tickets if any) */}
            {stats?.unreadTickets > 0 && (
                <div className="rounded-3xl bg-amber-50 border border-amber-100 p-6 flex items-center gap-5 shadow-sm animate-pulse">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-amber-500 shadow-sm">
                        <AlertCircle size={24} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Уведомление</p>
                        <p className="text-sm font-bold text-amber-900">
                            У вас есть {stats.unreadTickets} непрочитанных сообщений в поддержке.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
