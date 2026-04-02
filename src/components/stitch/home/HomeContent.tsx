"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { Star, ArrowRight, Headphones, Clock, Timer } from "lucide-react";
import { InstantOrder } from "@/components/stitch/sections/InstantOrder";
import { ReviewsCarousel } from "@/components/stitch/sections/ReviewsCarousel";
import { LeaveReviewModal } from "@/components/stitch/modals/LeaveReviewModal";
import { BlockRenderer, CmsBlock } from "@/components/cms/BlockRenderer";
import { useCmsBridge } from "@/components/cms/CmsBridge";
import React from "react";
import { cn } from "@/utils/ui";

import { HubInput } from "@/components/stitch/ui/HubInput";
import { useSearchParams } from "next/navigation";
import { ACADEMY_ARTICLES } from "@/configs/academy-content";

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
            delayChildren: 0.1,
            ease: "easeOut"
        }
    }
};

const staggerItem: Variants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    show: { 
        opacity: 1, 
        y: 0, 
        filter: "blur(0px)",
        transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } 
    }
};

export function HomeContent({ 
    initialReviews = [], 
    projectId, 
    cmsContent = {},
    cmsBlocks = [],
    projectConfig = null,
    globalStats
}: { 
    initialReviews?: any[], 
    projectId?: string | null,
    cmsContent?: Record<string, string>,
    cmsBlocks?: CmsBlock[],
    projectConfig?: any,
    globalStats?: {
        totalOrders: number;
        totalUsers: number;
        onlineUsers: number;
        promoRemaining: number;
        promoTotal: number;
        formatted: { orders: string; users: string };
    } | null
}) {
    const [showIcons, setShowIcons] = React.useState(false);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        const handleHubEvent = (e: any) => {
            handleHubAnalyze(e.detail?.url || '', e.detail?.platform || null);
        };
        window.addEventListener('cms:hub-analyze', handleHubEvent as EventListener);

        return () => {
            window.removeEventListener('resize', checkMobile);
            window.removeEventListener('cms:hub-analyze', handleHubEvent as EventListener);
        };
    }, []);
    const [isReviewModalOpen, setIsReviewModalOpen] = React.useState(false);
    const [hubLink, setHubLink] = React.useState("");
    const [hubPlatform, setHubPlatform] = React.useState<string | null>(null);
    const [isOrderExpanded, setIsOrderExpanded] = React.useState(false);

    const searchParams = useSearchParams();
    const serviceId = searchParams.get('serviceId');

    // Auto-expand if serviceId is provided in URL
    React.useEffect(() => {
        if (serviceId) {
            setIsOrderExpanded(true);
        }
    }, [serviceId]);

    const handleHubAnalyze = (url: string, platform: string | null) => {
        setHubLink(url);
        setHubPlatform(platform);
        setIsOrderExpanded(true); // Proactive step: open order window immediately
    };

    const { isLivePreview, liveStrings, liveBlocks } = useCmsBridge();
    
    const t = (key: string, fallback: string) => {
        const fullKey = `cms.${key}`;
        const val = (isLivePreview && liveStrings[fullKey]) ? liveStrings[fullKey] : (cmsContent[fullKey] || fallback);
        return val;
    };

    const displayBlocks = isLivePreview && liveBlocks.length > 0 ? liveBlocks : cmsBlocks;
    const hasStructuralBlocks = displayBlocks.some((b: any) => ['HERO', 'FEATURES', 'STATS'].includes(b.type));

    return (
        <main className="flex-1 w-full relative overflow-x-hidden">
            {/* Mesh Background Upgrade */}
            <div className="absolute inset-0 mesh-bg opacity-40 pointer-events-none" />
            
            {hasStructuralBlocks ? (
                <div className="w-full">
                    <BlockRenderer blocks={displayBlocks} position="top" />
                    <BlockRenderer blocks={displayBlocks} />
                </div>
            ) : (
                <div className="w-full">
                {/* Visionary Hero Section - Scientific Edition (Fallback) */}
                <section className="relative pt-12 md:pt-32 pb-8 px-6 max-w-6xl mx-auto z-10 w-full">
                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                    
                    {/* Left Column: Context & Benefit (PAS Framework) */}
                    <motion.div 
                        variants={staggerContainer}
                        initial="hidden"
                        animate="show"
                        className="w-full lg:col-span-6 flex flex-col items-center text-center lg:items-start lg:text-left order-1"
                    >
                        <motion.div variants={staggerItem} className="flex flex-col sm:flex-row items-center gap-3 mb-6">
                            <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/5 rounded-full border border-blue-500/10 backdrop-blur-md">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600/80 text-center">
                                    Powered by Cognitive AI v5.0
                                </span>
                            </div>
                            {globalStats && globalStats.promoRemaining > 0 && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 rounded-full border border-rose-500/20 backdrop-blur-md shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-shimmer relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-600">
                                        🎁 Статус Первопроходца (Скидка 20%)
                                    </span>
                                    <span className="text-[9px] font-bold text-rose-500/80 border-l border-rose-500/20 pl-2">
                                        Осталось мест: <span className="font-black text-rose-600">{globalStats.promoRemaining}</span>
                                    </span>
                                </div>
                            )}
                        </motion.div>

                        <motion.h1 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl xl:text-[5rem] font-black tracking-tight text-slate-950 mb-6 md:mb-8 leading-[1.05] text-balance max-w-2xl w-full">
                            {t('home.hero.title', 'Доминируйте')} <br className="hidden md:block" /> 
                            <span className="text-blue-600 italic font-serif inline-block">{t('home.hero.subtitle', 'в соцсетях')}</span>
                        </motion.h1>

                        <motion.div variants={staggerItem} className="w-full lg:hidden mb-10 order-2">
                             <HubInput 
                                className="shadow-2xl shadow-blue-500/10" 
                                initialValue={hubLink}
                                onAnalyze={handleHubAnalyze}
                            />
                        </motion.div>

                        <motion.p variants={staggerItem} className="text-lg md:text-xl text-slate-500 max-w-xl font-medium leading-relaxed mb-6 order-3">
                            {t('home.hero.description', 'Аналитическая платформа для тех, кто ценит время. Прозрачное SMM-продвижение с AI-фильтрацией качества.')}
                        </motion.p>

                        {/* Social Proof & Catalog Bridge - Unified Row */}
                        <motion.div variants={staggerItem} className="flex flex-wrap md:flex-nowrap items-center gap-x-8 gap-y-6 mb-10 order-4">
                            <div className="flex items-center gap-6 shrink-0">
                                <div className="flex -space-x-3">
                                    {[
                                        "from-blue-500 to-indigo-500",
                                        "from-emerald-400 to-teal-500",
                                        "from-rose-400 to-orange-400",
                                        "from-violet-500 to-fuchsia-500"
                                    ].map((grad, i) => (
                                        <div key={i} className={cn(
                                            "w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white bg-gradient-to-br shadow-xl shadow-blue-500/5 flex items-center justify-center text-[10px] font-black text-white",
                                            grad
                                        )}>
                                            {["JS", "MB", "AK", "DR"][i]}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1">
                                        <Star size={14} className="text-amber-400 fill-amber-400" />
                                        <span className="text-sm font-black text-slate-950">4.9/5</span>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">
                                        {t('home.hero.trust', `от ${globalStats?.formatted?.users || '45,000+'} брендов`)}
                                    </span>
                                </div>
                            </div>

                            <div className="hidden md:block w-px h-8 bg-slate-200/60 shrink-0" />

                            {/* Catalog Link - Now Inline */}
                            <Link 
                                href="/catalog" 
                                className="group flex items-center gap-4 text-slate-950 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors shrink-0"
                            >
                                <span className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                                </span>
                                <span>Полный каталог <br className="hidden md:block"/> AI-сервисов</span>
                            </Link>
                        </motion.div>
                    </motion.div>

                    {/* Right Column: Desktop Interactive AI Hub */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="lg:col-span-6 hidden lg:flex flex-col items-center justify-center relative order-2"
                    >
                        {/* Decorative background elements */}
                        <div className="absolute -z-10 w-[140%] h-[140%] bg-blue-500/5 rounded-full blur-[120px] -top-[20%] -left-[20%]" />
                        
                        <div className="w-full relative">
                            {/* Scientific Trust Buffer */}
                            <motion.div 
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 5, repeat: Infinity }}
                                className="absolute -top-16 left-1/2 -translate-x-1/2 glass px-8 py-3 rounded-full flex items-center gap-8 z-30 shadow-2xl shadow-blue-500/5 border-white/40"
                            >
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-slate-950 leading-none">{globalStats?.formatted?.orders || '1.2M+'}</span>
                                    <span className="text-[7px] font-bold uppercase text-slate-400 tracking-tighter">Orders</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-slate-950 leading-none">99.9%</span>
                                    <span className="text-[7px] font-bold uppercase text-slate-400 tracking-tighter">Uptime</span>
                                </div>
                                <div className="w-px h-6 bg-slate-200" />
                                <div className="flex flex-col items-center">
                                    <span className="text-lg font-black text-slate-950 leading-none">AI</span>
                                    <span className="text-[7px] font-bold uppercase text-slate-400 tracking-tighter">Safety</span>
                                </div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mb-4 lg:mb-6 flex items-center gap-3 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-full w-fit backdrop-blur-md"
                            >
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">
                                    Сейчас на сайте: {globalStats?.onlineUsers || '1,429'} • Последний заказ: {Math.floor(Math.random() * 4) + 1} мин. назад 
                                </span>
                            </motion.div>

                            <HubInput 
                                className="shadow-2xl shadow-blue-500/10" 
                                initialValue={hubLink}
                                onAnalyze={handleHubAnalyze}
                            />

                            {/* Benefit Grid (Magnetic Cards) - Compact 2+1 Layout */}
                            <div className="mt-8 w-full hidden md:grid grid-cols-2 gap-3">
                                {[
                                    { icon: <Clock size={16} className="text-amber-500" />, title: "Отложенный заказ", color: "amber", desc: "Планировщик старта", wide: false },
                                    { icon: <Timer size={16} className="text-blue-500" />, title: "Плавная накрутка", color: "blue", desc: "Умный Drip-feed", wide: false },
                                    { icon: <Headphones size={16} className="text-emerald-500" />, title: "Поддержка 24/7", color: "emerald", desc: "Наши эксперты всегда на связи и готовы помочь вам с любым вопросом.", wide: true }
                                ].map((card, i) => (
                                    <div key={i} className={cn(
                                        "glass p-4 rounded-[1.5rem] flex items-center gap-4 group hover:shadow-2xl transition-all cursor-pointer border-white/20 hover:border-blue-500/20",
                                        card.wide ? "col-span-2" : "col-span-1 flex-col xl:flex-row items-center xl:items-start text-center xl:text-left"
                                    )}>
                                        <div className={cn(
                                           "w-10 h-10 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-6 flex-shrink-0",
                                           card.color === 'amber' ? "bg-amber-500/10 shadow-[0_0_20px_rgba(245,158,11,0.05)]" : 
                                           card.color === 'blue' ? "bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.05)]" : 
                                           "bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.05)]"
                                        )}>
                                            {card.icon}
                                        </div>
                                        <div className="space-y-0.5 overflow-hidden">
                                            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight truncate">{card.title}</h3>
                                            <p className="text-[9px] text-slate-500 font-medium leading-tight opacity-60 line-clamp-2">{card.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            <BlockRenderer blocks={displayBlocks} position="top" />
                </div>
            )}

            {/* Academy Highlights Section */}
            <section className="py-24 px-6 max-w-6xl mx-auto w-full relative z-10">
                <div className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16">
                    <div className="max-w-2xl">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-4 block underline decoration-2 underline-offset-8">Academy / Knowledge Hub</span>
                        <h2 className="text-5xl md:text-6xl font-black text-slate-950 tracking-tighter uppercase italic leading-[0.9]">
                            Экспертные <br /> <span className="text-blue-600 not-italic">стратегии 2026</span>
                        </h2>
                    </div>
                    <Link href="/academy" className="px-8 py-4 bg-slate-50 border border-slate-200 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
                        Все статьи
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Glossary Card */}
                    <Link 
                        href="/glossary"
                        className="group block bg-blue-600 rounded-[2rem] p-8 hover:shadow-2xl transition-all h-full relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl -mr-16 -mt-16" />
                        <div className="relative z-10 h-full flex flex-col">
                            <span className="px-2 py-1 bg-white/10 rounded-full text-[8px] font-black uppercase tracking-widest text-white/70 mb-4 inline-block">
                                Dictionary
                            </span>
                            <h3 className="text-xl font-black text-white mb-4 leading-tight uppercase italic">
                                Глоссарий <br /> для новичков
                            </h3>
                            <p className="text-xs text-white/70 font-medium mb-6 line-clamp-2">
                                Разбираем сленг, типы ботов и нюансы накрутки простыми словами.
                            </p>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white mt-auto">
                                Открыть словарь <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {ACADEMY_ARTICLES.slice(0, 3).map((article) => (
                        <Link 
                            key={article.slug} 
                            href={`/academy/${article.slug}`}
                            className="group block bg-white rounded-[2rem] border border-slate-100 p-8 hover:border-blue-500/20 hover:shadow-2xl transition-all h-full"
                        >
                            <span className="px-2 py-1 bg-slate-50 border border-slate-100 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-400 mb-4 inline-block">
                                {article.category}
                            </span>
                            <h3 className="text-lg font-black text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight uppercase">
                                {article.title}
                            </h3>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 mt-auto">
                                Подробнее <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* Scientific Social Proof */}
            <section className="w-full py-16 bg-white/30 backdrop-blur-md relative overflow-hidden border-y border-slate-100">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="flex flex-col items-center text-center mb-20">
                        <h2 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tight leading-none mb-4">
                            Доказанная <span className="text-blue-600 italic">эффективность</span>
                        </h2>
                        <button 
                            onClick={() => setIsReviewModalOpen(true)}
                            className="mt-8 px-10 py-5 bg-white border border-slate-200 text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-xl active:scale-95"
                        >
                            Добавить мой отзыв
                        </button>
                    </div>
                    <ReviewsCarousel reviews={initialReviews} />
                </div>
            </section>

            <LeaveReviewModal 
                isOpen={isReviewModalOpen} 
                onClose={() => setIsReviewModalOpen(false)} 
                projectId={projectId ?? null}
            />

            <BlockRenderer blocks={displayBlocks} position="bottom" />
            {!hasStructuralBlocks && <BlockRenderer blocks={displayBlocks} />}

            {/* Proactive Floating Instant Order Launcher (Low Z, non-intrusive) */}
            <div className={cn(
                isOrderExpanded 
                    ? "fixed inset-0 z-[9999] pointer-events-none" 
                    : "fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 z-[50] pointer-events-none transition-all duration-500"
            )}>
                <div className="pointer-events-auto">
                    <InstantOrder 
                        initialLink={hubLink} 
                        initialServiceId={serviceId ?? undefined}
                        initialPlatform={hubPlatform ?? undefined} 
                        isExpanded={isOrderExpanded}
                        onExpandChange={setIsOrderExpanded}
                        globalStats={globalStats}
                    />
                </div>
            </div>
        </main>
    );
}
