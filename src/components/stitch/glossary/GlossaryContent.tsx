"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import { motion } from "framer-motion";
import {
    BookOpen, Zap, ShieldCheck, RefreshCcw,
    ArrowDown, Flame, Users, Layers,
    Code2, Globe, HelpCircle, ChevronRight,
    TrendingUp, Video, ArrowRight
} from "lucide-react";
import Link from "next/link";

const categories = [
    {
        title: "Базовые понятия",
        icon: <BookOpen className="text-blue-500" size={24} />,
        terms: [
            {
                term: "Накрутка (Promotion)",
                definition: "Искусственное увеличение показателей активности (подписчики, лайки, просмотры) для создания видимости популярности и привлечения органического трафика.",
                icon: <Zap size={18} />
            },
            {
                term: "Офферы (Offers)",
                definition: "Реальные пользователи, которые выполняют действия (подписка, лайк) за вознаграждение. Качество таких аккаунтов выше, чем у ботов, но ниже, чем у целевой аудитории.",
                icon: <Users size={18} />
            },
            {
                term: "Живые (HQ/Real)",
                definition: "Аккаунты с заполненными профилями, аватарками и постами, которые максимально имитируют поведение обычных людей. Это самый безопасный вид продвижения.",
                icon: <ShieldCheck size={18} />
            }
        ]
    },
    {
        title: "Гарантии и Риски",
        icon: <ShieldCheck className="text-emerald-500" size={24} />,
        terms: [
            {
                term: "Refill (Докрут)",
                definition: "Бесплатное восполнение количества подписчиков или лайков, если часть из них отписалась (списалась) в течение гарантийного срока (обычно 30 дней).",
                icon: <RefreshCcw size={18} />
            },
            {
                term: "Drop (Списания)",
                definition: "Процесс удаления активности алгоритмами социальных сетей. Если вы заказали 1000 и осталось 900 — значит 'дроп' составил 10%.",
                icon: <ArrowDown size={18} />
            },
            {
                term: "Nofill (Без гарантии)",
                definition: "Услуги без возможности бесплатного восстановления. Обычно стоят дешевле, но несут риск полной потери результата без компенсации.",
                icon: <HelpCircle size={18} />
            }
        ]
    },
    {
        title: "Технологии заказа",
        icon: <Layers className="text-purple-500" size={24} />,
        terms: [
            {
                term: "Drip-feed (Постепенно)",
                definition: "Функция, позволяющая разделить один большой заказ на several мелких частей, которые будут запускаться автоматически через заданные интервалы времени. Это создает эффект естественного роста.",
                icon: <Flame size={18} />
            },
            {
                term: "API Integration",
                definition: "Возможность программного подключения вашего сайта или приложения к нашей платформе для автоматического создания заказов.",
                icon: <Code2 size={18} />
            },
            {
                term: "Child Panel",
                definition: "Ваш собственный сайт SMM-услуг, который полностью синхронизирован с нашей базой, позволяя вам перепродавать наши услуги под своим брендом.",
                icon: <Globe size={18} />
            }
        ]
    },
    {
        title: "Социальные метрики",
        icon: <TrendingUp className="text-orange-500" size={24} />,
        terms: [
            {
                term: "Engagement Rate (ER)",
                definition: "Коэффициент вовлеченности аудитории. Рассчитывается как отношение суммы всех реакций (лайки, комменты, репосты) к количеству подписчиков или охвату.",
                icon: <ArrowRight size={18} />
            },
            {
                term: "Reach (Охват)",
                definition: "Количество уникальных пользователей, которые увидели ваш контент. Один человек может посмотреть пост 10 раз, но в охват он засчитается как 1.",
                icon: <Users size={18} />
            },
            {
                term: "Impressions (Показы)",
                definition: "Общее количество просмотров вашего контента. Если один пользователь посмотрел пост 3 раза, это будет 3 показа, но 1 охват.",
                icon: <Video size={18} />
            }
        ]
    }
];

export function GlossaryContent() {
    return (
        <>
            {/* Hero Section */}
            <section className="relative pt-24 pb-16 px-6 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[400px] bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.08)_0%,transparent_70%)] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full font-black text-[10px] uppercase tracking-widest mb-6"
                    >
                        <BookOpen size={14} />
                        База знаний Smmplan
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tight text-slate-950 mb-6"
                    >
                        Словарь <span className="text-blue-600 italic">терминов</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto"
                    >
                        Не знаете, чем отличается Refill от Drip-feed? Мы подготовили простой путеводитель по миру SMM, чтобы вы могли заказывать уверенно.
                    </motion.p>
                </div>
            </section>

            {/* Glossary Grid */}
            <section className="max-w-6xl mx-auto px-6 pb-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categories.map((cat, catIdx) => (
                        <motion.div
                            key={catIdx}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: catIdx * 0.1 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                                    {cat.icon}
                                </div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">{cat.title}</h2>
                            </div>

                            <div className="space-y-4">
                                {cat.terms.map((item, termIdx) => (
                                    <div
                                        key={termIdx}
                                        className="p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="text-blue-500 group-hover:scale-110 transition-transform">
                                                {item.icon}
                                            </div>
                                            <h3 className="font-black text-slate-900 leading-tight">
                                                {item.term}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed font-medium">
                                            {item.definition}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* FAQ Link Callout */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="mt-24 p-12 bg-slate-900 rounded-[3rem] text-center relative overflow-hidden group shadow-2xl shadow-slate-200"
                >
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full" />

                    <h3 className="text-3xl font-black text-white mb-4 tracking-tight relative z-10">Остались вопросы?</h3>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto font-medium relative z-10">
                        Загляните в наш раздел Частых Вопросов, там есть подробные инструкции по созданию заказов и оплате.
                    </p>

                    <Link href="/faq">
                        <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 hover:bg-blue-50 transition-all mx-auto active:scale-95 relative z-10">
                            Перейти в FAQ <ChevronRight size={16} />
                        </button>
                    </Link>
                </motion.div>
            </section>
        </>
    );
}


