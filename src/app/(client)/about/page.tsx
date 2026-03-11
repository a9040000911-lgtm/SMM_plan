'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ShieldCheck, Zap, Users, Globe, Award, Heart, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
    { label: 'Заказов выполнено', value: '10M+', icon: Zap },
    { label: 'Довольных клиентов', value: '50K+', icon: Users },
    { label: 'Лет на рынке', value: '5+', icon: Globe },
    { label: 'Выполняем за', value: '3 сек.', icon: Rocket },
];

const features = [
    {
        title: 'Ультра-скорость',
        description: 'Наши алгоритмы запускают продвижение мгновенно. Мы ценим ваше время.',
        icon: Zap,
        color: 'text-blue-500',
        bg: 'bg-blue-50'
    },
    {
        title: 'Безопасность',
        description: 'Используем только безопасные методы продвижения, которые не вредят вашим аккаунтам.',
        icon: ShieldCheck,
        color: 'text-emerald-500',
        bg: 'bg-emerald-50'
    },
    {
        title: 'Поддержка 24/7',
        description: 'Наша команда всегда на связи, чтобы помочь вам в решении любых вопросов.',
        icon: Heart,
        color: 'text-rose-500',
        bg: 'bg-rose-50'
    },
    {
        title: 'Гарантия качества',
        description: 'Мы гарантируем результат или возвращаем средства. Честность — наш приоритет.',
        icon: Award,
        color: 'text-purple-500',
        bg: 'bg-purple-50'
    },
];


export const dynamic = 'force-dynamic';
export default function AboutPage() {
    return (
        <div className="w-full max-w-6xl mx-auto px-6 py-12 md:py-24 space-y-24">

            {/* 1. Hero Section */}
            <section className="text-center space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full"
                >
                    <SparkleIcon />
                    <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Будущее SMM уже здесь</span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-7xl font-black text-slate-900 tracking-tight leading-[1.1]"
                >
                    Мы строим платформу, <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">которой доверяют профи.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium"
                >
                    Smmplan — это не просто сервис накрутки. Это высокотехнологичный инструмент для роста вашего бизнеса в социальных сетях.
                </motion.p>
            </section>

            {/* 2. Stats Section */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + idx * 0.1 }}
                        className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center"
                    >
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                            <stat.icon size={24} />
                        </div>
                        <div className="text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                    </motion.div>
                ))}
            </section>

            {/* 3. Features Section */}
            <section className="space-y-12">
                <div className="text-center space-y-4">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Почему выбирают нас</h2>
                    <p className="text-slate-500 font-medium">Технологии, которые работают на ваш результат.</p>
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
                            <h3 className="text-xl font-black text-slate-900 mb-3">{feature.title}</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* 4. Values / Mission Section */}
            <section className="bg-slate-900 rounded-[4rem] p-12 md:p-20 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 blur-[100px] -z-10" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 blur-[100px] -z-10" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">Наша миссия — <br /> делать сложное простым.</h2>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed">
                            Мы верим, что каждый бизнес заслуживает быть замеченным. Наша цель — предоставить доступ к самым передовым технологиям продвижения в один клик. Без лишних слов и сложных настроек.
                        </p>
                        <div className="space-y-4">
                            {['Инновации в каждом коде', 'Прозрачность и честность', 'Постоянный поиск лучшего'].map((item) => (
                                <div key={item} className="flex items-center gap-3 text-sm font-bold">
                                    <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <CheckCircle2 size={14} />
                                    </div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative aspect-square md:aspect-auto h-full min-h-[400px] bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] p-12 flex flex-col justify-end overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
                        <div className="relative z-10 space-y-4">
                            <div className="text-6xl font-black tracking-tighter">SMMPLAN</div>
                            <div className="text-xs font-black uppercase tracking-[0.4em] text-blue-200">Engineering of Growth</div>
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
