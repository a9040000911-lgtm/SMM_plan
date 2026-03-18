"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Cpu, Layers, Activity } from "lucide-react";
import { CategoryCard } from "./CategoryCard";
import { cn } from "@/utils/ui";
import { translateCategory, translatePlatform } from "@/utils/translations";

interface Service {
    id: string;
    name: string;
    description: string;
    price: number;
    min: number;
    max: number;
    unit: string;
    platform: string;
    category: string;
}

interface ServiceSelectorProps {
    catalog: Record<string, Record<string, {
        metadata: {
            id: string;
            description: string;
            icon: string;
            targetType: string;
            category: string;
        },
        services: Service[]
    }>>;
    onSelectService: (service: Service) => void;
}

export const ServiceSelector: React.FC<ServiceSelectorProps> = ({ catalog, onSelectService }) => {
    const platforms = Object.keys(catalog);
    const [selectedPlatform, setSelectedPlatform] = useState(platforms[0] || "");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const currentCategories = catalog[selectedPlatform] || {};
    const categoryNames = Object.keys(currentCategories);

    const filteredCategories = categoryNames.filter(catName => {
        if (!searchQuery) return true;
        const categoryData = currentCategories[catName];
        if (!categoryData || !categoryData.services) return false;

        return categoryData.services.some(s =>
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            catName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    });

    return (
        <div className="space-y-12">
            {/* Header & Search */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-8 bg-primary shadow-[0_0_15px_var(--primary-glow)]" />
                        <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic text-white text-glow-primary">
                            КАТАЛОГ_МОЩНОСТЕЙ
                        </h2>
                    </div>
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary/40 italic ml-5">
                        ВЫБЕРИТЕ ПРОТОКОЛ И ТИП ТРАФИКА ДЛЯ ГЕНЕРАЦИИ
                    </p>
                </div>

                <div className="relative group w-full md:max-w-sm">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary/40 group-focus-within:text-primary transition-colors">
                        <Search size={22} className="animate-pulse" />
                    </div>
                    <input
                        type="text"
                        placeholder="ПОИСК УСЛУГИ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/5 group-focus-within:border-primary/40 outline-none rounded-2xl py-5 pl-14 pr-6 text-sm font-bold text-white transition-all backdrop-blur-md italic tracking-widest"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-20">
                        <Cpu size={18} />
                    </div>
                </div>
            </div>

            {/* Platform Tabs */}
            <div className="relative">
                <div className="flex items-center gap-3 overflow-x-auto pb-6 no-scrollbar mask-fade-right">
                    {platforms.map((p) => (
                        <button
                            key={p}
                            onClick={() => { setSelectedPlatform(p); setSelectedCategory(null); }}
                            className={cn(
                                "px-8 py-4 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap relative overflow-hidden group/tab italic",
                                selectedPlatform === p
                                    ? "bg-primary text-black shadow-[0_0_30px_var(--primary-glow)] scale-105"
                                    : "bg-white/5 border border-white/10 text-slate-400 hover:border-primary/30 hover:text-white"
                            )}
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                <Layers size={14} />
                                {translatePlatform(p)}
                            </span>
                            {selectedPlatform === p && <div className="scan-line opacity-20" />}
                        </button>
                    ))}
                </div>
                <div className="absolute bottom-6 left-0 w-full h-px bg-white/5" />
            </div>

            {/* Services Grid (Categories) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AnimatePresence mode="popLayout">
                    {filteredCategories.map((catName, idx) => {
                        const categoryData = currentCategories[catName];
                        if (!categoryData || !categoryData.services) return null;

                        const minPrice = Math.min(...categoryData.services.map(s => s.price));

                        return (
                            <CategoryCard
                                key={`${selectedPlatform}-${catName}`}
                                category={translateCategory(catName)}
                                minPrice={minPrice}
                                platform={selectedPlatform}
                                index={idx}
                                isActive={selectedCategory === catName}
                                onClick={() => setSelectedCategory(selectedCategory === catName ? null : catName)}
                            />
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Tariffs List for selected category */}
            <AnimatePresence>
                {selectedCategory && (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="pt-12 grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                        <div className="col-span-full mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-primary/20 rounded-lg text-primary">
                                    <Activity size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black uppercase tracking-tight italic text-white underline decoration-primary/30 underline-offset-8">
                                        ДОСТУПНЫЕ_ТАРИФЫ: {translateCategory(selectedCategory)}
                                    </h3>
                                    <p className="text-[9px] font-black text-primary/40 tracking-[0.3em]">ВЫБЕРИТЕ КОНФИГУРАЦИЮ ДЛЯ ЗАПУСКА ПОТОКА</p>
                                </div>
                            </div>
                        </div>

                        {selectedCategory && currentCategories[selectedCategory]?.services.map((svc) => (
                            <motion.button
                                key={svc.id}
                                whileHover={{ y: -4, borderColor: "rgba(6,182,212,0.4)" }}
                                onClick={() => onSelectService(svc)}
                                className="p-6 cyber-box text-left group transition-all relative overflow-hidden bg-slate-950/60"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="space-y-1">
                                        <h4 className="font-black text-sm text-foreground group-hover:text-primary transition-colors tracking-tight uppercase">
                                            {svc.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-[1px] bg-primary/30" />
                                            <span className="text-[7px] font-black text-primary/40 tracking-widest">ID_{svc.id.slice(-6)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-mono font-black text-white italic">{(svc.price / 1000).toFixed(4)}</span>
                                            <span className="text-sm font-bold text-primary italic">₽</span>
                                        </div>
                                        <div className="text-[8px] uppercase text-slate-500 font-black tracking-widest mt-1">ЗА 1 ЕД.</div>
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed tracking-wide italic uppercase">
                                    {svc.description}
                                </p>

                                <div className="absolute bottom-0 right-0 p-1 opacity-0 group-hover:opacity-20 transition-opacity">
                                    <Filter size={12} />
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {filteredCategories.length === 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-32 text-center space-y-6"
                >
                    <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mx-auto relative group">
                        <Filter size={40} className="text-slate-600 group-hover:text-primary transition-colors" />
                        <div className="absolute inset-0 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-black uppercase tracking-[0.5em] text-white">УСЛУГИ НЕ ОБНАРУЖЕНЫ</p>
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">ПОПРОБУЙТЕ ИЗМЕНИТЬ ПАРАМЕТРЫ ЗАПРОСА</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
};


