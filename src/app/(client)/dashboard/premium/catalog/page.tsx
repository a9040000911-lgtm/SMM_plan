"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Instagram,
    Send,
    Youtube,
    Star,
    ArrowLeft,
    Filter,
    ChevronRight,
    ShieldCheck,
    Zap,
    Diamond
} from 'lucide-react';
import Link from 'next/link';
import { getPremiumServices } from '@/app/(client)/dashboard/premium/actions';

const PLATFORMS = [
    { id: 'all', name: 'Все', icon: <Star className="w-4 h-4" /> },
    { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
    { id: 'telegram', name: 'Telegram', icon: <Send className="w-4 h-4" /> },
    { id: 'tiktok', name: 'TikTok', icon: <Zap className="w-4 h-4" /> },
    { id: 'youtube', name: 'YouTube', icon: <Youtube className="w-4 h-4" /> },
];


export const dynamic = 'force-dynamic';
export default function PremiumCatalogPage() {
    const [activePlatform, setActivePlatform] = useState('all');
    const [search, setSearch] = useState('');
    const [services, setServices] = useState<any[]>([]);
    // eslint-disable-next-line unused-imports/no-unused-vars
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            setIsLoading(true);
            try {
                const data = await getPremiumServices(activePlatform);
                setServices(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, [activePlatform]);

    const filteredServices = services.filter(service =>
        service.name.toLowerCase().includes(search.toLowerCase()) ||
        service.desc.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#02040a] text-white overflow-hidden pb-40">
            {/* Background */}
            <div className="absolute top-0 right-0 w-[60%] h-[40%] bg-premium-gold opacity-[0.03] blur-[150px] pointer-events-none" />

            <header className="relative z-10 px-6 py-8 md:py-12 max-w-7xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                    <Link href="/dashboard/premium" className="flex items-center gap-2 group text-white/40 hover:text-white transition-colors cursor-pointer">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-widest">К обзору</span>
                    </Link>
                    <div className="text-[10px] font-black uppercase tracking-[0.4em] text-premium-gold flex items-center gap-3">
                        <Diamond className="w-3 h-3 animate-pulse" />
                        Elite Catalog
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Премиум <span className="text-premium-gold italic">услуги</span></h1>
                    <p className="text-white/40 font-bold max-w-xl text-sm leading-relaxed">Эксклюзивный выбор инструментов продвижения для самых требовательных клиентов.</p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-6 pt-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-premium-gold transition-colors" />
                        <input
                            type="text"
                            placeholder="Поиск по элитным услугам..."
                            className="w-full bg-white/5 border border-white/5 rounded-[2rem] py-5 pl-14 pr-6 text-base font-bold outline-none focus:border-premium-gold/40 transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 px-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {PLATFORMS.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setActivePlatform(p.id)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border transition-all whitespace-nowrap text-[10px] font-black uppercase tracking-widest ${activePlatform === p.id
                                    ? 'bg-premium-gold text-black border-premium-gold shadow-lg shadow-premium-gold/20'
                                    : 'bg-white/5 border-white/5 text-white/40 hover:border-white/20 hover:text-white'
                                    }`}
                            >
                                {p.icon}
                                {p.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="relative z-10 px-6 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredServices.map((service, index) => (
                            <motion.div
                                key={service.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ y: -5 }}
                                className="premium-card p-8 flex flex-col justify-between gap-6 group cursor-pointer border-white/5 hover:border-premium-gold/30 transition-all h-[340px]"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <PlatformBadge platform={service.platform} />
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-premium-gold/10 text-premium-gold text-[8px] font-black uppercase tracking-widest leading-none">
                                            <ShieldCheck className="w-2.5 h-2.5" />
                                            Гарантия
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black tracking-tight group-hover:text-premium-gold transition-colors leading-tight">{service.name}</h3>
                                        <p className="text-white/40 font-medium leading-relaxed text-xs line-clamp-3">{service.desc}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Цена за ед.</p>
                                        <p className="text-xl font-black text-premium-gold">{service.price}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-premium-gold group-hover:text-black transition-all">
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>

                {filteredServices.length === 0 && (
                    <div className="py-20 text-center space-y-6">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                            <Filter className="w-6 h-6 text-white/20" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-white/40 italic">Ничего не найдено.</h2>
                        <button
                            onClick={() => { setActivePlatform('all'); setSearch(''); }}
                            className="text-premium-gold font-black uppercase text-[10px] tracking-widest hover:underline"
                        >
                            Сбросить фильтры
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}

const PlatformBadge = ({ platform }: any) => {
    const icoClass = "w-3 h-3";
    switch (platform) {
        case 'instagram': return <div className="flex items-center gap-2 text-pink-500 font-black text-[9px] uppercase tracking-widest"><Instagram className={icoClass} /> Instagram</div>;
        case 'telegram': return <div className="flex items-center gap-2 text-blue-400 font-black text-[9px] uppercase tracking-widest"><Send className={icoClass} /> Telegram</div>;
        case 'tiktok': return <div className="flex items-center gap-2 text-white font-black text-[9px] uppercase tracking-widest"><Zap className={icoClass} /> TikTok</div>;
        case 'youtube': return <div className="flex items-center gap-2 text-red-500 font-black text-[9px] uppercase tracking-widest"><Youtube className={icoClass} /> YouTube</div>;
        default: return null;
    }
}


