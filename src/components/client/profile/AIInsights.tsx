"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, Brain, Target, Star, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Insight {
    type: 'SEGMENT' | 'NPS' | 'REFERRAL' | 'CHURN';
    title: string;
    message: string;
    level: 'INFO' | 'WARNING' | 'SUCCESS';
}

interface Recommendation {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    actionUrl: string;
    icon: string;
}

export const AIInsights: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAI = async () => {
            try {
                const res = await fetch("/api/client/ai/recommendations");
                if (res.ok) {
                    setData(await res.json());
                }
            } catch (err) {
                console.error("AI fetch error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAI();
    }, []);

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-6 w-32 bg-primary/10 rounded"></div>
                <div className="h-24 bg-card border border-border rounded-[2rem]"></div>
            </div>
        );
    }

    if (!data || (!data.insights.length && !data.recommendations.length)) return null;

    const segmentInsight = data.insights.find((i: Insight) => i.type === 'SEGMENT');
    const otherInsights = data.insights.filter((i: Insight) => i.type !== 'SEGMENT');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2">
                <Brain size={18} className="text-primary animate-pulse" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">
                    AI_LOYALTY_INSIGHTS
                </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Segment Card */}
                {segmentInsight && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "p-6 rounded-[2rem] border relative overflow-hidden group",
                            segmentInsight.level === 'SUCCESS' ? "bg-green-500/5 border-green-500/20" :
                                segmentInsight.level === 'WARNING' ? "bg-amber-500/5 border-amber-500/20" :
                                    "bg-primary/5 border-primary/20"
                        )}
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Sparkles size={40} />
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-xl font-black italic text-white uppercase tracking-tighter">
                                {segmentInsight.title}
                            </h4>
                            <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                {segmentInsight.message}
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Recommendations Carousel/Stack */}
                <div className="space-y-4">
                    <AnimatePresence>
                        {data.recommendations.map((rec: Recommendation, idx: number) => (
                            <motion.div
                                key={rec.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="cyber-box p-4 bg-white/5 border-white/5 hover:border-primary/30 transition-all flex items-center justify-between gap-4"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{rec.icon}</span>
                                    <div>
                                        <h5 className="text-[11px] font-black text-white uppercase tracking-wider">{rec.title}</h5>
                                        <p className="text-[10px] text-slate-500 font-bold">{rec.description}</p>
                                    </div>
                                </div>
                                <Link href={rec.actionUrl}>
                                    <button className="flex items-center gap-1 text-[10px] font-black text-primary uppercase hover:bg-primary/10 px-3 py-1.5 rounded-lg transition-colors group">
                                        {rec.actionLabel}
                                        <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </Link>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Micro Alerts */}
            {otherInsights.length > 0 && (
                <div className="flex flex-wrap gap-3">
                    {otherInsights.map((insight: Insight, idx: number) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className={cn(
                                "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm",
                                insight.level === 'SUCCESS' ? "bg-green-500/10 border-green-500/30 text-green-500" :
                                    insight.level === 'WARNING' ? "bg-amber-500/10 border-amber-500/30 text-amber-500" :
                                        "bg-primary/10 border-primary/30 text-primary"
                            )}
                        >
                            {insight.type === 'CHURN' ? <AlertTriangle size={10} /> :
                                insight.type === 'NPS' ? <Star size={10} /> : <Target size={10} />}
                            {insight.title}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};
