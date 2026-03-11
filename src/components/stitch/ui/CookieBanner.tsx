"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';

export function CookieBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already accepted cookies
        const hasAccepted = localStorage.getItem('smmplan_cookie_consent');
        if (!hasAccepted) {
            setIsVisible(true);
        }
    }, []);

    const acceptCookies = () => {
        localStorage.setItem('smmplan_cookie_consent', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border border-slate-100 shadow-2xl rounded-2xl p-4 z-[100]"
                >
                    <div className="flex gap-4">
                        <div className="hidden sm:flex bg-blue-50 text-blue-600 h-10 w-10 items-center justify-center rounded-xl shrink-0">
                            <Cookie size={20} />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="text-sm font-black text-slate-800 tracking-tight">Файлы Cookie</h3>
                                <button
                                    onClick={() => setIsVisible(false)}
                                    className="text-slate-400 hover:text-slate-600 p-1 -mr-2 -mt-2 opacity-50 hover:opacity-100 transition-opacity"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-xs font-medium text-slate-500 leading-relaxed mb-3">
                                Мы используем файлы cookie для улучшения работы сайта. Оставаясь на сайте, вы соглашаетесь с нашей{' '}
                                <Link href="/docs/policy" className="text-blue-600 hover:underline">
                                    Политикой в отношении использования файлов cookie
                                </Link>
                                .
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={acceptCookies}
                                    className="flex-1 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider py-2 rounded-xl hover:bg-black transition-colors"
                                >
                                    Принять
                                </button>
                                <Link
                                    href="/docs/policy"
                                    className="px-4 bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider py-2 rounded-xl hover:bg-slate-200 transition-colors text-center"
                                >
                                    Подробнее
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
