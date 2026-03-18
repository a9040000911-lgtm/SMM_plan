"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Slide {
    title: string;
    description: string;
    buttonText: string;
    link: string;
    bgGradient: string;
    image?: string;
}

export function PromoCarousel({ data }: { data: { slides: Slide[] } }) {
    const [current, setCurrent] = React.useState(0);
    const slides = data.slides || [];

    if (slides.length === 0) return null;

    const next = () => setCurrent((prev) => (prev + 1) % slides.length);
    const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

    // Auto-advance
    React.useEffect(() => {
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const activeSlide = slides[current];

    return (
        <div className="w-full max-w-7xl mx-auto px-6 relative group h-[400px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    className={`w-full h-full rounded-[2.5rem] overflow-hidden relative shadow-2xl p-12 flex items-center bg-gradient-to-br ${activeSlide.bgGradient || 'from-slate-800 to-slate-900'}`}
                >
                    <div className="max-w-xl relative z-20 text-white">
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-4xl md:text-5xl font-black mb-6 leading-tight"
                        >
                            {activeSlide.title}
                        </motion.h2>
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="text-lg opacity-90 mb-8 font-medium"
                        >
                            {activeSlide.description}
                        </motion.p>
                        <Link href={activeSlide.link || '#'}>
                            <motion.button 
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-[11px] rounded-2xl hover:scale-105 transition-all shadow-xl active:scale-95"
                            >
                                {activeSlide.buttonText || 'Подробнее'}
                            </motion.button>
                        </Link>
                    </div>

                    {activeSlide.image && (
                        <div className="absolute right-0 top-0 h-full w-1/2 overflow-hidden pointer-events-none">
                            <Image 
                                src={activeSlide.image} 
                                alt={activeSlide.title}
                                fill
                                className="object-cover opacity-50 mask-fade-left"
                            />
                        </div>
                    )}

                    {/* Decor */}
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05)_0%,transparent_70%)] pointer-events-none z-10" />
                </motion.div>
            </AnimatePresence>

            {slides.length > 1 && (
                <>
                    <button onClick={prev} className="absolute left-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20">
                        <ArrowLeft size={20} />
                    </button>
                    <button onClick={next} className="absolute right-10 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-white/20">
                        <ArrowRight size={20} />
                    </button>
                </>
            )}
            
            {/* Dots */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                {slides.map((_, i) => (
                    <button 
                        key={i} 
                        onClick={() => setCurrent(i)}
                        className={`w-2 h-2 rounded-full transition-all ${current === i ? 'w-8 bg-white' : 'bg-white/30'}`}
                    />
                ))}
            </div>
        </div>
    );
}


