"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from "react";
import { Shield, Wallet, Award, Settings, LogOut, Loader2, Box, Activity, Cpu, Trophy, Target } from "lucide-react";
import { motion } from "framer-motion";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { OverviewTab } from "@/components/client/profile/OverviewTab";
import { OrdersTab } from "@/components/client/profile/OrdersTab";
import { FinanceTab } from "@/components/client/profile/FinanceTab";
import { AchievementsTab } from "@/components/client/profile/AchievementsTab";
import ActiveChallenges from "@/components/gamification/ActiveChallenges";

export const dynamic = 'force-dynamic';

export default function ProfilePage() {
    const [userData, setUserData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'finance' | 'achievements' | 'challenges'>('overview');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, statsRes, ordersRes] = await Promise.all([
                    fetch("/api/client/user"),
                    fetch("/api/client/stats"),
                    fetch("/api/client/orders?limit=5")
                ]);

                if (userRes.status === 401 || statsRes.status === 401 || ordersRes.status === 401) {
                    setUserData(null);
                    setLoading(false);
                    return;
                }

                if (userRes.ok) setUserData(await userRes.json());
                if (statsRes.ok) setStats(await statsRes.json());
                if (ordersRes.ok) {
                    const data = await ordersRes.json();
                    setRecentOrders(data.orders || []);
                }
            } catch (_error) {
                console.error(_error);
                setUserData(null);
            }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary opacity-20" size={48} />
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
                <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center text-rose-500 bg-rose-50 border border-rose-100 shadow-xl shadow-rose-500/10">
                    <Shield size={40} />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-black text-[#171717] tracking-tight uppercase">Доступ ограничен</h2>
                    <p className="text-sm font-bold text-slate-400 max-w-xs mx-auto">
                        Пожалуйста, авторизуйтесь для просмотра своего профиля.
                    </p>
                </div>
                <Link href="/login">
                    <button className="bg-[#171717] text-white px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl">
                        Войти в аккаунт
                    </button>
                </Link>
            </div>
        );
    }

    const isMaxTier = userData.loyalty?.name === "Легенда";

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-24 px-4 pt-10">
            {/* Header Section */}
            <div className="relative rounded-[3rem] bg-white border border-slate-100 p-8 md:p-12 shadow-[0_30px_60px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center gap-10 overflow-hidden group">
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-[0.03] rounded-full -mr-48 -mt-48 transition-transform group-hover:scale-110" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-slate-500 opacity-[0.02] rounded-full -ml-32 -mb-32" />

                <div className="relative shrink-0">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-4 border-white flex items-center justify-center text-[#171717] text-5xl font-black italic shadow-2xl relative z-10 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                        {userData.username?.[0].toUpperCase() || "U"}
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-blue-600 border-4 border-white flex items-center justify-center z-20 shadow-lg">
                        <Cpu size={18} className="text-white" />
                    </div>
                </div>

                <div className="space-y-6 text-center md:text-left flex-1 relative z-10">
                    <div className="space-y-1">
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-1">Профиль пользователя</div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-[#171717] flex items-center justify-center md:justify-start gap-4">
                            {userData.username}
                            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                        </h1>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{userData.email}</p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                        <div className="px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-100 text-[#171717] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-sm transition-all hover:bg-white hover:shadow-md">
                            <Shield size={12} className="text-blue-500" /> СТАТУС: {userData.role}
                        </div>
                        <div className="px-5 py-2.5 bg-[#171717] rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl hover:-translate-y-0.5 transition-transform">
                            <Award size={12} className="text-blue-400" /> РАНГ: {userData.loyalty?.name} (-{userData.loyalty?.discount}%)
                        </div>
                        {userData.loyalty?.pioneerIndex && (
                            <div className="px-5 py-2.5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-pulse shadow-sm">
                                <Award size={12} /> ПЕРВОПРОХОДЕЦ #{userData.loyalty.pioneerIndex}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 items-center justify-center md:justify-end relative z-10">
                    {/* Max Tier Badge */}
                    {isMaxTier && (
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                            <Award size={20} className="text-emerald-500" />
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">ЛЕГЕНДА СЕРВИСА</span>
                        </div>
                    )}
                    {userData.tgId ? (
                        <div className="px-6 py-4 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-3xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                            TELEGRAM_SYNCED
                        </div>
                    ) : userData.botUsername && (
                        <a
                            href={`https://t.me/${userData.botUsername}?start=bind_${userData.id.split('-')[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-3xl px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-500/20"
                        >
                            ПРИВЯЗАТЬ БОТА
                        </a>
                    )}
                    <Link href="/dashboard/settings">
                        <button className="p-4 rounded-2xl bg-slate-50 text-slate-400 border border-slate-100 hover:bg-white hover:text-blue-600 hover:shadow-md transition-all">
                            <Settings size={22} />
                        </button>
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="p-4 rounded-2xl bg-rose-50 text-rose-400 border border-rose-100 hover:bg-white hover:text-rose-600 hover:shadow-md transition-all"
                    >
                        <LogOut size={22} />
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-slate-100 pb-0 overflow-x-auto no-scrollbar scroll-smooth">
                {[
                    { id: 'overview', label: 'Обзор', icon: Activity },
                    { id: 'orders', label: 'История', icon: Box },
                    { id: 'finance', label: 'Финансы', icon: Wallet },
                    { id: 'achievements', label: 'Награды', icon: Trophy },
                    { id: 'challenges', label: 'Челленджи', icon: Target },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
                                (window as any).Telegram.WebApp.HapticFeedback.selectionChanged();
                            }
                            setActiveTab(tab.id as any);
                        }}
                        className={cn(
                            "group px-8 py-5 text-[11px] font-black uppercase tracking-widest transition-all relative flex items-center gap-3 whitespace-nowrap",
                            activeTab === tab.id
                                ? "text-blue-600"
                                : "text-slate-400 hover:text-[#171717]"
                        )}
                    >
                        <tab.icon size={14} className={cn("transition-transform group-hover:scale-110", activeTab === tab.id ? "text-blue-600" : "text-slate-300")} />
                        {tab.label}
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="profile-tab-active"
                                className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-t-full shadow-[0_-2px_10px_rgba(37,99,235,0.4)]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px] animate-in fade-in slide-in-from-bottom-2 duration-500">
                {activeTab === 'overview' && (
                    <OverviewTab userData={userData} stats={stats} />
                )}
                {activeTab === 'orders' && (
                    <OrdersTab orders={recentOrders} />
                )}
                {activeTab === 'finance' && (
                    <FinanceTab currentBalance={userData.balance} />
                )}
                {activeTab === 'achievements' && (
                    <AchievementsTab userId={userData.id} />
                )}
                {activeTab === 'challenges' && (
                    <div className="space-y-8 pt-6">
                        <div className="text-center space-y-3">
                            <h2 className="text-4xl font-black text-[#171717] tracking-tight uppercase italic">Активные <span className="text-blue-600">челленджи</span></h2>
                            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest leading-relaxed">Выполняйте задания и получайте заслуженные награды автоматически</p>
                        </div>
                        <div className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                            <ActiveChallenges />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
