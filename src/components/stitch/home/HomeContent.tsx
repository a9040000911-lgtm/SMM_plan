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
import { BlockRenderer, CmsBlock } from "@/components/cms/BlockRenderer";
import { useCmsBridge } from "@/components/cms/CmsBridge";
import React from "react";

export function HomeContent({ 
    initialReviews = [], 
    projectId, 
    cmsContent = {},
    cmsBlocks = []
}: { 
    initialReviews?: any[], 
    projectId?: string | null,
    cmsContent?: Record<string, string>,
    cmsBlocks?: CmsBlock[]
}) {
    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const { isLivePreview, liveStrings } = useCmsBridge();
    const t = (key: string, fallback: string) => {
        const fullKey = `cms.${key}`;
        const val = (isLivePreview && liveStrings[fullKey]) ? liveStrings[fullKey] : (cmsContent[fullKey] || fallback);
        
        if (isLivePreview) {
            return (
                <span 
                    data-cms-key={fullKey} 
                    className="outline-none focus:ring-2 focus:ring-blue-500/50 rounded-sm px-0.5 transition-all hover:bg-blue-50/50 cursor-pointer"
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                        // Уведомляем админку об изменении текста прямо в превью
                        if (window.parent !== window) {
                            window.parent.postMessage({
                                type: 'CMS_INLINE_CHANGE',
                                payload: { key: fullKey, value: e.currentTarget.innerText }
                            }, '*');
                        }
                    }}
                >
                    {val}
                </span>
            );
        }
        return val;
    };

    return (
        <main className="flex-1 flex flex-col items-center pt-24 pb-12 relative z-10 w-full">
            {/* CMS Top Zone (e.g. Banners) */}
            <BlockRenderer blocks={cmsBlocks} position="top" />

            {/* Micro Greeting */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center mb-12 px-6 mt-12"
            >
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-[1.2rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-500/30 rotate-3">
                    <Sparkles className="text-white w-7 h-7" />
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-[5rem] font-extrabold tracking-tight text-slate-950 mb-6 leading-[0.9]">
                    {t('home.hero.title', 'Продвижение')} <br /> <span className="text-blue-600 italic">{t('home.hero.subtitle', 'в один клик')}</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                    {t('home.hero.description', 'Вставьте ссылку и мгновенно выберите идеальный тариф из нашей экспертной базы услуг с гарантией качества.')}
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
                        {t('home.hero.cta', 'Открыть полный каталог услуг')} <ArrowRight size={16} />
                    </button>
                </Link>
            </motion.div>

            {/* CMS Middle Zone (e.g. Promo Carousels) */}
            <div className="w-full mt-24">
                <BlockRenderer blocks={cmsBlocks} position="middle" />
            </div>

            {/* Stats Section */}
            <section className="w-full max-w-6xl mx-auto py-24 px-6 border-t border-slate-100/50 mt-16 relative">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                    {[
                        { label: t('home.stats.orders', 'Выполненных заказов'), value: "1.2M+" },
                        { label: t('home.stats.clients', 'Активных клиентов'), value: "45,000+" },
                        { label: t('home.stats.services', 'Сервисов в базе'), value: "850+" },
                        { label: t('home.stats.start', 'Среднее время старта'), value: t('home.stats.start_value', "2 мин") },
                    ].map((stat, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <span className="text-3xl font-black text-slate-900 mb-2">{stat.value}</span>
                            <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">{stat.label}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features (Mobile-friendly Grid) */}
            <section className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-6 py-12">
                {[
                    {
                        icon: <ShieldCheck className="text-blue-600" size={24} />,
                        title: t('home.features.security.title', "Максимальная безопасность"),
                        desc: t('home.features.security.desc', "Мы используем только проверенные и безопасные алгоритмы продвижения.")
                    },
                    {
                        icon: <Zap className="text-blue-600" size={24} />,
                        title: t('home.features.speed.title', "Моментальный старт"),
                        desc: t('home.features.speed.desc', "Большинство заказов запускаются в работу автоматически сразу после оплаты.")
                    },
                    {
                        icon: <Users className="text-blue-600" size={24} />,
                        title: t('home.features.support.title', "Экспертная поддержка"),
                        desc: t('home.features.support.desc', "Наши специалисты помогут подобрать идеальную стратегию продвижения.")
                    }
                ].map((feature, i) => (
                    <div key={i} className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:bg-white hover:shadow-xl hover:shadow-blue-500/5 transition-all group">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                            {feature.icon}
                        </div>
                        <h3 className="text-xl font-extrabold text-slate-900 mb-3">{feature.title}</h3>
                        <p className="text-slate-500 text-[15px] leading-relaxed font-medium">{feature.desc}</p>
                    </div>
                ))}
            </section>

            {/* Reviews Section */}
            <section className="w-full py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-10 md:px-14">
                    <div className="flex flex-col items-center text-center mb-16 gap-8">
                        <div className="max-w-2xl">
                            <div className="flex items-center justify-center gap-2 mb-6">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                                            <div className="w-full h-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                {String.fromCharCode(64 + i)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="h-px w-8 bg-slate-200" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {t('home.reviews.subtitle', 'Более 45,000 отзывов')}
                                </span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black text-slate-950 leading-[0.95] tracking-tight">
                                {t('home.reviews.title', 'Нам доверяют')} <br />
                                <span className="text-blue-600 italic">{t('home.reviews.title_accent', 'свои проекты')}</span>
                            </h2>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex items-center gap-1 mb-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} size={20} className="text-amber-400 fill-amber-400 shadow-amber-500/20" />
                                ))}
                                <span className="ml-2 font-black text-2xl text-slate-950">4.9/5</span>
                            </div>
                            <button 
                                onClick={() => setIsReviewModalOpen(true)}
                                className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-1 active:scale-95"
                            >
                                {t('home.reviews.cta', 'Оставить свой отзыв')}
                            </button>
                        </div>
                    </div>
                    
                    <ReviewsCarousel reviews={initialReviews} />
                </div>
            </section>

            {/* CMS Bottom Zone (e.g. Legal Footers or Info Banners) */}
            <BlockRenderer blocks={cmsBlocks} position="bottom" />

            <footer className="w-full py-12 px-6 border-t border-slate-100 flex flex-col items-center gap-6 text-center">
                <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <Link href="/legal/terms" className="hover:text-blue-600 transition-colors">{t('footer.terms', 'Условия')}</Link>
                    <Link href="/legal/privacy" className="hover:text-blue-600 transition-colors">{t('footer.privacy', 'Приватность')}</Link>
                    <Link href="/faq" className="hover:text-blue-600 transition-colors">{t('footer.faq', 'Помощь')}</Link>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                    © 2024-2026 Smmplan. Все права защищены. Разработано для профессионального роста.
                </div>
            </footer>

            <LeaveReviewModal 
                isOpen={isReviewModalOpen} 
                onClose={() => setIsReviewModalOpen(false)} 
                projectId={projectId ?? null}
            />

            {/* Unpositioned blocks (e.g. Modals) */}
            <BlockRenderer blocks={cmsBlocks} />
        </main>
    );
}


