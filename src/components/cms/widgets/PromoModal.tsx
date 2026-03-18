"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface PromoModalData {
    title: string;
    content: string;
    buttonText?: string;
    buttonLink?: string;
    showOnce?: boolean;
}

export function PromoModal({ data }: { data: PromoModalData }) {
    const [isOpen, setIsOpen] = React.useState(false);

    React.useEffect(() => {
        const hasSeen = localStorage.getItem(`promo_modal_${data.title}`);
        if (!data.showOnce || !hasSeen) {
            const timer = setTimeout(() => setIsOpen(true), 3000);
            return () => clearTimeout(timer);
        }
    }, [data.title, data.showOnce]);

    const handleClose = () => {
        setIsOpen(false);
        if (data.showOnce) {
            localStorage.setItem(`promo_modal_${data.title}`, 'true');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
                    >
                        <button onClick={handleClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                            <X size={20} />
                        </button>

                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-900 mb-4 leading-tight">{data.title}</h2>
                            <p className="text-slate-500 font-medium mb-8 leading-relaxed">{data.content}</p>
                            
                            {data.buttonText && (
                                <a 
                                    href={data.buttonLink} 
                                    className="block w-full py-4 bg-blue-600 text-white text-center rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                                >
                                    {data.buttonText}
                                </a>
                            )}
                        </div>

                        {/* Background Decor */}
                        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}


