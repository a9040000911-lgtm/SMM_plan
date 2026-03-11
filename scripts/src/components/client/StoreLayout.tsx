"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AnimatedBackground } from "./AnimatedBackground";
import { Layers, History, User, Terminal, Cpu, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/providers/language-provider";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";
import { motion } from "framer-motion";

interface StoreLayoutProps {
    children: React.ReactNode;
}

export const StoreLayout: React.FC<StoreLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const { t } = useLanguage();

    const navItems = [
        { label: t.tma.console, icon: Terminal, href: "/" },
        { label: t.tma.catalog_menu, icon: LayoutGrid, href: "/catalog" },
        { label: t.tma.mass, icon: Layers, href: "/mass" },
        { label: t.tma.history, icon: History, href: "/orders" },
        { label: t.tma.help_nav, icon: Cpu, href: "/support" },
    ];

    return (
        <div className="min-h-screen text-foreground font-mono selection:bg-primary/20 relative bg-background overflow-x-hidden">
            <AnimatedBackground />

            {/* Header (HUD Desktop) */}
            <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-[1400px] h-16 rounded-2xl border border-white/40 dark:border-white/10 bg-white/95 dark:bg-slate-950/90 backdrop-blur-2xl z-50 hidden md:flex items-center justify-between px-6 shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_48px_rgba(0,0,0,0.6)] transition-all duration-300">
                <div className="flex items-center gap-10">
                    <Link href="/" className="group flex items-center gap-3">
                        <div className="relative w-9 h-9 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-primary to-indigo-500 rounded-xl rotate-12 group-hover:rotate-45 transition-transform duration-500 opacity-20 group-hover:opacity-40" />
                            <div className="relative w-8 h-8 bg-background border border-primary/30 rounded-lg flex items-center justify-center text-primary font-black italic shadow-[0_0_20px_rgba(0,240,255,0.25)] group-hover:shadow-[0_0_30px_rgba(0,240,255,0.5)] transition-all">
                                S
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-black dark:text-white font-black tracking-[0.15em] text-sm uppercase">Smmplan</span>
                            <span className="text-[9px] font-bold text-primary tracking-[0.3em] uppercase -mt-0.5">Control System</span>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-black/5 dark:border-white/5">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "px-4 py-2 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-wider transition-all relative group/nav",
                                        isActive
                                            ? "text-primary bg-white dark:bg-slate-900 shadow-sm shadow-black/5 dark:shadow-black/20"
                                            : "text-slate-900 dark:text-slate-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                                    )}
                                >
                                    <item.icon size={12} className={cn("transition-transform duration-300", isActive ? "scale-110" : "group-hover/nav:scale-110")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden lg:flex flex-col items-end gap-0.5 pr-6 border-r border-border/60">
                        <span className="text-[10px] font-black text-slate-900 dark:text-slate-400 tracking-[0.4em] uppercase">Status Check</span>
                        <div className="flex items-center gap-2">
                            <div className="relative w-1.5 h-1.5">
                                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-40" />
                                <div className="relative w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
                            </div>
                            <span className="text-[10px] font-black text-primary tracking-widest italic uppercase">Sync Active</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-black/5 dark:bg-white/5 p-1 rounded-xl">
                            <ThemeToggle />
                            <LanguageToggle />
                        </div>

                        <Link href="/profile">
                            <button className="relative overflow-hidden px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white transition-all group active:scale-95">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-indigo-600 group-hover:scale-110 transition-transform duration-500" />
                                <span className="relative z-10 flex items-center gap-2">
                                    <Terminal size={12} />
                                    {t.tma.terminal_access}
                                </span>
                            </button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="md:pt-24 pb-32 md:pb-16 max-w-[1440px] mx-auto px-6 relative z-10">
                {children}
            </main>

            {/* Mobile Navigation (Premium Floating) */}
            <div className="fixed bottom-6 left-4 right-4 md:hidden z-50 bg-white/95 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/40 dark:border-white/10 rounded-[2rem] shadow-[0_8px_32px_rgba(0,0,0,0.2)] safe-area-bottom">
                <nav className="flex justify-around items-center h-16 px-2">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center justify-center gap-1 transition-all flex-1 h-full",
                                    isActive ? "text-primary" : "text-slate-950 dark:text-slate-400 hover:text-foreground"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-xl transition-all duration-300",
                                    isActive ? "bg-primary/10 shadow-inner" : ""
                                )}>
                                    <item.icon size={20} className={cn(isActive ? "scale-110 active:scale-95" : "")} />
                                </div>
                                <span className="text-[7px] font-black uppercase tracking-[0.2em]">{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="mobile-nav-indicator"
                                        className="absolute -top-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_var(--primary)]"
                                    />
                                )}
                            </Link>
                        );
                    })}
                    <Link
                        href="/profile"
                        className={cn(
                            "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
                            pathname === "/profile" ? "text-primary" : "text-slate-950 dark:text-slate-400 hover:text-foreground"
                        )}
                    >
                        <div className={cn(
                            "p-2 rounded-xl transition-all duration-300",
                            pathname === "/profile" ? "bg-primary/10 shadow-inner" : ""
                        )}>
                            <User size={20} />
                        </div>
                        <span className="text-[7px] font-black uppercase tracking-[0.2em]">Profile</span>
                    </Link>
                </nav>
            </div>
        </div>
    );
};
