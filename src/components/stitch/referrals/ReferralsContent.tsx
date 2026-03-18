"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useEffect, useState } from 'react';
import { Trophy, Copy, Check, Target } from 'lucide-react';
import { cn } from '@/utils/ui';

interface LeaderboardEntry {
    rank: number;
    userId: string;
    username: string;
    referralCount: number;
    revenue: string;
}

const TIER_INFO = [
    { tier: 1, name: 'Tier 1', icon: '💫', bonus: '10%', range: '0-1000₽', color: 'from-blue-500 to-cyan-500' },
    { tier: 2, name: 'Tier 2', icon: '⭐', bonus: '15%', range: '1000-5000₽', color: 'from-purple-500 to-pink-500' },
    { tier: 3, name: 'Tier 3', icon: '🏆', bonus: '20%', range: '5000₽+', color: 'from-amber-500 to-orange-500' }
];

export function ReferralsContent() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    const referralLink = typeof window !== 'undefined'
        ? `${window.location.origin}?ref=YOUR_CODE`
        : '';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch('/api/client/referrals/leaderboard');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setLeaderboard(data.leaderboard || []);
            } catch (error) {
                console.error('Failed to fetch referral data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return <div className="p-20 text-center animate-pulse text-slate-400 font-black uppercase tracking-widest italic">Загрузка данных программы...</div>;
    }

    return (
        <div className="space-y-12 max-w-6xl mx-auto px-4 pb-24 pt-12">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
                <h1 className="text-5xl font-black text-[#171717] tracking-tighter uppercase italic">
                    Партнерская <span className="text-blue-600">система</span>
                </h1>
                <p className="text-slate-500 font-bold text-lg leading-relaxed">
                    Зарабатывайте вместе с Smmplan. Получайте до <span className="text-[#171717] font-black">20%</span> прибыли от всех платежей ваших друзей навсегда.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {TIER_INFO.map(tier => (
                    <div key={tier.tier} className="group relative rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)] transition-all hover:-translate-y-1 hover:shadow-xl overflow-hidden">
                        <div className={cn("absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r", tier.color)} />
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl">{tier.icon}</div>
                            <span className="rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black text-blue-600 uppercase tracking-widest">+{tier.bonus}</span>
                        </div>
                        <h3 className="font-black text-2xl text-[#171717] tracking-tight uppercase italic">{tier.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">LTV реферала: {tier.range}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 rounded-[2.5rem] bg-white border border-slate-100 p-8 space-y-6 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <h2 className="text-2xl font-black text-[#171717] tracking-tight uppercase italic flex items-center gap-3"><Target className="w-6 h-6 text-blue-600" /> Ваша <span className="text-blue-600">ссылка</span></h2>
                    <div className="relative group">
                        <input type="text" value={referralLink} readOnly className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-bold text-[#171717] outline-none" />
                        <button onClick={handleCopy} className={cn("absolute right-2 top-2 bottom-2 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all", copied ? "bg-emerald-500 text-white" : "bg-[#171717] text-white")}>
                            {copied ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>
                <div className="lg:col-span-3 rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
                    <h2 className="text-2xl font-black text-[#171717] tracking-tight uppercase italic flex items-center gap-3"><Trophy className="w-6 h-6 text-blue-600" /> Топ <span className="text-blue-600">доходов</span></h2>
                    <div className="space-y-4 mt-8">
                        {leaderboard.map((entry, idx) => (
                            <div key={entry.userId} className="flex items-center gap-5 p-4 rounded-2xl border border-slate-50">
                                <span className="font-black text-slate-300">#0{idx + 1}</span>
                                <div className="flex-1 font-black italic uppercase">{entry.username}</div>
                                <div className="font-black text-blue-600">{Number(entry.revenue).toFixed(0)}₽</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}


