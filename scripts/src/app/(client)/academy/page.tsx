"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    Cpu,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const platforms = [
    {
        id: "telegram",
        name: "Telegram",
        description: "Глобальный поиск, Premium-подписчики и Boosts. Узнайте, как вывести канал в ТОП.",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
            </svg>
        ),
        color: "bg-[#0088cc]",
        theme: "from-[#0088cc]/10 to-transparent border-[#0088cc]/20",
        stats: "1M+ заказов"
    },
    {
        id: "instagram",
        name: "Instagram",
        description: "Алгоритмы Reels, теневые баны и безопасный массфолловинг. Как избежать пессимизации.",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                <path d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077" />
            </svg>
        ),
        color: "bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888]",
        theme: "from-[#e1306c]/10 to-transparent border-[#e1306c]/20",
        stats: "2M+ заказов"
    },
    {
        id: "tiktok",
        name: "TikTok",
        description: "Оценка 'первого окна', глубина просмотра и попадание в For You (Рекомендации).",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
            </svg>
        ),
        color: "bg-slate-900",
        theme: "from-slate-900/10 to-transparent border-slate-900/20",
        stats: "500K+ заказов"
    },
    {
        id: "vk",
        name: "ВКонтакте",
        description: "Умная лента, виральный охват и значимость комментариев для продвижения постов.",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                <path d="m9.489.004.729-.003h3.564l.73.003.914.01.433.007.418.011.403.014.388.016.374.021.36.025.345.03.333.033c1.74.196 2.933.616 3.833 1.516.9.9 1.32 2.092 1.516 3.833l.034.333.029.346.025.36.02.373.025.588.012.41.013.644.009.915.004.98-.001 3.313-.003.73-.01.914-.007.433-.011.418-.014.403-.016.388-.021.374-.025.36-.03.345-.033.333c-.196 1.74-.616 2.933-1.516 3.833-.9.9-2.092 1.32-3.833 1.516l-.333.034-.346.029-.36.025-.373.02-.588.025-.41.012-.644.013-.915.009-.98.004-3.313-.001-.73-.003-.914-.01-.433-.007-.418-.011-.403-.014-.388-.016-.374-.021-.36-.025-.345-.03-.333-.033c-1.74-.196-2.933-.616-3.833-1.516-.9-.9-1.32-2.092-1.516-3.833l-.034-.333-.029-.346-.025-.36-.02-.373-.025-.588-.012-.41-.013-.644-.009-.915-.004-.98.001-3.313.003-.73.01-.914.007-.433.011-.418.014-.403.016-.388.021-.374.025-.36.03-.345.033-.333c.196-1.74.616-2.933 1.516-3.833.9-.9 2.092-1.32 3.833-1.516l.333-.034.346-.029.36-.025.373-.02.588-.025.41-.012.644-.013.915-.009ZM6.79 7.3H4.05c.13 6.24 3.25 9.99 8.72 9.99h.31v-3.57c2.01.2 3.53 1.67 4.14 3.57h2.84c-.78-2.84-2.83-4.41-4.11-5.01 1.28-.74 3.08-2.54 3.51-4.98h-2.58c-.56 1.98-2.22 3.78-3.8 3.95V7.3H10.5v6.92c-1.6-.4-3.62-2.34-3.71-6.92Z" />
            </svg>
        ),
        color: "bg-[#0077FF]",
        theme: "from-[#0077FF]/10 to-transparent border-[#0077FF]/20",
        stats: "800K+ заказов"
    },
    {
        id: "youtube",
        name: "YouTube",
        description: "Алгоритмы рекомендаций, удержание (Retention) и значимость CTR превью для Shorts и Long-form.",
        icon: (
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7 text-white">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        ),
        color: "bg-[#FF0000]",
        theme: "from-[#FF0000]/10 to-transparent border-[#FF0000]/20",
        stats: "300K+ заказов"
    }
];


export const dynamic = 'force-dynamic';
export default function AcademyPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative pt-24 pb-16 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08)_0%,transparent_70%)] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest mb-6"
                    >
                        <Cpu size={14} />
                        Smmplan Academy
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tight text-slate-950 mb-6"
                    >
                        Алгоритмы и <span className="text-blue-600 italic">Платформы</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto"
                    >
                        Профессиональные исследования алгоритмов социальных сетей. Узнайте, как ранжируется контент, какие лимиты существуют и как безопасно продвигать свои аккаунты.
                    </motion.p>
                </div>
            </section>

            {/* Platforms Grid */}
            <section className="max-w-6xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {platforms.map((platform, idx) => (
                        <Link href={`/academy/${platform.id}`} key={platform.id}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className={cn(
                                    "p-6 md:p-8 rounded-[2rem] border bg-gradient-to-b group hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between",
                                    platform.theme
                                )}
                            >
                                <div>
                                    <div className="flex items-center justify-between mb-6">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform", platform.color)}>
                                            {platform.icon}
                                        </div>
                                        <div className="bg-white px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5">
                                            <ShieldCheck size={12} className="text-emerald-500" />
                                            <span className="text-[10px] font-black tracking-widest uppercase text-slate-600">Verified</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-black text-slate-900 mb-3">{platform.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed mb-6">
                                        {platform.description}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-200/50">
                                    <span className="text-xs font-bold text-slate-400">
                                        {platform.stats}
                                    </span>
                                    <span className="flex items-center gap-1 text-sm font-bold text-blue-600 group-hover:gap-2 transition-all">
                                        Читать гайд <ArrowRight size={16} />
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>

                {/* Dictionary Link Callout */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 p-8 md:p-12 bg-slate-50 border border-slate-100 rounded-[3rem] text-center relative overflow-hidden group"
                >
                    <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">Не знаете базовые SMM термины?</h3>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto font-medium">
                        Прежде чем изучать сложные алгоритмы, загляните в наш глоссарий и узнайте, что такое Drop, Drip-feed и ER.
                    </p>

                    <Link href="/glossary">
                        <button className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-slate-100 hover:border-slate-300 transition-all mx-auto active:scale-95">
                            Открыть Словарь Терминов <ArrowRight size={16} />
                        </button>
                    </Link>
                </motion.div>
            </section>
        </div>
    );
}
