"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Trophy, TrendingUp, Users, Check,
    Target, Crown, Star, Sparkles,
    ChevronRight, Wallet, BadgePercent
} from 'lucide-react';
import { cn } from '@/utils/ui';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    referralCount: number;
    revenue: string;
}

interface UserStats {
    totalReferrals: number;
    totalEarnings: string;
    currentMonthCount: number;
    currentMonthRevenue: string;
    currentRank: number | null;
    tierBreakdown: {
        tier1: number;
        tier2: number;
        tier3: number;
    };
    referralCode?: string;
}

interface ReferralsUIProps {
    initialLeaderboard: LeaderboardEntry[];
    initialUserStats: UserStats | null;
}

const TIER_INFO = [
    { tier: 1, name: 'Бронзовый Партнер', icon: <Star size={24} />, bonus: '10%', range: '0-5000₽', color: 'text-amber-600 bg-amber-50', glow: 'shadow-amber-200/20' },
    { tier: 2, name: 'Серебряный Партнер', icon: <Crown size={24} />, bonus: '15%', range: '5000-25000₽', color: 'text-slate-400 bg-slate-50', glow: 'shadow-slate-200/20' },
    { tier: 3, name: 'Золотой Партнер', icon: <Sparkles size={24} />, bonus: '20%', range: '25000₽+', color: 'text-blue-600 bg-blue-50', glow: 'shadow-blue-200/20' }
];

export function ReferralsUI({ initialLeaderboard, initialUserStats }: ReferralsUIProps) {
    const [copied, setCopied] = useState(false);

    const referralLink = typeof window !== 'undefined'
        ? `${window.location.origin}?ref=${initialUserStats?.referralCode || 'USER_ID'}`
        : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="space-y-12 pb-32 lg:pb-40">
            {/* Header Hero */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
                <div className="space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-950 tracking-tighter uppercase italic pr-2">
                        Партнерский <span className="text-blue-600">Клуб</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Пассивный доход на продвижении в соцсетях</p>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <BadgePercent className="text-blue-600" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">До 20% комиссии</span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <Wallet className="text-emerald-500" size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest">Еженедельные выплаты</span>
                        </div>
                    </div>
                </div>

                {/* Referral Link Card */}
                <div className="w-full lg:w-[480px] bg-slate-950 rounded-[3rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 blur-[100px] pointer-events-none" />

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 border border-white/5">
                            <Target size={24} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">Ваша ссылка</h3>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">Уникальный ID партнера</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="group/link w-full bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            <div className="font-bold text-xs md:text-sm text-blue-200 break-all select-all flex-1 py-1 pl-3">
                                {referralLink}
                            </div>
                            <button
                                onClick={handleCopy}
                                className={cn(
                                    "shrink-0 w-full md:w-auto h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center",
                                    copied ? "bg-emerald-500 text-white" : "bg-white text-slate-950 hover:bg-blue-500 hover:text-white"
                                )}
                            >
                                {copied ? <Check size={18} /> : "Копировать"}
                            </button>
                        </div>
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center">Делитесь ссылкой и получайте прибыль</p>
                    </div>
                </div>
            </div>

            {/* Tiers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TIER_INFO.map((tier, idx) => (
                    <motion.div
                        key={idx}
                        whileHover={{ y: -5 }}
                        className={cn(
                            "group relative rounded-[3rem] p-8 shadow-2xl transition-all border border-slate-100 overflow-hidden",
                            tier.color, tier.glow
                        )}
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center transition-transform group-hover:scale-110">
                                {tier.icon}
                            </div>
                            <span className="text-2xl font-black italic tabular-nums">{tier.bonus}</span>
                        </div>
                        <h3 className="text-xl font-black uppercase tracking-tight italic mb-2">{tier.name}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Оборот: {tier.range}</p>
                    </motion.div>
                ))}
            </div>

            {/* Stats & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Personal Stats */}
                <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatBox label="Всего партнеров" value={initialUserStats?.totalReferrals || 0} icon={<Users size={16} />} />
                    <StatBox label="Заработок за все время" value={`${initialUserStats?.totalEarnings || 0} ₽`} icon={<Wallet size={16} />} color="emerald" />
                    <StatBox label="За этот месяц" value={initialUserStats?.currentMonthCount || 0} icon={<TrendingUp size={16} />} />
                    <StatBox label="Ваш ранг в системе" value={initialUserStats?.currentRank ? `#${initialUserStats.currentRank}` : 'N/A'} icon={<Trophy size={16} />} color="blue" />
                </div>

                {/* Leaderboard */}
                <div className="lg:col-span-12">
                    <div className="bg-white border border-slate-100 rounded-[3.5rem] p-10 lg:p-14 shadow-2xl shadow-blue-900/5 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.03)_0%,transparent_70%)] pointer-events-none" />

                        <div className="flex items-center justify-between mb-12 relative z-10">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center text-blue-400">
                                    <Trophy size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tight">Зал <span className="text-blue-600">Славы</span></h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Топ 10 активных партнеров Smmplan</p>
                                </div>
                            </div>
                            <button className="hidden sm:flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:translate-x-1 transition-transform">Все участники <ChevronRight size={14} /></button>
                        </div>

                        <div className="space-y-4 relative z-10">
                            {initialLeaderboard.length > 0 ? initialLeaderboard.map((user, idx) => (
                                <motion.div
                                    key={user.userId}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={cn(
                                        "flex items-center gap-6 p-6 rounded-[2rem] border transition-all hover:scale-[1.01]",
                                        idx === 0 ? "bg-slate-950 text-white border-slate-900 shadow-xl" : "bg-slate-50/50 border-slate-100 hover:bg-white text-slate-950"
                                    )}
                                >
                                    <div className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center font-black italic",
                                        idx === 0 ? "bg-blue-600 text-white" : "bg-white text-slate-400 border border-slate-100"
                                    )}>
                                        #{idx + 1}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm font-black uppercase tracking-tight">{user.username}</div>
                                        <div className={cn("text-[9px] font-bold uppercase tracking-widest mt-1", idx === 0 ? "text-blue-400" : "text-slate-400")}>{user.referralCount} Партнеров</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn("text-lg font-black italic tracking-tighter tabular-nums", idx === 0 ? "text-blue-400" : "text-slate-950")}>{Number(user.revenue).toLocaleString()} ₽</div>
                                        <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Принесено выплатами</div>
                                    </div>
                                </motion.div>
                            )) : (
                                <div className="py-20 text-center text-slate-400 uppercase font-black text-xs italic tracking-widest">Список формируется...</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatBox({ label, value, icon, color = 'slate' }: { label: string, value: string | number, icon: any, color?: 'slate' | 'emerald' | 'blue' }) {
    const cls = {
        slate: "bg-white border-slate-100 text-slate-900",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-900",
        blue: "bg-blue-50 border-blue-100 text-blue-900"
    };
    const iconCls = {
        slate: "bg-slate-50 text-slate-400",
        emerald: "bg-white text-emerald-600",
        blue: "bg-white text-blue-600"
    };

    return (
        <div className={cn("p-8 rounded-[2.5rem] border shadow-sm flex flex-col gap-4", cls[color as keyof typeof cls])}>
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", iconCls[color as keyof typeof iconCls])}>
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60">{label}</p>
                <p className="text-2xl font-black tracking-tighter uppercase italic">{value}</p>
            </div>
        </div>
    );
}


