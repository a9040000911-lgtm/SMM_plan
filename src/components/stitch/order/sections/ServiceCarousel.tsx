'use client';
/**
 * ServiceCarousel — Category chips + Smart filters + Horizontal carousel of service cards
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Star, Shield, Globe, Zap, Coins, Heart, ChevronLeft, ChevronRight,
    Search, Package, Flame, Loader2
} from 'lucide-react';
import { cn } from '@/utils/ui';
import { formatUnitPrice } from '@/utils/formatter';
import { translateCategory } from '@/utils/translations';
import { ServiceDescription } from '../../catalog/ServiceDescription';
import type { SmmService, ServiceFilter } from '../hooks/useOrderFlow';

interface ServiceCarouselProps {
    categories: string[];
    selectedCategory: string | null;
    onSelectCategory: (cat: string) => void;
    services: SmmService[];
    selectedService: SmmService | null;
    onSelectService: (s: SmmService) => void;
    isLoading: boolean;
    favoriteIds: string[];
    onToggleFavorite: (id: string) => void;
    activeFilters: ServiceFilter[];
    onToggleFilter: (f: ServiceFilter) => void;
    searchQuery: string;
    onSearchChange: (q: string) => void;
}

const FILTER_CONFIG: { key: ServiceFilter; icon: React.ElementType; label: string; color: string }[] = [
    { key: 'TOP', icon: Star, label: 'Топ', color: 'text-amber-500' },
    { key: 'HQ', icon: Shield, label: 'HQ', color: 'text-emerald-500' },
    { key: 'RU_GEO', icon: Globe, label: 'RU Гео', color: 'text-blue-500' },
    { key: 'FAST', icon: Zap, label: 'Быстрый', color: 'text-violet-500' },
    { key: 'CHEAP', icon: Coins, label: 'Дешевле', color: 'text-orange-500' },
];

export const ServiceCarousel: React.FC<ServiceCarouselProps> = ({
    categories,
    selectedCategory,
    onSelectCategory,
    services,
    selectedService,
    onSelectService,
    isLoading,
    favoriteIds,
    onToggleFavorite,
    activeFilters,
    onToggleFilter,
    searchQuery,
    onSearchChange,
}) => {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);

    // Calculate visible cards per page
    const cardsPerPage = typeof window !== 'undefined' && window.innerWidth >= 768 ? 3 : 1;
    const totalPages = Math.ceil(services.length / cardsPerPage);

    const updateScrollButtons = useCallback(() => {
        const el = carouselRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
        // Sync currentPage from scroll position
        if (el.clientWidth > 0) {
            const cardWidth = el.clientWidth / cardsPerPage;
            const page = Math.round(el.scrollLeft / cardWidth);
            setCurrentPage(Math.min(page, totalPages - 1));
        }
    }, [cardsPerPage, totalPages]);

    useEffect(() => {
        updateScrollButtons();
        const el = carouselRef.current;
        if (el) {
            el.addEventListener('scroll', updateScrollButtons);
            return () => el.removeEventListener('scroll', updateScrollButtons);
        }
    }, [services, updateScrollButtons]);

    const scrollTo = useCallback((direction: 'left' | 'right') => {
        const el = carouselRef.current;
        if (!el) return;
        const cardWidth = el.clientWidth / cardsPerPage;
        const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
        el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        setCurrentPage(prev => direction === 'left' ? Math.max(0, prev - 1) : Math.min(totalPages - 1, prev + 1));
    }, [cardsPerPage, totalPages]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="text-blue-500 animate-spin" />
                <span className="ml-3 text-sm font-bold text-slate-400">Загрузка услуг...</span>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Section Label */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Package size={13} className="text-violet-600" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900">Услуга</span>
                    {services.length > 0 && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {services.length}
                        </span>
                    )}
                </div>
                {/* Search (optional, shown if many services) */}
                {services.length > 6 && (
                    <div className="relative">
                        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => onSearchChange(e.target.value)}
                            placeholder="Поиск..."
                            className="pl-8 pr-3 py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white focus:border-blue-300 focus:outline-none w-36"
                        />
                    </div>
                )}
            </div>

            {/* Category Chips */}
            {categories.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pb-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => onSelectCategory(cat)}
                            className={cn(
                                "whitespace-nowrap px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all border",
                                selectedCategory === cat
                                    ? "bg-slate-900 border-slate-900 text-white shadow-lg"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                            )}
                        >
                            {cat === 'FAVORITES' ? '★ Избранное' : translateCategory(cat)}
                        </button>
                    ))}
                </div>
            )}

            {/* Smart Filters */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {FILTER_CONFIG.map(f => {
                    const Icon = f.icon;
                    const isActive = activeFilters.includes(f.key);
                    return (
                        <button
                            key={f.key}
                            onClick={() => onToggleFilter(f.key)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all border shrink-0",
                                isActive
                                    ? "bg-slate-900 border-slate-900 text-white"
                                    : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                            )}
                        >
                            <Icon size={12} className={isActive ? 'text-white' : f.color} />
                            {f.label}
                        </button>
                    );
                })}
            </div>

            {/* Carousel */}
            {services.length > 0 ? (
                <div className="relative group/carousel">
                    {/* Arrow Left */}
                    {canScrollLeft && (
                        <button
                            onClick={() => scrollTo('left')}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all opacity-0 group-hover/carousel:opacity-100"
                        >
                            <ChevronLeft size={18} className="text-slate-600" />
                        </button>
                    )}

                    {/* Cards Container */}
                    <div
                        ref={carouselRef}
                        className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory"
                    >
                        {services.map(service => {
                            const isFav = favoriteIds.includes(service.id);
                            const isSelected = selectedService?.id === service.id;
                            return (
                                <div
                                    key={service.id}
                                    className={cn(
                                        "snap-start shrink-0 w-full md:w-[calc(33.333%-8px)]"
                                    )}
                                >
                                    <motion.div
                                        layout
                                        initial={{ opacity: 0, scale: 0.97 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className={cn(
                                            "relative border-2 rounded-xl p-3 transition-all cursor-pointer group/card h-full flex flex-col",
                                            isSelected
                                                ? "bg-blue-50 border-blue-400 shadow-lg shadow-blue-500/10 ring-2 ring-blue-100"
                                                : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                                        )}
                                        onClick={() => onSelectService(service)}
                                    >
                                        {/* Top Row: Badges + Fav */}
                                        <div className="flex items-center gap-1 mb-1.5">
                                            {service.isBest && (
                                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black uppercase rounded flex items-center gap-0.5">
                                                    <Star size={8} className="fill-amber-500 text-amber-500" /> Топ
                                                </span>
                                            )}
                                            {service.isHot && (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-black uppercase rounded flex items-center gap-0.5">
                                                    <Flame size={8} /> Hot
                                                </span>
                                            )}
                                            {service.quality === 'PREMIUM' && (
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded flex items-center gap-0.5">
                                                    <Shield size={8} className="fill-emerald-500" /> Premium
                                                </span>
                                            )}
                                            {service.quality === 'GUARANTEED' && (
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase rounded flex items-center gap-0.5">
                                                    <Shield size={8} /> Гарантия
                                                </span>
                                            )}
                                            {service.quality === 'DROP' && (
                                                <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black uppercase rounded flex items-center gap-0.5 relative overflow-hidden group/warning">
                                                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover/warning:animate-[shimmer_1.5s_infinite]"></span>
                                                    ⚠️ Без гарантии
                                                </span>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleFavorite(service.id); }}
                                                className="ml-auto p-0.5 rounded hover:bg-slate-100 transition-colors"
                                            >
                                                <Heart size={12} className={cn(isFav ? "text-red-500 fill-red-500" : "text-slate-300")} />
                                            </button>
                                        </div>

                                        {/* Service Name — compact */}
                                        <h3 className="text-[12px] font-bold text-slate-900 leading-tight mb-1.5 line-clamp-2 group-hover/card:text-blue-700 transition-colors">
                                            {service.name}
                                        </h3>

                                        {/* Compact Info Bullets */}
                                        <div className="space-y-0.5 mb-2 text-[11px] text-slate-500 font-medium">
                                            {service.description && (
                                                <ServiceDescription text={service.description} expandable={false} maxLines={2} className="leading-snug" />
                                            )}
                                            {service.requirements && (
                                                <p className="text-blue-600/70 leading-snug">ℹ️ {service.requirements}</p>
                                            )}
                                        </div>

                                        {/* Price Row — compact */}
                                        <div className="flex items-end justify-between mt-auto pt-2 border-t border-slate-100">
                                            <div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Цена / 1 шт</span>
                                                <span className="text-sm font-black text-slate-900">
                                                    {formatUnitPrice(service.pricePer1000)} ₽
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Мин</span>
                                                <span className="text-xs font-bold text-slate-600">{service.minQty.toLocaleString()}</span>
                                            </div>
                                        </div>

                                        {/* Selected Indicator */}
                                        {isSelected && (
                                            <motion.div
                                                layoutId="selected-indicator"
                                                className="absolute -top-px -right-px bg-blue-600 text-white text-[7px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-lg rounded-tr-xl"
                                            >
                                                ✓
                                            </motion.div>
                                        )}
                                    </motion.div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Arrow Right */}
                    {canScrollRight && (
                        <button
                            onClick={() => scrollTo('right')}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 w-9 h-9 rounded-full bg-white border border-slate-200 shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all opacity-0 group-hover/carousel:opacity-100"
                        >
                            <ChevronRight size={18} className="text-slate-600" />
                        </button>
                    )}

                    {/* Page Counter */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-3">
                            <button
                                onClick={() => scrollTo('left')}
                                disabled={!canScrollLeft}
                                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                            >
                                ←
                            </button>
                            <span className="text-[11px] font-bold text-slate-500 tabular-nums">
                                {currentPage + 1} / {totalPages}
                            </span>
                            <button
                                onClick={() => scrollTo('right')}
                                disabled={!canScrollRight}
                                className="text-[10px] font-bold text-slate-400 hover:text-blue-600 disabled:opacity-30 transition-colors"
                            >
                                →
                            </button>
                        </div>
                    )}
                </div>
            ) : categories.length > 0 ? (
                <div className="text-center py-8 text-slate-400">
                    <Package size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Услуги не найдены</p>
                    <p className="text-xs mt-1">Попробуйте другую категорию или сбросьте фильтры</p>
                </div>
            ) : null}
        </div>
    );
};
