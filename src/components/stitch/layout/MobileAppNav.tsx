'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Package, User, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/utils/ui';

const navItems = [
    { name: 'Главная', href: '/', icon: Sparkles },
    { name: 'Каталог', href: '/catalog', icon: LayoutDashboard },
    { name: 'Заказ+', href: '/#order', icon: Plus, isAction: true },
    { name: 'Заказы', href: '/dashboard/orders', icon: Package },
    { name: 'Личный кабинет', href: '/dashboard', icon: User },
];

export function MobileAppNav() {
    const pathname = usePathname();
    const [isBlocked, setIsBlocked] = React.useState(false);
    const [isVisible, setIsVisible] = React.useState(true);
    const [lastScrollY, setLastScrollY] = React.useState(0);

    React.useEffect(() => {
        // [UX Hardening] Persistent navigation for better accessibility
        setIsVisible(true);
    }, []);

    React.useEffect(() => {
        const check = () => setIsBlocked(document.body.classList.contains('modal-open'));
        check();
        const obs = new MutationObserver(check);
        obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    if (isBlocked) return null;

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 z-50 md:hidden px-4 pb-6 pt-2 transition-all duration-500 transform",
            isVisible ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0",
            "pointer-events-none"
        )}>
            <nav className="max-w-md mx-auto h-16 bg-white/80 backdrop-blur-2xl border border-white/40 rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] flex items-center justify-around px-2 pointer-events-auto relative">

                {/* Accent Background Glow */}
                <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
                </div>

                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    if (item.isAction) {
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className="relative -top-6"
                            >
                                <motion.div
                                    whileTap={{ scale: 0.9 }}
                                    className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-blue-500/40 border-4 border-slate-50 relative z-10"
                                >
                                    <Icon size={24} />
                                </motion.div>
                                <div className="absolute -inset-2 bg-blue-400/20 blur-xl rounded-full -z-10" />
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="flex flex-col items-center justify-center w-12 h-12 relative group"
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobileNavActive"
                                    className="absolute inset-0 bg-blue-50 rounded-2xl -z-10"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <motion.div
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    y: isActive ? -2 : 0
                                }}
                            >
                                <Icon
                                    size={20}
                                    className={cn(
                                        "transition-colors duration-300",
                                        isActive ? "text-blue-600 stroke-[2.5px]" : "text-slate-400"
                                    )}
                                />
                            </motion.div>
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest mt-1 hidden sm:block",
                                isActive ? "text-blue-600" : "text-slate-400"
                            )}>
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}


