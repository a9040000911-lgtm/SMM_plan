"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogIn, LayoutDashboard, Rocket, ShoppingCart, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const Header = () => {
    const { data: session } = useSession();
    const [cartCount, setCartCount] = React.useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const updateCount = () => {
            try {
                const cart = JSON.parse(localStorage.getItem('cart') || '[]');
                setCartCount(Array.isArray(cart) ? cart.length : 0);
            } catch (e) {
                setCartCount(0);
            }
        };
        updateCount();
        window.addEventListener('storage', updateCount);
        window.addEventListener('cart-updated', updateCount);
        return () => {
            window.removeEventListener('storage', updateCount);
            window.removeEventListener('cart-updated', updateCount);
        };
    }, []);

    // Close menu on route change
    React.useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { href: '/catalog', label: 'Каталог' },
        { href: '/mass', label: 'Оптовый заказ', badge: 'New', badgeColor: 'bg-blue-100 text-blue-600' },
        { href: '/academy', label: 'Академия', badge: 'Deep', badgeColor: 'bg-purple-100 text-purple-600' },
        { href: '/about', label: 'О нас' },
        { href: '/faq', label: 'FAQ' },
    ];

    return (
        <>
            <header className="fixed top-0 left-0 w-full z-50 bg-white/70 backdrop-blur-xl border-b border-slate-100">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Rocket className="text-white w-6 h-6" />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-slate-900">
                            Smmplan
                        </span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map(link => (
                            <Link key={link.href} href={link.href} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors relative">
                                {link.label}
                                {link.badge && (
                                    <span className={`absolute -top-3 -right-6 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${link.badgeColor}`}>
                                        {link.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <Link href="/cart" className="relative p-2.5 text-slate-500 hover:text-blue-600 transition-all hover:bg-blue-50 rounded-xl group">
                            <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
                            {cartCount > 0 && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-blue-600 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                                    {cartCount}
                                </span>
                            )}
                        </Link>

                        {session ? (
                            <div className="hidden md:flex items-center gap-3">
                                <Link href="/dashboard">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                                    >
                                        <LayoutDashboard size={18} />
                                        Кабинет
                                    </motion.button>
                                </Link>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Выйти"
                                >
                                    <LogIn size={20} className="rotate-180" />
                                </button>
                            </div>
                        ) : (
                            <Link href="/login" className="hidden md:block">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all"
                                >
                                    <User size={18} />
                                    Войти
                                </motion.button>
                            </Link>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                            aria-label="Открыть меню"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[51] md:hidden"
                        />
                        <motion.nav
                            initial={{ opacity: 0, x: '100%' }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed top-0 right-0 bottom-0 w-72 bg-white z-[52] md:hidden shadow-2xl flex flex-col"
                        >
                            {/* Menu Header */}
                            <div className="flex items-center justify-between px-6 h-20 border-b border-slate-100">
                                <span className="text-lg font-black text-slate-900">Меню</span>
                                <button
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <div className="flex-1 overflow-y-auto py-4">
                                {navLinks.map((link, i) => (
                                    <motion.div
                                        key={link.href}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <Link
                                            href={link.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-between px-6 py-4 text-base font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                        >
                                            {link.label}
                                            {link.badge && (
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${link.badgeColor}`}>
                                                    {link.badge}
                                                </span>
                                            )}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Auth Section */}
                            <div className="px-6 py-6 border-t border-slate-100 space-y-3">
                                {session ? (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-100 text-slate-900 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all border border-slate-200"
                                        >
                                            <LayoutDashboard size={18} />
                                            Личный кабинет
                                        </Link>
                                        <button
                                            onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                                            className="w-full py-3 text-sm font-bold text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            Выйти
                                        </button>
                                    </>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all"
                                    >
                                        <User size={18} />
                                        Войти
                                    </Link>
                                )}
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};
