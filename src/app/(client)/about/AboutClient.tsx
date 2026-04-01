"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Rocket, ShieldCheck, Zap, Globe, Award, Users, Cpu } from 'lucide-react';
import { cn } from '@/utils/ui';
import Link from 'next/link';

export function AboutClient() {
    const [statsData, setStatsData] = useState<any>(null);

    useEffect(() => {
        fetch('/api/client/marketing/stats')
            .then(res => res.json())
            .then(json => {
                if (json.success) setStatsData(json.data);
            })
            .catch(console.error);
    }, []);

    const dynamicStats = [
        { label: 'Услуг в каталоге', value: statsData?.services ? `${statsData.services}+` : '...', icon: Zap },
        { label: 'Поддерживаемых платформ', value: '6+', icon: Globe },
        { label: 'Умный подбор', value: 'Авто', icon: Cpu },
        { label: 'Запуск', value: 'Апрель 2026', icon: Rocket },
    ];

    const features = [
        {
            title: 'Создано профессионалами',
            description: 'Мы годами работали с десятками SMM-панелей и знаем их слабые места. Smmplan — платформа, которую мы построили для себя.',
            icon: Users,
            color: 'text-blue-500',
            bg: 'bg-blue-50'
        },
        {
            title: 'Безопасность',
            description: 'Используем только проверенные методы продвижения. Безопасность ваших аккаунтов — наш безусловный приоритет.',
            icon: ShieldCheck,
            color: 'text-emerald-500',
            bg: 'bg-emerald-50'
        },
        {
            title: 'Умная автоматизация',
            description: 'Алгоритмы сами подбирают лучшие услуги под ваш тип ссылки, минимизируя ошибки при заказе.',
            icon: Cpu,
            color: 'text-purple-500',
            bg: 'bg-purple-50'
        },
        {
            title: 'Планирование и Drip-feed',
            description: 'Запланируйте рост на неделю вперёд или используйте плавную доставку для естественного развития профиля.',
            icon: Rocket,
            color: 'text-rose-500',
            bg: 'bg-rose-50'
        },
    ];

    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-12 md:py-24 space-y-24">
            {/* Hero Section */}
            <section className="text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full"
                >
                    <SparkleIcon />
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Профессиональный подход к SMM</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]"
                >
                    Создано для тех, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">кто ценит качество и результат.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed"
                >
                    Smmplan — это не просто сервис продвижения. Это высокотехнологичная платформа, разработанная SMM-специалистами для автоматизации сложного процесса роста в соцсетях.
                </motion.p>
            </section>

            {/* Stats Section */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {dynamicStats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center group hover:border-blue-200 transition-colors"
                    >
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                            <stat.icon size={24} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight">{stat.label}</div>
                    </motion.div>
                ))}
            </section>

            {/* Features Section */}
            <section className="space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">Наши <span className="text-blue-600">преимущества</span></h2>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Технологии, за которые нам не стыдно</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {features.map((feature, idx) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="p-10 bg-white border border-slate-100 rounded-[3rem] hover:ring-4 hover:ring-blue-50 transition-all group"
                        >
                            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", feature.bg, feature.color)}>
                                <feature.icon size={28} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-3 uppercase italic tracking-tight">{feature.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Early Adopter Section */}
            <section className="bg-slate-950 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 opacity-[0.15] blur-[120px] rounded-full -mr-64 -mt-64 transition-transform group-hover:scale-110" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 opacity-[0.1] blur-[100px] rounded-full -ml-48 -mb-48" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-10 text-center lg:text-left">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
                                <Award className="text-blue-400" size={16} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Early Adopter Offer</span>
                            </div>
                            <h2 className="text-5xl md:text-6xl font-black tracking-tight leading-[0.9] uppercase italic">
                                Станьте <span className="text-blue-500">частью истории.</span>
                            </h2>
                        </div>
                        
                        <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                            Мы верим в силу честного партнерства. Первые 300 пользователей, зарегистрировавшихся до официального запуска в апреле 2026, получат статус «Первопроходца» и <span className="text-white font-bold">пожизненную скидку 20%</span> на все услуги платформы.
                        </p>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <Link href="/register">
                                <button className="px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 hover:-translate-y-1 active:scale-95">
                                    Занять место в списке
                                </button>
                            </Link>
                            <div className="px-6 py-5 rounded-2xl border border-slate-800 bg-slate-900/50 flex flex-col items-center lg:items-start min-w-[160px]">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Осталось мест:</span>
                                <span className="text-xl font-black text-white">{statsData ? Math.max(0, statsData.earlyBirdLimit - statsData.users) : '...'} / 300</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="relative aspect-square bg-gradient-to-br from-blue-600 to-indigo-900 rounded-[3.5rem] p-12 flex flex-col justify-between overflow-hidden shadow-2xl group/card">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center">
                                <Globe size={32} className="text-white" />
                            </div>
                            <div className="text-right">
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Established</div>
                                <div className="text-lg font-black italic">2026</div>
                            </div>
                        </div>
                        <div className="relative z-10 space-y-2">
                            <div className="text-xs font-black uppercase tracking-[0.4em] text-blue-300">Engineering of Growth</div>
                            <div className="text-7xl font-black tracking-tighter leading-none transition-transform group-hover/card:scale-105 duration-700">SMMPLAN</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function SparkleIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill="currentColor" />
        </svg>
    );
}
