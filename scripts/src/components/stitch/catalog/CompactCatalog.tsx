"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Info, Layout, ArrowRight, Filter, ChevronRight, Star, Flame, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react';
import {
    FaTwitch, FaTwitter,
    FaDiscord, FaReddit, FaWhatsapp, FaSpotify, FaOdnoklassniki, FaSoundcloud, FaLinkedin, FaPinterest, FaSnapchatGhost
} from "react-icons/fa";
import { cn } from "@/lib/utils";
import { BrandIcon } from '../ui/BrandIcon';
import { SerializedServiceV2 } from "@/types/catalog";
import { translatePlatform } from "@/utils/translations";

import { useRouter, useSearchParams } from 'next/navigation';

interface CompactCatalogProps {
    groupedServices: Record<string, Record<string, SerializedServiceV2[]>>;
    isLoggedIn: boolean;
}

// Icon Mapping per Platform
const PLATFORM_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
    'TELEGRAM': { label: 'Telegram', icon: <BrandIcon name="telegram" size={24} className="text-[#24A1DE]" /> },
    'INSTA': { label: 'Instagram', icon: <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">IG</div> },
    'VK': { label: 'ВКонтакте', icon: <BrandIcon name="vk" size={24} className="text-[#0077FF]" /> },
    'TIK': { label: 'TikTok', icon: <BrandIcon name="tiktok" size={24} className="text-[#000000]" /> },
    'YOU': { label: 'YouTube', icon: <BrandIcon name="youtube" size={24} className="text-[#FF0000]" /> },
    'LIKEE': { label: 'Likee', icon: <BrandIcon name="likee" size={24} className="text-[#FF0069]" /> },
    'TWITCH': { label: 'Twitch', icon: <FaTwitch size={24} color="#9146FF" /> },
    'TWITTER': { label: 'Twitter', icon: <FaTwitter size={24} color="#1DA1F2" /> },
    'FACEBOOK': { label: 'Facebook', icon: <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">FB</div> },
    'DISCORD': { label: 'Discord', icon: <FaDiscord size={24} color="#5865F2" /> },
    'REDDIT': { label: 'Reddit', icon: <FaReddit size={24} color="#FF4500" /> },
    'WHATSAPP': { label: 'WhatsApp', icon: <FaWhatsapp size={24} color="#25D366" /> },
    'SPOTIFY': { label: 'Spotify', icon: <FaSpotify size={24} color="#1DB954" /> },
    'OK': { label: 'Одноклассники', icon: <FaOdnoklassniki size={24} color="#EE8208" /> },
    'SOUNDCLOUD': { label: 'SoundCloud', icon: <FaSoundcloud size={24} color="#FF5500" /> },
    'LINKEDIN': { label: 'LinkedIn', icon: <FaLinkedin size={24} color="#0A66C2" /> },
    'PINTEREST': { label: 'Pinterest', icon: <FaPinterest size={24} color="#E60023" /> },
    'SNAPCHAT': { label: 'Snapchat', icon: <FaSnapchatGhost size={24} color="#FFFC00" /> },
    'OTHER': { label: 'Другое', icon: <Sparkles size={24} className="text-slate-400" /> },
};

// Helper to get platform info for labels
const getPlatformInfo = (p: string) => {
    const key = Object.keys(PLATFORM_MAP).find(k => p.toUpperCase().includes(k));
    const label = translatePlatform(p);
    return key ? { ...PLATFORM_MAP[key], label } : { label, icon: <Sparkles size={24} className="text-slate-400" /> };
};

// eslint-disable-next-line unused-imports/no-unused-vars
export function CompactCatalog({ groupedServices, isLoggedIn }: CompactCatalogProps) {
    const platforms = Object.keys(groupedServices);
    const searchParams = useSearchParams();
    const [selectedPlatform, setSelectedPlatform] = useState(platforms[0] || "");

    // Deep-linking from Academy or other sources
    React.useEffect(() => {
        const platformQuery = searchParams.get('platform')?.toUpperCase();
        if (platformQuery) {
            // Find match in our platforms keys (e.g. "INSTA" matches "instagram" query)
            const matchedKey = platforms.find(p =>
                p.toUpperCase().includes(platformQuery) ||
                platformQuery.includes(p.toUpperCase())
            );
            if (matchedKey) {
                setSelectedPlatform(matchedKey);
            }
        }
    }, [searchParams, platforms]);

    const categories = useMemo(() => {
        if (!selectedPlatform) return [];
        return Object.keys(groupedServices[selectedPlatform] || {});
    }, [selectedPlatform, groupedServices]);

    const [selectedCategory, setSelectedCategory] = useState(categories[0] || "");
    const [searchQuery, setSearchQuery] = useState("");

    const router = useRouter();

    // Reset category when platform changes
    React.useEffect(() => {
        if (categories.length > 0) {
            setSelectedCategory(categories[0]);
        }
    }, [selectedPlatform, categories]);

    const filteredServices = useMemo(() => {
        if (!selectedPlatform) return [];

        const platformServices = groupedServices[selectedPlatform] || {};

        if (searchQuery) {
            return Object.entries(platformServices).flatMap(([cat, services]) =>
                services.filter(s =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    cat.toLowerCase().includes(searchQuery.toLowerCase())
                ).map(s => ({ ...s, category: cat }))
            );
        }

        return (platformServices[selectedCategory] || []).map(s => ({ ...s, category: selectedCategory }));
    }, [selectedPlatform, selectedCategory, searchQuery, groupedServices]);

    return (
        <div className="flex flex-col gap-12">

            {/* 1. Platform Navigation (Compact & Responsive) */}
            <div className="w-full max-w-full overflow-hidden">
                <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto no-scrollbar py-4 px-4 bg-blue-50/60 rounded-[2.5rem] border border-blue-100/50 backdrop-blur-md w-full snap-x snap-mandatory after:content-[''] after:shrink-0 after:w-1">
                    {platforms.map(p => {
                        const isActive = selectedPlatform === p;
                        const pInfo = getPlatformInfo(p);
                        return (
                            <button
                                key={p}
                                onClick={() => {
                                    setSelectedPlatform(p);
                                    setSearchQuery("");
                                }}
                                className={cn(
                                    "group relative flex items-center justify-center rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden shrink-0",
                                    isActive
                                        ? "bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] px-5 py-3 gap-3 ring-1 ring-slate-200 scale-105 z-10"
                                        : "bg-transparent p-3 hover:bg-slate-100 text-slate-500 scale-100"
                                )}
                            >
                                <div className="shrink-0 transition-transform duration-300 group-hover:scale-110">
                                    {pInfo.icon}
                                </div>

                                <div className={cn(
                                    "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] overflow-hidden flex flex-col justify-center",
                                    isActive ? "w-auto max-w-[200px] opacity-100 ml-1" : "w-0 max-w-0 opacity-0 ml-0"
                                )}>
                                    <span className="text-[15px] font-black tracking-tight text-slate-800 whitespace-nowrap">
                                        {pInfo.label}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-12 items-start">

                {/* 2. Sidebar / Filters */}
                <div className="w-full lg:w-80 shrink-0 space-y-8">

                    {/* Search Field */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-500/10 blur-2xl group-focus-within:opacity-100 opacity-100 transition-opacity" />
                        <div className="relative flex items-center bg-blue-50/50 border border-blue-100 rounded-[2rem] px-5 py-5 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50 focus-within:bg-white transition-all shadow-[0_0_20px_rgba(37,99,235,0.05)]">
                            <Search className="text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Найти услугу..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-transparent border-none outline-none pl-4 text-sm font-bold text-blue-900 placeholder:text-blue-300 italic"
                            />
                        </div>
                    </div>

                    {/* Category List */}
                    {!searchQuery && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-4">
                                <Filter size={14} className="text-blue-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Категории</span>
                            </div>

                            <div className="bg-white border border-slate-100 rounded-[3rem] p-3 space-y-1 shadow-sm">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={cn(
                                            "w-full text-left px-5 py-3.5 rounded-2xl text-[13px] font-bold tracking-tight transition-all flex items-center justify-between group",
                                            selectedCategory === cat
                                                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
                                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                                        )}
                                    >
                                        <span className="truncate pr-4">{cat}</span>
                                        <ChevronRight size={16} className={cn("transition-all duration-300 shrink-0", selectedCategory === cat ? "translate-x-0" : "-translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0")} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quality Assurance Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-[60px] group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10 space-y-4">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-blue-400">
                                <Star size={20} fill="currentColor" />
                            </div>
                            <h4 className="text-sm font-black uppercase tracking-widest">Гарантия SMM</h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                                Все услуги в этом списке проходят 7-дневное тестирование перед публикацией в каталоге.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Services Grid */}
                <div className="flex-1 min-w-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedCategory + selectedPlatform + searchQuery}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: "circOut" }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-8"
                        >
                            {filteredServices.map((service, idx) => (
                                <motion.div
                                    key={service.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className={cn(
                                        "group relative p-10 border rounded-[3.5rem] transition-all flex flex-col justify-between overflow-hidden cursor-default",
                                        service.isHot
                                            ? "bg-gradient-to-br from-orange-500 to-rose-600 border-orange-400 shadow-[0_20px_40px_-15px_rgba(249,115,22,0.5)] hover:shadow-[0_40px_80px_-20px_rgba(249,115,22,0.8)]"
                                            : "bg-white border-slate-100 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.06)] hover:border-blue-100"
                                    )}
                                >
                                    {/* Hover Decor */}
                                    <div className={cn(
                                        "absolute top-0 right-0 w-48 h-48 blur-3xl transition-opacity duration-700 pointer-events-none opacity-0 group-hover:opacity-100",
                                        service.isHot ? "bg-white/20" : "bg-gradient-to-br from-blue-50/50 to-transparent"
                                    )} />
                                    <div className={cn(
                                        "absolute -bottom-10 -left-10 w-32 h-32 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                                        service.isHot ? "bg-white/20" : "bg-indigo-50/30"
                                    )} />

                                    <div className="relative z-10">
                                        <div className="flex w-full items-start justify-between">
                                            <div className="flex flex-col gap-2 relative z-10">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {service.isHot ? (
                                                        <div className="flex items-center justify-center bg-white/20 backdrop-blur-md rounded-full px-3 py-1 gap-1 shrink-0">
                                                            <Flame size={12} className="text-white fill-white" />
                                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Хит продаж</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            {service.isBest && <ShieldCheck size={14} className="text-emerald-500" />}
                                                            {service.isCheap && <TrendingUp size={14} className="text-blue-500" />}
                                                        </div>
                                                    )}
                                                    <div className={cn("px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0", service.isHot ? "bg-white text-orange-600" : "bg-slate-100 text-slate-500")}>
                                                        {service.quality === "HIGH" ? "Premium" : "Stable"}
                                                    </div>
                                                    <div className={cn("px-3 py-1.5 rounded-[0.6rem] text-[13px] font-mono font-black shrink-0 border shadow-sm", service.isHot ? "bg-white/20 text-white border-white/30" : "bg-slate-50 text-slate-800 border-slate-200")}>
                                                        ID: {service.numericId}
                                                    </div>
                                                </div>
                                                {searchQuery && (
                                                    <div className={cn("px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full w-fit", service.isHot ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600")}>
                                                        {service.category}
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm shrink-0", service.isHot ? "bg-white/10 text-white hover:bg-white/20" : "bg-slate-50 text-slate-300 group-hover:bg-blue-600 group-hover:text-white")}>
                                                <Info size={18} />
                                            </div>
                                        </div>

                                        <h3 className={cn("text-xl font-black mb-6 leading-[1.15] transition-colors decoration-2 underline-offset-4 z-10 relative mt-8 md:mt-10", service.isHot ? "text-white group-hover:text-blue-50 decoration-white/30" : "text-slate-900 group-hover:text-blue-600 decoration-blue-600/30")}>
                                            {service.name}
                                        </h3>

                                        <div className="mb-10 flex-1 relative z-10">
                                            <p className={cn("text-xs font-medium leading-relaxed italic border-l-4 pl-6 transition-all duration-500 line-clamp-4", service.isHot ? "text-orange-100 border-white/20 group-hover:border-white" : "text-slate-400 border-blue-500/20 group-hover:border-blue-500")}>
                                                {service.description || "Премиальная услуга с гарантированным результатом. Оптимизирована для роста охватов и вовлеченности."}
                                            </p>
                                        </div>
                                    </div>

                                    <div className={cn("relative z-10 pt-8 border-t flex items-end justify-between gap-4", service.isHot ? "border-white/10" : "border-slate-50")}>
                                        <div className="min-w-0 flex-1 pr-2">
                                            <span className={cn("block text-[10px] font-black uppercase tracking-widest", service.isHot ? "text-orange-200" : "text-slate-400")}>Цена за 1 шт.</span>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className={cn("text-2xl 2xl:text-3xl font-black tracking-tighter tabular-nums drop-shadow-sm truncate", service.isHot ? "text-white" : "text-slate-900")}>
                                                    {(() => {
                                                        const price = Number(service.pricePer1000) / 1000;
                                                        if (price === 0) return "0,00";
                                                        if (price >= 1) return price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                        return price.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 5 });
                                                    })()}
                                                </span>
                                                <span className={cn("text-base font-bold shrink-0", service.isHot ? "text-white/60" : "text-slate-400")}>₽</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => router.push(`/?serviceId=${service.id}`)}
                                            className={cn("h-14 px-6 md:px-8 shrink-0 rounded-[1.5rem] flex items-center gap-2 hover:shadow-xl transition-all duration-500 active:scale-95 group/btn", service.isHot ? "bg-white text-orange-600 hover:scale-105" : "bg-slate-900 text-white hover:bg-blue-600 hover:shadow-blue-200")}
                                        >
                                            <span className="text-[11px] font-black uppercase tracking-[0.1em] hidden sm:block">Заказать</span>
                                            <ArrowRight size={16} className="transition-transform duration-500 group-hover/btn:translate-x-1" />
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>

                    {filteredServices.length === 0 && (
                        <div className="py-40 text-center bg-slate-50/30 rounded-[5rem] border-4 border-dashed border-slate-100 flex flex-col items-center">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-200 mb-8 shadow-sm"
                            >
                                <Layout size={40} />
                            </motion.div>
                            <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tighter">Здесь пока пусто</h3>
                            <p className="text-slate-400 font-medium italic max-w-sm">
                                К сожалению, в этой категории пока нет услуг. Попробуйте сбросить поиск или выбрать другую платформу.
                            </p>
                            <button
                                onClick={() => { setSearchQuery(""); setSelectedPlatform(Object.keys(groupedServices)[0] || ""); }}
                                className="mt-8 text-blue-600 text-xs font-black uppercase tracking-widest hover:underline"
                            >
                                Сбросить все фильтры
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
