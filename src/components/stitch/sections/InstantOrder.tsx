"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Link2, Zap, Loader2, Info,
    CheckCircle2, Flame, ShieldCheck, TrendingUp, Sparkles, Clock3, Users, X, Mail
} from "lucide-react";
import { BrandIcon } from "../ui/BrandIcon";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

import { formatAmount } from "@/utils/formatter";
import { getInstantServices } from "@/app/_actions/services/getInstantServices";
import { analyzeLinkAction } from "@/app/_actions/services/analyzeLinkAction";
import { validateLinkFrontendAction } from "@/app/_actions/services/validateLinkFrontendAction";
import { mapObjectTypeToTargetType } from "@/utils/link-analyzer";
import { translateCategory, translatePlatform } from "@/utils/translations";
import { getWebSmartHint } from "@/utils/tips";
import { toast } from "sonner";

interface Service {
    id: string;
    name: string;
    description: string;
    pricePer1000: number;
    pricePerUnit: number;
    category: string;
    platform: string;
    isHot?: boolean;
    isCheap?: boolean;
    isBest?: boolean;
    quality?: "HIGH" | "STD";
    minQty?: number;
    maxQty?: number;
    requirements?: string | null;
    targetType?: string;
    isPrivate?: boolean;
}

export const InstantOrder = () => {
    const [link, setLink] = useState("");
    const [platform, setPlatform] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);
    const [lastAnalyzedLink, setLastAnalyzedLink] = useState<string>("");
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [quantity, setQuantity] = useState<number>(100);
    const [isDripFeed, setIsDripFeed] = useState(false);
    const [runs, setRuns] = useState(2);
    const [interval, setInterval] = useState(60);
    const [email, setEmail] = useState("");
    const [isScheduled, setIsScheduled] = useState(false);
    const [scheduleTime, setScheduleTime] = useState("");
    const [repeatInterval, setRepeatInterval] = useState<number | "">("");
    const [consent, setConsent] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [checkoutWarning, setCheckoutWarning] = useState<string | null>(null);
    const { data: session } = useSession();

    // Secondary filter for invite links
    const [privacyFilter, setPrivacyFilter] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');

    const platformIconComponents: Record<string, React.ReactNode> = {
        TELEGRAM: <BrandIcon name="telegram" size={32} colorMode="original" />,
        INSTAGRAM: <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-lg shadow-black/20 text-xs font-black text-slate-400">IG</div>,
        TIKTOK: <BrandIcon name="tiktok" size={32} colorMode="original" />,
        VK: <BrandIcon name="vk" size={32} colorMode="original" />,
        YOUTUBE: <BrandIcon name="youtube" size={32} colorMode="original" />,
        LIKEE: <BrandIcon name="likee" size={32} colorMode="original" />,
        TWITCH: <BrandIcon name="twitch" size={32} colorMode="original" />,
        OK: <BrandIcon name="ok" size={32} colorMode="original" />,
        FACEBOOK: <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-lg shadow-black/20 text-xs font-black text-slate-400">FB</div>,
        THREADS: <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-lg shadow-black/20 text-xs font-black text-slate-400">TH</div>,
        DISCORD: <BrandIcon name="discord" size={32} colorMode="original" />,
        TWITTER: <BrandIcon name="twitter" size={32} colorMode="original" />,
    };

    const objectTypeIconComponents: Record<string, React.ReactNode> = {
        TG_BOT: <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-lg shadow-black/20"><Zap size={16} className="text-amber-400" /></div>,
        TG_STORY: <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center shadow-lg shadow-black/20"><Flame size={16} className="text-orange-500" /></div>,
    };

    useEffect(() => {
        async function load() {
            try {
                const data = await getInstantServices();
                setServices(data as any);
            } catch (e) {
                console.error("Failed to load services", e);
            }
        }
        load();
    }, []);

    // Auto-select service from URL parameter (e.g. redirected from Catalog)
    useEffect(() => {
        if (services.length > 0 && typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const serviceId = params.get('serviceId');

            if (serviceId) {
                const serviceToSelect = services.find(s => s.id === serviceId);
                if (serviceToSelect) {
                    setPlatform(serviceToSelect.platform);
                    setSelectedCategory(serviceToSelect.category);
                    setSelectedService(serviceToSelect);

                    // Remove parameter from URL without page reload
                    const url = new URL(window.location.href);
                    url.searchParams.delete('serviceId');
                    window.history.replaceState({}, '', url.toString());

                    // Set a dummy link so validation doesn't immediately fail if they want to order
                    if (!link) {
                        setLink(''); // Let user type it out, but modal is open
                    }
                }
            }
        }
    }, [services]);

    useEffect(() => {
        if (link === lastAnalyzedLink) return;

        const timer = setTimeout(async () => {
            if (link.length > 5) {
                setIsAnalyzing(true);
                const result = await analyzeLinkAction(link);
                setLastAnalyzedLink(link);

                if (result.success && result.data) {
                    const detected = result.data.platform;
                    setPlatform(detected);
                    setAnalysisResult(result.data);

                    // Smart category selection: if current category is not in possible categories, switch
                    const availableCats = Array.from(new Set(services.filter(s => s.platform === detected).map(s => s.category)));

                    if (availableCats.length > 0) {
                        setSelectedCategory(prevSelected => {
                            if (availableCats.length === 1) return availableCats[0];

                            const firstPossible = result.data.possibleCategories[0];
                            // If we already have a selected category and it's valid for this platform, keep it (unless we want to force best match).
                            // A good UX is: if the user pastes a link to a POST, we switch to LIKES.
                            // If they change the link slightly, we don't jump around. 
                            if (firstPossible && availableCats.includes(firstPossible)) {
                                return firstPossible;
                            } else if (!prevSelected || !availableCats.includes(prevSelected)) {
                                return availableCats[0];
                            }
                            return prevSelected;
                        });
                    } else {
                        setSelectedCategory(null);
                    }
                }
                setIsAnalyzing(false);
            } else if (!selectedService) {
                setPlatform(null);
                setSelectedCategory(null);
                setAnalysisResult(null);
                setLastAnalyzedLink("");
            }
            // Reset privacy filter when link changes
            setPrivacyFilter('PUBLIC');
        }, 500);

        return () => clearTimeout(timer);
    }, [link, services, lastAnalyzedLink, selectedService]);

    // Validate link dynamically for warning in checkout
    useEffect(() => {
        if (selectedService && link.length > 5) {
            const delay = setTimeout(async () => {
                const res = await validateLinkFrontendAction(link, selectedService.id);
                if (res.success && res.validation?.isWarning) {
                    setCheckoutWarning(res.validation.warning || null);
                } else {
                    setCheckoutWarning(null);
                }
            }, 500);
            return () => clearTimeout(delay);
        } else {
            setCheckoutWarning(null);
        }
    }, [selectedService, link]);

    const availableCategories = useMemo(() => {
        if (!platform) return [];
        let filteredServices = services.filter(s => s.platform === platform);

        // 0. Фильтрация приватности (Phase 4, обновлено Phase 7)
        // Если ссылка НЕ приватная (публичная) -> скрываем приватные услуги.
        // Если ссылка ПРИВАТНАЯ (инвайт) -> показываем ВСЕ услуги (и публичные, и приватные), оставляя выбор пользователю.
        if (!analysisResult?.isPrivate) {
            filteredServices = filteredServices.filter(s => !s.isPrivate);
        }

        // 1. Техническая фильтрация (Link Type -> targetType)
        if (analysisResult?.objectType) {
            const detectedTargetType = mapObjectTypeToTargetType(analysisResult.objectType);
            filteredServices = filteredServices.filter(s => !s.targetType || s.targetType === detectedTargetType || s.targetType === analysisResult.objectType || s.targetType === 'ALL');
        }

        // 2. Бизнес-фильтрация (Relevance -> possibleCategories)
        if (analysisResult?.possibleCategories && analysisResult.possibleCategories.length > 0) {
            filteredServices = filteredServices.filter(s => analysisResult.possibleCategories.includes(s.category as any));
        }

        const cats = Array.from(new Set(filteredServices.map(s => s.category)));
        return cats;
    }, [platform, services, analysisResult]);

    const availableServicesByTarget = useMemo(() => {
        if (!platform) return services;
        let filteredServices = services.filter(s => s.platform === platform);

        // 0. Фильтрация приватности (Phase 4, обновлено Phase 7)
        if (!analysisResult?.isPrivate) {
            filteredServices = filteredServices.filter(s => !s.isPrivate);
        }

        // Используем то же самое пересечение для списка услуг
        if (analysisResult?.objectType) {
            const detectedTargetType = mapObjectTypeToTargetType(analysisResult.objectType);
            filteredServices = filteredServices.filter(s => !s.targetType || s.targetType === detectedTargetType || s.targetType === analysisResult.objectType || s.targetType === 'ALL');
        }

        if (analysisResult?.possibleCategories && analysisResult.possibleCategories.length > 0) {
            filteredServices = filteredServices.filter(s => analysisResult.possibleCategories.includes(s.category as any));
        }

        return filteredServices;
    }, [platform, services, analysisResult]);

    const currentServices = useMemo(() => {
        let filtered = availableServicesByTarget.filter(s => s.category === selectedCategory);

        // Apply secondary Privacy Filter for Invite Links
        if (analysisResult?.isPrivate) {
            filtered = filtered.filter(s => s.isPrivate === (privacyFilter === 'PRIVATE'));
        }

        return filtered;
    }, [availableServicesByTarget, selectedCategory, analysisResult?.isPrivate, privacyFilter]);

    const categoryWarning = useMemo(() => {
        if (!analysisResult || !selectedCategory) return null;

        // 1. Предупреждение о приватности
        if (analysisResult.isPrivate) {
            return `Внимание: Ссылка ведет на приватный канал/группу. Убедитесь, что у нашего бота есть доступ или используйте публичную ссылку для мгновенного старта.`;
        }

        // 2. Специфические законы SMM
        if (analysisResult.objectType === 'TG_BOT' && !['referrals', 'other'].includes(selectedCategory.toLowerCase())) {
            return `Для ссылок на ботов подходят только услуги из категорий «Рефералы» или «Другое».`;
        }

        if (analysisResult.objectType === 'TG_STORY' && selectedCategory.toLowerCase() !== 'stories') {
            return `Для ссылок на истории подходят только услуги из категории «Истории».`;
        }

        // 3. Heuristic / Fallback
        if (!analysisResult.possibleCategories?.includes(selectedCategory as any)) {
            if (analysisResult.possibleCategories && analysisResult.possibleCategories.length > 0 && availableCategories.includes(analysisResult.possibleCategories[0])) {
                return `Внимание: Система рекомендует использовать категорию: «${translateCategory(analysisResult.possibleCategories[0])}» для этого типа ссылки.`;
            } else {
                return `Внимание: Выбранная категория может быть несовместима с типом вставленной ссылки.`;
            }
        }

        return null;
    }, [analysisResult, selectedCategory, availableCategories]);

    const handleOrder = async () => {
        if (!selectedService || !link) return;
        if (!session && !email) {
            toast.error("Пожалуйста, введите ваш Email для автоматического создания аккаунта");
            return;
        }
        if (!consent) {
            toast.error("Пожалуйста, подтвердите согласие на обработку персональных данных");
            return;
        }
        let finalLink = link.trim();
        // Авто-дополнение ?boost для Telegram Бустов
        if (selectedService.platform === 'TELEGRAM' &&
            (selectedService.name.toLowerCase().includes('буст') || selectedService.name.toLowerCase().includes('boost') || selectedService.category.toLowerCase().includes('boost') || selectedService.category.toLowerCase().includes('буст'))) {
            if (!finalLink.toLowerCase().includes('boost') && !finalLink.toLowerCase().includes('?c=')) {
                finalLink = finalLink.includes('?') ? `${finalLink}&boost` : `${finalLink}?boost`;
            }
        }

        setIsSubmitting(true);
        try {
            const res = await fetch("/api/client/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    serviceId: selectedService.id,
                    link: finalLink,
                    quantity,
                    isDripFeed,
                    runs: isDripFeed ? runs : 1,
                    interval: isDripFeed ? interval : 0,
                    email: session ? undefined : email,
                    scheduleTime: isScheduled ? scheduleTime : undefined,
                    repeatInterval: (isScheduled && repeatInterval) ? repeatInterval : undefined
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Заказ успешно создан!");
                if (data.requiresPayment && data.paymentUrl) {
                    window.location.href = data.paymentUrl;
                } else {
                    window.location.href = "/dashboard/orders";
                }
            } else {
                toast.error(data.error || "Ошибка при создании заказа");
            }
        } catch (e) {
            console.error("Order error", e);
            toast.error("Критическая ошибка при оформлении заказа");
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPrice = useMemo(() => {
        if (!selectedService) return 0;
        const base = (selectedService.pricePer1000 * quantity) / 1000;
        return Number((base * (isDripFeed ? runs : 1)).toFixed(2));
    }, [selectedService, quantity, isDripFeed, runs]);

    return (
        <div className={cn("w-full max-w-4xl mx-auto flex flex-col transition-all duration-500", platform ? "min-h-[560px]" : "min-h-0")}>
            {/* 1. Ultra-Wide Search Block */}
            <div className="relative group shrink-0 mb-8 px-4 flex flex-col items-center">
                <div className="relative w-full max-w-4xl">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center justify-center z-10 w-8">
                        {analysisResult?.objectType && objectTypeIconComponents[analysisResult.objectType] ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                {objectTypeIconComponents[analysisResult.objectType]}
                            </motion.div>
                        ) : platform ? (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                {platformIconComponents[platform] || <Link2 className="text-slate-400 w-6 h-6" />}
                            </motion.div>
                        ) : (
                            <Sparkles size={24} className="text-blue-500/30 animate-pulse" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        placeholder="Вставьте ссылку и начните рост..."
                        className="w-full h-16 pl-16 pr-16 bg-blue-100 border-2 border-blue-200 rounded-[2rem] text-lg font-bold text-blue-950 placeholder:text-blue-500/80 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all shadow-[0_0_40px_rgba(37,99,235,0.15)] relative"
                    />
                    {isAnalyzing && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <Loader2 className="animate-spin text-blue-500 w-5 h-5" />
                        </div>
                    )}
                    {platform && !isAnalyzing && (
                        <div className="absolute right-6 top-1/2 -translate-y-1/2">
                            <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {platform && !isAnalyzing && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className={cn(
                                "mt-4 px-6 py-2.5 rounded-full flex items-center gap-3 shadow-lg transition-colors border",
                                availableCategories.length > 0
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                    : "bg-amber-50 border-amber-100 text-amber-700"
                            )}
                        >
                            <div className={cn("w-2.5 h-2.5 rounded-full animate-pulse", availableCategories.length > 0 ? "bg-emerald-500" : "bg-amber-500")} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                                {availableCategories.length > 0
                                    ? `Платформа ${translatePlatform(platform)} распознана. Выберите тариф:`
                                    : `Платформа ${translatePlatform(platform)} распознана, но услуги временно недоступны.`
                                }
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
                {platform ? (
                    <motion.div
                        key="interface"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="flex-1 flex flex-col min-h-0"
                    >
                        {/* 2. Bento-Style Categories Navigation */}
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 px-4 shrink-0 mb-6">
                            {availableCategories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border-2 shrink-0",
                                        selectedCategory === cat
                                            ? "bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105"
                                            : "bg-white border-slate-100 text-slate-400 hover:text-slate-600 hover:border-slate-200"
                                    )}
                                >
                                    {translateCategory(cat)}
                                </button>
                            ))}

                            <button
                                onClick={() => window.location.href = `/catalog?link=${encodeURIComponent(link)}`}
                                className="px-6 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 border-2 shrink-0 bg-slate-50 border-slate-200 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 flex items-center gap-2"
                            >
                                <Info size={14} className="opacity-70" />
                                Не нашли услугу?
                            </button>
                        </div>

                        {/* Smart Analyzer Warning */}
                        <AnimatePresence>
                            {categoryWarning && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    className="px-4 mb-6 z-50 relative"
                                >
                                    <div className="bg-orange-50/80 border border-orange-200/50 rounded-[1.5rem] p-4 flex items-start flex-col gap-4 shadow-sm relative z-50 overflow-visible">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
                                        <div className="flex items-center gap-3 w-full">
                                            <Flame size={20} className="text-orange-500 shrink-0 mt-0.5" />
                                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-orange-700">ИИ АНАЛИЗАТОР: РИСК ОШИБКИ</h4>
                                        </div>
                                        <div className="space-y-1 relative z-10 w-full mt-2">
                                            <p className="text-xs font-medium text-orange-900/80 leading-relaxed italic pr-1">{categoryWarning}&nbsp;</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* 3. Next-Gen Grid System */}
                        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pt-1 pb-12">
                            {/* Secondary Privacy Toggle for Invite Links */}
                            <AnimatePresence>
                                {analysisResult?.isPrivate && selectedCategory && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0, y: -10 }}
                                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -10 }}
                                        className="mb-6"
                                    >
                                        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-sm mx-auto shadow-inner">
                                            <button
                                                onClick={() => setPrivacyFilter('PUBLIC')}
                                                className={cn(
                                                    "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                                    privacyFilter === 'PUBLIC'
                                                        ? "bg-white text-blue-600 shadow-md scale-100"
                                                        : "text-slate-400 hover:text-slate-600 scale-95"
                                                )}
                                            >
                                                Открытый канал
                                            </button>
                                            <button
                                                onClick={() => setPrivacyFilter('PRIVATE')}
                                                className={cn(
                                                    "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
                                                    privacyFilter === 'PRIVATE'
                                                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 scale-100"
                                                        : "text-slate-400 hover:text-slate-600 scale-95"
                                                )}
                                            >
                                                Приватный канал
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {currentServices.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    <AnimatePresence>
                                        {currentServices.map((service, idx) => (
                                            <motion.div
                                                key={service.id}
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                whileHover={{ y: -8, scale: 1.02 }}
                                                onClick={() => {
                                                    setSelectedService(service);
                                                    setQuantity(100); // Reset to default
                                                    setIsDripFeed(false);
                                                }}
                                                className={cn(
                                                    "relative group border rounded-[2.5rem] p-6 transition-all flex flex-col justify-between overflow-hidden min-h-[340px] cursor-pointer",
                                                    service.isHot
                                                        ? "bg-gradient-to-br from-orange-500 via-rose-600 to-purple-700 border-white/20 shadow-[0_20px_50px_-10px_rgba(244,63,94,0.3)]"
                                                        : "bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 border-white/10 shadow-[0_20px_50px_-10px_rgba(30,58,138,0.3)]"
                                                )}
                                            >
                                                {/* Animated Holographic Glow */}
                                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                                                    <div className="absolute -inset-[100%] animate-[spin_8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent,rgba(255,255,255,0.1),transparent,rgba(255,255,255,0.1),transparent)]" />
                                                </div>

                                                {/* Card Background Patterns */}
                                                <div className="absolute top-0 right-0 p-8 opacity-5">
                                                    <BrandIcon name={platform.toLowerCase() as any} size={150} />
                                                </div>

                                                <div className="flex-1 flex flex-col z-10 relative">
                                                    <div className="flex flex-col gap-3 mb-4">
                                                        <div className="flex items-start justify-between gap-2">
                                                            {service.isHot ? (
                                                                <div className="flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full px-3 py-1 gap-1 shrink-0 ring-1 ring-white/30">
                                                                    <Flame size={12} className="text-white fill-white animate-pulse" />
                                                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Хит продаж</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 bg-white/5 backdrop-blur-sm px-2 py-1 rounded-full border border-white/10">
                                                                    {service.isBest && <ShieldCheck size={12} className="text-emerald-400" />}
                                                                    {service.isCheap && <TrendingUp size={12} className="text-blue-400" />}
                                                                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-tighter">Verified</span>
                                                                </div>
                                                            )}
                                                            <div className={cn("px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest shrink-0 shadow-sm", service.isHot ? "bg-white text-orange-600" : "bg-blue-500 text-white")}>
                                                                {service.quality === "HIGH" ? "Ultra-HD" : "Stable"}
                                                            </div>
                                                        </div>
                                                        <div className="flex w-full">
                                                            <div className={cn("px-2 py-0.5 rounded border text-[8px] font-bold tracking-widest font-mono shrink-0", service.isHot ? "border-white/30 text-white/60" : "border-white/10 text-white/30")}>
                                                                #SMM-{service.id}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <h4 className="text-[18px] font-extrabold text-white leading-[1.3] mb-4 group-hover:text-blue-200 transition-colors drop-shadow-md">
                                                        {service.name}
                                                    </h4>

                                                    <div className="hidden md:block">
                                                        <p className={cn("text-[11px] font-medium leading-relaxed border-t pt-4 line-clamp-3 italic pr-1", service.isHot ? "text-orange-100/70 border-white/20" : "text-white/40 border-white/10")}>
                                                            {service.description || "Индивидуальный тариф с повышенным приоритетом выполнения заказа."}&nbsp;
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-end justify-between mt-8 z-10 relative">
                                                    <div className="min-w-0 flex-1 pr-2 group/price">
                                                        <span className={cn("block text-[9px] font-bold uppercase tracking-widest mb-1.5 opacity-50", service.isHot ? "text-orange-200" : "text-blue-300")}>Цена за 1</span>
                                                        <div className="flex items-baseline gap-1 overflow-visible">
                                                            <span className="text-2xl 2xl:text-3xl font-extrabold text-white tracking-tight tabular-nums drop-shadow-xl inline-block">
                                                                {formatAmount(service.pricePerUnit)}
                                                            </span>
                                                            <span className="text-xs font-bold text-white/40 shrink-0">₽</span>
                                                        </div>
                                                    </div>
                                                    <div className={cn("w-14 h-14 shrink-0 rounded-full flex items-center justify-center transition-all border-4 shadow-2xl overflow-hidden group-hover:rotate-12", service.isHot ? "bg-white text-rose-600 border-white/20 group-hover:scale-110" : "bg-blue-500 text-white border-white/10 group-hover:scale-110")}>
                                                        <Zap size={24} className={cn(service.isHot ? "fill-rose-500" : "fill-white")} />
                                                    </div>
                                                </div>

                                                {/* Bottom Gloss Overlay */}
                                                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-20 text-center px-6 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200"
                                >
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-300">
                                        <Info size={32} />
                                    </div>
                                    <h3 className="text-lg font-extrabold text-slate-400 uppercase tracking-widest mb-2">Категория пуста</h3>
                                    <p className="text-xs font-medium text-slate-400 max-w-xs leading-relaxed">
                                        Мы еще не добавили услуги в этот раздел для {translatePlatform(platform)}. Пожалуйста, выберите другую категорию.
                                    </p>
                                </motion.div>
                            )}
                        </div>

                        {/* 4. Glass-Footer Bar */}
                        <div className="mt-auto px-8 py-6 bg-white/40 backdrop-blur-md border-t border-slate-50 flex items-center justify-between rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <Clock3 size={14} className="text-emerald-500" />
                                    <span className="text-[10px] font-bold text-slate-900 uppercase tracking-widest">Старт через 1-5 мин.</span>
                                </div>
                                <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">
                                    Сервис официально верифицирован Smmplan
                                </div>
                            </div>
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-xl">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={`https://i.pravatar.cc/100?u=v4${i}`} className="w-full h-full object-cover grayscale opacity-70" alt="avatar" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="pt-16 pb-8 text-center max-w-2xl mx-auto px-6"
                    >
                        <div className="flex flex-col gap-6 md:gap-10 mb-16 items-center">
                            {/* Row 1 */}
                            <div className="flex justify-center gap-6 md:gap-10 opacity-70 hover:opacity-100 transition-all duration-700">
                                {["TELEGRAM", "INSTAGRAM", "TIKTOK", "VK", "YOUTUBE", "LIKEE"].map((p) => (
                                    <motion.div
                                        key={p}
                                        whileHover={{ scale: 1.4, rotate: 5 }}
                                        className="transition-all cursor-crosshair"
                                    >
                                        {platformIconComponents[p]}
                                    </motion.div>
                                ))}
                            </div>
                            {/* Row 2 */}
                            <div className="flex justify-center gap-6 md:gap-10 opacity-70 hover:opacity-100 transition-all duration-700">
                                {["TWITCH", "OK", "FACEBOOK", "THREADS", "DISCORD", "TWITTER"].map((p) => (
                                    <motion.div
                                        key={p}
                                        whileHover={{ scale: 1.4, rotate: -5 }}
                                        className="transition-all cursor-crosshair"
                                    >
                                        {platformIconComponents[p]}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 uppercase tracking-[0.1em] md:tracking-[0.2em] mb-4 leading-tight">
                            Мгновенный <span className="text-blue-600">рост</span>
                        </h2>
                        <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">
                            Вставьте ссылку, чтобы ИИ подобрал <br className="hidden md:block" /> лучшую стратегию продвижения
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Checkout Interface (Sheet/Modal) */}
            {typeof document !== 'undefined' ? createPortal(
                <AnimatePresence>
                    {selectedService && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedService(null)}
                                className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100]"
                            />
                            <motion.div
                                initial={{ y: "100%", opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0 }}
                                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                className="fixed pb-safe bottom-0 left-0 right-0 md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:bottom-auto md:w-full md:max-w-lg bg-white rounded-t-[2rem] md:rounded-[2rem] z-[101] px-5 md:px-6 pt-3 pb-5 shadow-[0_-20px_100px_rgba(37,99,235,0.2)] md:shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
                            >
                                <div className="w-8 h-1 bg-slate-100 rounded-full mx-auto mb-3 md:hidden shrink-0" />

                                <div className="flex items-start justify-between mb-3 shrink-0">
                                    <div className="space-y-0.5">
                                        <h3 className="text-xl md:text-xl font-extrabold text-slate-900 leading-tight">
                                            Оформление <span className="text-blue-600">заказа</span>
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-bold uppercase tracking-widest text-slate-500 line-clamp-1 max-w-[200px]">
                                                {selectedService.name}
                                            </span>
                                            <span className="px-2 py-0.5 bg-blue-50 rounded text-[8px] font-bold uppercase tracking-widest text-blue-600 shrink-0">
                                                ID: {selectedService.id}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedService(null)}
                                        className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors shrink-0"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>

                                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-4 pr-1 pb-2">
                                    {/* Service Info Block */}
                                    <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                                        <div className="space-y-1.5">
                                            <h4 className="text-[9px] font-bold uppercase text-slate-400 tracking-widest flex items-center gap-1.5">
                                                <Info size={12} className="text-blue-500" /> Описание услуги
                                            </h4>
                                            <p className="text-[11px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                                                {selectedService.description || "Стандартное описание недоступно."}
                                            </p>
                                        </div>

                                        {selectedService.requirements && (
                                            <div className="space-y-1.5 pt-3 border-t border-slate-200">
                                                <h4 className="text-[9px] font-bold uppercase text-orange-500 tracking-widest flex items-center gap-1.5">
                                                    <Flame size={12} className="text-orange-500" /> Обязательные требования
                                                </h4>
                                                <p className="text-[11px] font-bold text-slate-800 leading-relaxed whitespace-pre-wrap">
                                                    {selectedService.requirements}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Link Input Block */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Ссылка</label>
                                        </div>
                                        <div className="relative group">
                                            <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 group-focus-within:scale-110 transition-transform" />
                                            <input
                                                type="text"
                                                value={link}
                                                onChange={(e) => setLink(e.target.value)}
                                                placeholder="https://"
                                                className="w-full h-10 pl-10 pr-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-1 text-slate-400">
                                            <Info size={10} className="shrink-0" />
                                            <p className="text-[8px] font-bold uppercase tracking-wider">{getWebSmartHint(selectedService.platform)}</p>
                                        </div>
                                    </div>

                                    {/* Quantity Block */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Количество {isDripFeed ? "(за 1 запуск)" : ""}</label>
                                            <span className="text-[9px] font-bold text-blue-600">Штук</span>
                                        </div>
                                        <div className="relative group">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 group-focus-within:scale-110 transition-transform" />
                                            <input
                                                type="number"
                                                value={quantity}
                                                onChange={(e) => setQuantity(Number(e.target.value))}
                                                className="w-full h-10 pl-10 pr-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-base font-black text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Guest Email Input */}
                                    {!session && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400">ВАШ EMAIL (ДЛЯ ДОСТУПА)</label>
                                            </div>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 w-4 h-4 group-focus-within:scale-110 transition-transform" />
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="example@mail.com"
                                                    className="w-full h-10 pl-10 pr-3 bg-slate-50 border-2 border-slate-100 rounded-xl text-sm font-black text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Drip Feed Toggle */}
                                    <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0", isDripFeed ? "bg-blue-600 text-white" : "bg-white text-blue-600 border border-blue-100")}>
                                                    <Clock3 size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-bold text-slate-900 uppercase tracking-tight">Постепенная подача</h4>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Drip-feed</p>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => setIsDripFeed(!isDripFeed)}
                                                className={cn("w-9 h-5 rounded-full relative cursor-pointer transition-all p-0.5 shrink-0", isDripFeed ? "bg-blue-600" : "bg-slate-200")}
                                            >
                                                <motion.div
                                                    animate={{ x: isDripFeed ? 16 : 0 }}
                                                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {isDripFeed && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-100"
                                            >
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-blue-700 ml-1">Запусков</label>
                                                    <input
                                                        type="number"
                                                        value={runs}
                                                        onChange={(e) => setRuns(Number(e.target.value))}
                                                        className="w-full h-8 px-2 bg-white border border-blue-200 rounded text-sm font-black text-blue-900 outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-black uppercase text-blue-700 ml-1">Интервал (мин)</label>
                                                    <input
                                                        type="number"
                                                        value={interval}
                                                        onChange={(e) => setInterval(Number(e.target.value))}
                                                        className="w-full h-8 px-2 bg-white border border-blue-200 rounded text-sm font-black text-blue-900 outline-none focus:border-blue-500"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Scheduled Order Toggle */}
                                    <div className="p-3 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0", isScheduled ? "bg-amber-500 text-white" : "bg-white text-amber-500 border border-amber-100")}>
                                                    <Clock3 size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Отложенный запуск</h4>
                                                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Schedule</p>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => setIsScheduled(!isScheduled)}
                                                className={cn("w-9 h-5 rounded-full relative cursor-pointer transition-all p-0.5 shrink-0", isScheduled ? "bg-amber-500" : "bg-slate-200")}
                                            >
                                                <motion.div
                                                    animate={{ x: isScheduled ? 16 : 0 }}
                                                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        {isScheduled && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="grid grid-cols-1 gap-4 pt-4 border-t border-amber-100"
                                            >
                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black uppercase text-amber-700 ml-1">Дата и время</label>
                                                    <input
                                                        type="datetime-local"
                                                        value={scheduleTime}
                                                        onChange={(e) => setScheduleTime(e.target.value)}
                                                        required={isScheduled}
                                                        className="w-full h-10 px-3 bg-white border border-amber-200 rounded-xl text-sm font-black text-slate-950 outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[8px] font-black uppercase text-amber-700 ml-1">Повтор (каждые N мин)</label>
                                                    <input
                                                        type="number"
                                                        placeholder="Оставьте пустым для разового"
                                                        value={repeatInterval}
                                                        onChange={(e) => setRepeatInterval(e.target.value === "" ? "" : parseInt(e.target.value))}
                                                        className="w-full h-10 px-3 bg-white border border-amber-200 rounded-xl text-sm font-black text-slate-950 outline-none focus:border-amber-500"
                                                    />
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Price Summary */}
                                    <div className="flex items-center justify-between px-1 pt-1">
                                        <div className="space-y-0.5">
                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">Общая сумма</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-2xl md:text-3xl font-black text-slate-950 tracking-tighter tabular-nums">
                                                    {formatAmount(totalPrice)}
                                                </span>
                                                <span className="text-sm font-black text-slate-300 italic pr-1">₽&nbsp;</span>
                                            </div>
                                        </div>
                                        <div className="text-right space-y-0.5">
                                            <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                {isDripFeed ? `${quantity * runs} ед.` : `${quantity} ед.`}
                                            </span>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[9px] font-bold text-emerald-500 flex items-center gap-1">
                                                    <ShieldCheck size={10} /> Качество Гарантировано
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {checkoutWarning && (
                                        <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-3 flex items-start flex-col gap-2 mt-2 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8 blur-xl pointer-events-none" />
                                            <div className="flex items-center gap-2 relative z-10 w-full mb-1">
                                                <Flame size={14} className="text-amber-500 shrink-0" />
                                                <h4 className="text-[9px] font-black uppercase tracking-widest text-amber-700">Обратите внимание</h4>
                                            </div>
                                            <p className="text-[10px] font-bold text-amber-900/80 leading-relaxed italic pr-1 relative z-10">
                                                {checkoutWarning}
                                            </p>
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2.5 px-3 py-2 bg-slate-50/50 rounded-xl border border-slate-100 mt-2">
                                        <input
                                            type="checkbox"
                                            id="instant_consent"
                                            checked={consent}
                                            onChange={(e) => setConsent(e.target.checked)}
                                            className="mt-1 shrink-0 w-3.5 h-3.5 rounded border-slate-200 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                                        />
                                        <label htmlFor="instant_consent" className="text-[9px] text-slate-500 font-medium leading-relaxed">
                                            Я даю согласие на обработку моих персональных данных в соответствии с{' '}
                                            <a href="/docs/policy" target="_blank" className="text-blue-600 hover:underline">Политикой конфиденциальности</a>
                                        </label>
                                    </div>
                                </div>

                                <button
                                    onClick={handleOrder}
                                    disabled={isSubmitting || quantity < Number(selectedService.minQty || 10) || !consent}
                                    className="w-full h-12 shrink-0 mt-2 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:scale-100 group overflow-hidden relative"
                                >
                                    <div className="absolute inset-0 bg-blue-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    <div className="relative z-10 flex items-center gap-2">
                                        <span className="text-sm font-black uppercase tracking-widest">
                                            {isSubmitting ? "Обработка..." : "Подтвердить заказ"}
                                        </span>
                                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} className="fill-white" />}
                                    </div>
                                </button>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>, document.body) : null}
        </div>
    );
};
