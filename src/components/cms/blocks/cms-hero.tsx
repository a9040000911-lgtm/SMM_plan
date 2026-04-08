/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import { motion, Variants } from "framer-motion";
import { Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/utils/ui";
import { HubInput } from "@/components/stitch/ui/HubInput";
import { CmsHeroContent } from "@/lib/cms/schemas";
import React from "react";

const staggerContainer: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.15, delayChildren: 0.1, ease: "easeOut" }
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

export const CmsHero = ({ data }: { data: CmsHeroContent }) => {
    // We isolate state from HomeContent. HubInput analysis can trigger a generic or context-aware event
    const handleHubAnalyze = (url: string, platform: string | null) => {
        // Find InstantOrder if available globally or dispatch event
        window.dispatchEvent(new CustomEvent('cms:hub-analyze', { detail: { url, platform } }));
    };

    return (
        <section className="relative pt-12 md:pt-32 pb-8 px-6 max-w-6xl mx-auto z-10 w-full">
            <div className="flex flex-col lg:grid lg:grid-cols-12 gap-12 lg:gap-20 items-center">
                
                <motion.div 
                    variants={staggerContainer}
                    initial="hidden"
                    animate="show"
                    className="w-full lg:col-span-6 flex flex-col items-center text-center lg:items-start lg:text-left order-1"
                >
                    {data.badgeText && (
                        <motion.div variants={staggerItem} className="flex items-center gap-3 mb-6 px-4 py-2 bg-blue-500/5 rounded-full border border-blue-500/10 backdrop-blur-md">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-600/80 text-center">
                                {data.badgeText}
                            </span>
                        </motion.div>
                    )}

                    <motion.h1 variants={staggerItem} className="text-4xl md:text-5xl lg:text-6xl xl:text-[5rem] font-black tracking-tight text-slate-950 mb-6 md:mb-8 leading-[1.05] text-balance max-w-2xl w-full">
                        {data.title} <br className="hidden md:block" /> 
                        {data.subtitle && <span className="text-blue-600 italic font-serif inline-block">{data.subtitle}</span>}
                    </motion.h1>

                    <motion.div variants={staggerItem} className="w-full lg:hidden mb-10 order-2">
                         <HubInput className="shadow-2xl shadow-blue-500/10" onAnalyze={handleHubAnalyze} />
                    </motion.div>

                    {data.secondaryButtonText && (
                        <motion.p variants={staggerItem} className="text-lg md:text-xl text-slate-500 max-w-xl font-medium leading-relaxed mb-6 order-3">
                            {data.secondaryButtonText}
                        </motion.p>
                    )}

                    <motion.div variants={staggerItem} className="flex flex-wrap md:flex-nowrap items-center gap-x-8 gap-y-6 mb-10 order-4">
                        <div className="flex items-center gap-6 shrink-0">
                            <div className="flex -space-x-3">
                                {["from-blue-500 to-indigo-500", "from-emerald-400 to-teal-500", "from-rose-400 to-orange-400"].map((grad, i) => (
                                    <div key={i} className={cn("w-8 h-8 md:w-10 md:h-10 rounded-full border-4 border-white bg-gradient-to-br shadow-xl shadow-blue-500/5 flex items-center justify-center text-[10px] font-black text-white", grad)}>
                                        {["JS", "MB", "AK"][i]}
                                    </div>
                                ))}
                            </div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                    <Star size={14} className="text-amber-400 fill-amber-400" />
                                    <span className="text-sm font-black text-slate-950">4.9/5</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none whitespace-nowrap">Trust</span>
                            </div>
                        </div>

                        <div className="hidden md:block w-px h-8 bg-slate-200/60 shrink-0" />

                        <Link href={data.primaryButtonLink || "/catalog"} className="group flex items-center gap-4 text-slate-950 font-black uppercase text-[10px] tracking-widest hover:text-blue-600 transition-colors shrink-0">
                            <span className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 shadow-sm">
                                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                            </span>
                            <span>{data.primaryButtonText}</span>
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
                    <div className="absolute -z-10 w-[140%] h-[140%] bg-blue-500/5 rounded-full blur-[120px] -top-[20%] -left-[20%]" />
                    
                    <div className="w-full relative">
                        <HubInput className="shadow-2xl shadow-blue-500/10" onAnalyze={handleHubAnalyze} />

                        {/* Benefit Grid */}
                        {data.features && data.features.length > 0 && (
                            <div className="mt-8 w-full hidden md:grid grid-cols-2 gap-3">
                                {data.features.map((feat, i) => (
                                    <div key={i} className={cn(
                                        "glass p-4 rounded-[1.5rem] flex items-center gap-4 group hover:shadow-2xl transition-all cursor-pointer border-white/20 hover:border-blue-500/20 col-span-2"
                                    )}>
                                        <div className="space-y-0.5 overflow-hidden">
                                            <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-900 leading-tight truncate">{feat}</h3>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
