"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Link as LinkIcon,
    Search,
    Loader2,
    CheckCircle2,
    ChevronRight,
    Star
} from 'lucide-react';
import { analyzePremiumLink } from "@/app/(client)/dashboard/premium/actions";
import Link from 'next/link';

export const PremiumQuickOrder = () => {
    const [link, setLink] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<any>(null);

    useEffect(() => {
        if (link.length > 5) {
            const timeout = setTimeout(async () => {
                setIsAnalyzing(true);
                try {
                    const result = await analyzePremiumLink(link);
                    if (result.error) {
                        setAnalysisResult({ error: result.error });
                    } else {
                        setAnalysisResult(result);
                    }
                } catch (e) {
                    console.error(e);
                } finally {
                    setIsAnalyzing(false);
                }
            }, 800);
            return () => clearTimeout(timeout);
        } else {
            setAnalysisResult(null);
        }
    }, [link]);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="premium-card p-2 group focus-within:border-premium-gold/40 transition-all shadow-2xl shadow-premium-gold/5"
            >
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 p-2">
                    <div className="flex-1 flex items-center gap-4 px-6">
                        <LinkIcon className={`w-6 h-6 transition-colors ${link ? "text-premium-gold" : "text-white/20"}`} />
                        <input
                            type="text"
                            placeholder="Вставьте ссылку для мгновенного анализа..."
                            className="w-full bg-transparent border-none outline-none text-xl font-bold placeholder:text-white/10 py-5"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>

                    <AnimatePresence mode="wait">
                        {isAnalyzing ? (
                            <motion.div
                                key="analyzing"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-3 px-10 text-premium-gold font-black uppercase tracking-widest text-[10px] whitespace-nowrap"
                            >
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Анализ...
                            </motion.div>
                        ) : (
                            <button
                                className="premium-button py-5 px-10 text-xs flex items-center justify-center gap-3 active:scale-95 transition-all relative z-20"
                                style={{ marginTop: 0, paddingTop: 12, paddingBottom: 12, marginBottom: 0 }} // Bypass global font hack and adjust for py-5 equivalent
                            >
                                <Search className="w-4 h-4 text-black" />
                                <span className="whitespace-nowrap">Подобрать</span>
                            </button>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {analysisResult && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-3 bg-white/5 py-2 px-4 rounded-full border border-white/10">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                                    {analysisResult.platform} • {analysisResult.objectType}
                                </span>
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-premium-gold">Рекомендовано для Вас</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {analysisResult.suggestedServices?.slice(0, 3).map((service: any, index: number) => (
                                <Link
                                    key={service.id}
                                    href="/premium-site/order-success"
                                    className="block"
                                >
                                    <SuggestedService
                                        icon={<Star className="w-4 h-4" />}
                                        title={service.name}
                                        price={`от ${service.price} ₽`}
                                        delay={index * 0.1}
                                    />
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SuggestedService = ({ icon, title, price, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay }}
        whileHover={{ y: -5, borderColor: 'rgba(212, 175, 55, 0.4)' }}
        className="premium-card p-6 flex flex-col justify-between gap-6 cursor-pointer group transition-all"
    >
        <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-premium-gold group-hover:text-black transition-all">
                {icon}
            </div>
            <h4 className="font-black text-sm tracking-tight">{title}</h4>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 pt-4">
            <span className="text-premium-gold font-black text-sm">{price}</span>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-premium-gold transition-colors" />
        </div>
    </motion.div>
);


