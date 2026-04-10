'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 *
 * Cookie Consent Banner — MA-03 audit fix.
 * Compliant with ФЗ-152 (Russia) and GDPR (EU).
 * Stores consent state in localStorage to avoid re-prompting.
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, X } from 'lucide-react';
import Link from 'next/link';

const CONSENT_KEY = 'smmplan_cookie_consent';

export function CookieConsentBanner() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Only show if user hasn't given consent yet
        const consent = localStorage.getItem(CONSENT_KEY);
        if (!consent) {
            // Small delay to not block initial render / LCP
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({
            accepted: true,
            timestamp: new Date().toISOString(),
        }));
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem(CONSENT_KEY, JSON.stringify({
            accepted: false,
            timestamp: new Date().toISOString(),
        }));
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-md z-[9998]"
                >
                    <div className="relative bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl shadow-slate-900/10 p-5 md:p-6">
                        {/* Close button */}
                        <button
                            onClick={handleDecline}
                            className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            aria-label="Закрыть"
                        >
                            <X size={14} className="text-slate-500" />
                        </button>

                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Cookie size={20} className="text-amber-500" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-black text-slate-900 mb-1.5">Мы используем cookie</h3>
                                <p className="text-xs text-slate-500 font-medium leading-relaxed mb-4">
                                    Мы используем файлы cookie и аналитику для улучшения работы сайта. 
                                    Продолжая использовать сайт, вы соглашаетесь с{' '}
                                    <Link href="/docs/policy" className="text-blue-600 hover:underline font-bold">
                                        Политикой конфиденциальности
                                    </Link>.
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleAccept}
                                        className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 transition-colors active:scale-95"
                                    >
                                        Принять
                                    </button>
                                    <button
                                        onClick={handleDecline}
                                        className="px-5 py-2 bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-colors active:scale-95"
                                    >
                                        Отклонить
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
