'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useEffect, useState } from 'react';
import { cn } from "@/lib/utils";

interface Challenge {
    id: string;
    type: string;
    target: number;
    progress: number;
    reward: string;
    completed: boolean;
    expiresAt: string;
    createdAt: string;
}

const CHALLENGE_LABELS: Record<string, { name: string; icon: string; description: string }> = {
    TRIPLE_THREAT: {
        name: 'Тройная угроза',
        icon: '⚡',
        description: '3 заказа за неделю'
    },
    SOCIAL_SHARE: {
        name: 'Социальный амбассадор',
        icon: '📢',
        description: '5 рефералов за месяц'
    },
    EARLY_BIRD: {
        name: 'Ранняя пташка',
        icon: '🌅',
        description: 'Заказ до 10:00'
    },
    WEEKEND_WARRIOR: {
        name: 'Выходной боец',
        icon: '🎯',
        description: '5 заказов за выходные'
    },
    SPENDING_SPREE: {
        name: 'Марафон покупок',
        icon: '💰',
        description: '5000₽ за месяц'
    }
};

export default function ActiveChallenges() {
    const [challenges, setChallenges] = useState<Challenge[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChallenges();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchChallenges, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchChallenges = async () => {
        try {
            const res = await fetch('/api/client/challenges');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setChallenges(data.challenges || []);
        } catch (error) {
            console.error('Failed to fetch challenges:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTimeRemaining = (expiresAt: string) => {
        const now = new Date().getTime();
        const expires = new Date(expiresAt).getTime();
        const diff = expires - now;

        if (diff <= 0) return 'Истекло';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}д ${hours % 24}ч`;
        return `${hours}ч`;
    };

    if (loading) {
        return (
            <div className="grid gap-6 sm:grid-cols-2">
                {[1, 2].map(i => (
                    <div key={i} className="animate-pulse rounded-[2.5rem] border border-slate-100 bg-white p-8 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 rounded bg-slate-50" />
                                <div className="h-3 w-1/2 rounded bg-slate-50" />
                            </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-50" />
                    </div>
                ))}
            </div>
        );
    }

    if (challenges.length === 0) {
        return (
            <div className="rounded-[3rem] bg-slate-50/50 border border-dashed border-slate-200 p-20 text-center space-y-4">
                <div className="text-5xl">🎯</div>
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-[#171717] tracking-tight uppercase italic">Нет активных челленджей</h3>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest max-w-sm mx-auto">Делайте заказы и приглашайте друзей чтобы активировать челленджи!</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2">
            {challenges.map(challenge => {
                const label = CHALLENGE_LABELS[challenge.type] || {
                    name: challenge.type,
                    icon: '🎯',
                    description: ''
                };

                const progressPercent = Math.min(100, (challenge.progress / challenge.target) * 100);
                const isCompleted = challenge.completed;

                return (
                    <div
                        key={challenge.id}
                        className={cn(
                            "rounded-[2.5rem] border p-8 transition-all relative overflow-hidden group",
                            isCompleted
                                ? "border-emerald-100 bg-emerald-50/30 shadow-[0_15px_40px_rgba(16,185,129,0.05)]"
                                : "border-slate-100 bg-white hover:border-blue-100 hover:shadow-xl shadow-[0_15px_40px_rgba(0,0,0,0.02)]"
                        )}
                    >
                        <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm transition-transform group-hover:scale-110 group-hover:rotate-6",
                                    isCompleted ? "bg-white text-emerald-500" : "bg-slate-50 text-blue-500"
                                )}>
                                    {label.icon}
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-[#171717] uppercase italic leading-none mb-1.5">{label.name}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label.description}</p>
                                </div>
                            </div>
                            <div className={cn(
                                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-sm",
                                isCompleted ? "bg-emerald-500 text-white" : "bg-blue-600 text-white"
                            )}>
                                + {challenge.reward}₽
                            </div>
                        </div>

                        <div className="mt-8 relative z-10">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] mb-3">
                                <span className={isCompleted ? "text-emerald-600" : "text-slate-400"}>
                                    ПРОГРЕСС: {challenge.progress} / {challenge.target}
                                </span>
                                <span className="text-slate-400 flex items-center gap-2">
                                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                                    ⏰ {getTimeRemaining(challenge.expiresAt)}
                                </span>
                            </div>

                            <div className="h-4 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5 relative shadow-inner">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-1000 ease-out relative",
                                        isCompleted
                                            ? 'bg-emerald-500'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-500'
                                    )}
                                    style={{ width: `${progressPercent}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
                                </div>
                            </div>
                        </div>

                        {isCompleted && (
                            <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-white border border-emerald-100 py-3 text-[10px] font-black uppercase tracking-widest text-emerald-600 shadow-sm relative z-10">
                                <span className="text-lg">✅</span>
                                <span>Награда зачислена</span>
                            </div>
                        )}

                        {/* Background Decoration */}
                        <div className={cn(
                            "absolute bottom-0 right-0 w-32 h-32 opacity-[0.03] transition-transform group-hover:scale-125",
                            isCompleted ? "bg-emerald-500" : "bg-blue-500",
                            "rounded-full -mr-16 -mb-16 blur-3xl"
                        )} />
                    </div>
                );
            })}
        </div>
    );
}
