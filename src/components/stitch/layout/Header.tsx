"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogIn, LayoutDashboard, Rocket } from "lucide-react";
import { motion } from "framer-motion";

export const Header = () => {
    const { data: session } = useSession();

    return (
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
                    <Link href="/catalog" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Каталог</Link>
                    <Link href="/mass-order" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors relative">
                        Оптовый заказ
                        <span className="absolute -top-3 -right-6 px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest">New</span>
                    </Link>
                    <Link href="/academy" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors relative">
                        Академия
                        <span className="absolute -top-3 -right-6 px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded text-[8px] font-black uppercase tracking-widest">Deep</span>
                    </Link>
                    <Link href="/about" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">О нас</Link>
                    <Link href="/faq" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">FAQ</Link>
                </nav>

                <div className="flex items-center gap-4">
                    {session ? (
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-950 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-all"
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
                        <Link href="/login">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all"
                            >
                                <User size={18} />
                                Войти
                            </motion.button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};
