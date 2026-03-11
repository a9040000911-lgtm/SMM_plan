"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap, Users, Star, ArrowRight } from "lucide-react";
import { InstantOrder } from "@/components/stitch/sections/InstantOrder";
import { ReviewsCarousel } from "@/components/stitch/sections/ReviewsCarousel";
import { LeaveReviewModal } from "@/components/stitch/modals/LeaveReviewModal";
import React from "react";

export function HomeContent({ initialReviews = [], projectId }: { initialReviews?: any[], projectId?: string | null }) {
    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);

    return (
        <main className="flex-1 flex flex-col items-center pt-24 pb-12 relative z-10 w-full">
            {/* Micro Greeting */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center mb-12 px-6"
            >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[1.2rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30 rotate-3">
                    <Sparkles className="text-white w-7 h-7" />
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold tracking-tight text-slate-950 mb-6 leading-[0.9]">
                    Продвижение <br /> <span className="text-blue-600 italic">в один клик</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                    Вставьте ссылку и мгновенно выберите идеальный тариф <br className="hidden md:block" /> из нашей экспертной базы услуг с гарантией качества.
                </p>
            </motion.div>

            <InstantOrder />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
            >
                <Link href="/catalog">
                    <button className="px-8 py-4 bg-slate-900 border border-slate-800 text-white rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 hover:bg-slate-800 transition-all hover:shadow-xl hover:shadow-slate-200 shadow-sm active:scale-95">
                        Открыть полный каталог услуг <ArrowRight size={16} />
                    </button>
                </Link>
            </motion.div>

            {/* Stats Section */}
            <section className="w-full max-w-6xl mx-auto py-24 px-6 border-t border-slate-100/50 mt-16 relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                        { label: "Выполненных заказов", value: "1.2M+" },
                        { label: "Активных клиентов", value: "45,000+" },
                        { label: "Сервисов в базе", value: "850+" },
                        { label: "Среднее время старта", value: "2 мин" },
                    ].map((stat, i) => (
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} key={i} className="flex flex-col gap-3">
                            <span className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">{stat.value}</span>
                            <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full max-w-6xl mx-auto py-16 px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">Новый стандарт качества</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg">Почему десятки тысяч пользователей ежедневно доверяют нам продвижение своих самых важных проектов.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { icon: <Zap className="text-amber-500 w-8 h-8" />, title: "Молниеносный старт", desc: "Умные алгоритмы распределения нагрузки. Большинство услуг активируются в течение нескольких минут после оплаты." },
                        { icon: <ShieldCheck className="text-emerald-500 w-8 h-8" />, title: "Гарантия безопасности", desc: "Используем только белые методы продвижения. Ваши аккаунты всегда находятся в полной безопасности от блокировок." },
                        { icon: <Users className="text-blue-500 w-8 h-8" />, title: "Живая аудитория", desc: "Премиальные офферные базы строжайшего контроля качества с активной аудиторией и минимальными списаниями." },
                    ].map((feature, i) => (
                        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} key={i} className="bg-slate-50/50 rounded-[2.5rem] p-10 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-500 group">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-300">{feature.icon}</div>
                            <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">{feature.title}</h3>
                            <p className="text-base text-slate-500 leading-relaxed font-medium">{feature.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="w-full max-w-6xl mx-auto py-24 px-6 mb-12">
                <div className="text-center mb-20 flex flex-col items-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full font-bold text-xs uppercase tracking-widest mb-6">
                        <Star size={14} className="fill-emerald-600" />
                        Рейтинг 4.9/5
                    </div>
                    <h2 className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">Что говорят клиенты</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto font-medium text-lg mb-8">Реальные отзывы от пользователей нашей платформы.</p>

                    <button
                        onClick={() => setIsReviewModalOpen(true)}
                        className="px-8 py-3 bg-white border border-slate-200 text-slate-900 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                    >
                        Оставить свой отзыв
                    </button>
                </div>

                <ReviewsCarousel reviews={initialReviews} />
            </section>

            <LeaveReviewModal
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                projectId={projectId || null}
            />
        </main>
    );
}
