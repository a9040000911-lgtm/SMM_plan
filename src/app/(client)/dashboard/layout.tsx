'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, CreditCard, Headphones, Settings, Sparkles, LogOut, Key, Users, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from 'next-auth/react';
import { motion } from 'framer-motion';

const navItems = [
    { name: 'Обзор', href: '/dashboard', icon: Sparkles },
    { name: 'Каталог', href: '/catalog', icon: LayoutDashboard },
    { name: 'Заказы', href: '/dashboard/orders', icon: Package },
    { name: 'Расписание', href: '/dashboard/scheduled', icon: Clock },
    { name: 'Финансы', href: '/dashboard/transactions', icon: CreditCard },
    { name: 'Партнерка', href: '/dashboard/referrals', icon: Users },
    { name: 'Поддержка', href: '/dashboard/support', icon: Headphones },
];

const secondaryNav = [
    { name: 'API', href: '/dashboard/api', icon: Key },
    { name: 'Профиль', href: '/dashboard/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50 selection:bg-blue-600/10 relative overflow-hidden flex flex-col">
            {/* Ambient Backdrops */}
            <div className="fixed top-0 right-0 w-[60%] h-[1000px] bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.05)_0%,transparent_70%)] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[40%] h-[800px] bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05)_0%,transparent_70%)] pointer-events-none" />

            <div className="flex flex-col lg:flex-row max-w-[1536px] mx-auto w-full lg:px-6 py-6 lg:py-10 gap-6 lg:gap-8 relative z-10 flex-1">
                <DesktopSidebar />
                <MobileHeader />

                <main className="flex-1 w-full px-4 lg:px-0 mt-20 lg:mt-0 pb-32 lg:pb-0">
                    {children}
                </main>
            </div>

            <MobileBottomNav />
        </div>
    );
}

function DesktopSidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden lg:flex flex-col w-64 shrink-0 sticky top-10 self-start h-[calc(100vh-5rem)] border-r border-slate-200/50 pr-6">
            <div className="mb-10 px-4">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="w-11 h-11 bg-slate-950 rounded-2xl flex items-center justify-center shadow-2xl shadow-slate-200 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles className="text-white w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-lg font-black tracking-tighter text-slate-900 leading-none uppercase italic">
                            Smm<span className="text-blue-600">plan</span>
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">v3 Premium</span>
                    </div>
                </Link>
            </div>

            <nav className="flex flex-col gap-1.5">
                <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest px-4 mb-2 opacity-30">Консоль</div>
                {[...navItems, ...secondaryNav].map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "group relative flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all duration-400",
                                isActive
                                    ? "bg-slate-950 text-white shadow-[0_15px_30px_-10px_rgba(0,0,0,0.15)] scale-[1.02]"
                                    : "text-slate-600/90 hover:text-slate-950 hover:bg-white border border-transparent hover:border-slate-100"
                            )}
                        >
                            <Icon size={18} className={cn(
                                "transition-all duration-300",
                                isActive ? "text-blue-500" : "group-hover:text-blue-600"
                            )} />
                            {item.name}

                            {isActive && (
                                <motion.div
                                    layoutId="nav-active-pill"
                                    className="absolute right-4 w-1.5 h-1.5 bg-blue-500 rounded-full"
                                />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto pt-8 border-t border-slate-200/50 px-2">
                <div className="bg-white border border-slate-100 rounded-3xl p-6 mb-8 shadow-sm">
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-slate-900 uppercase">System Optimal</span>
                    </div>
                    <Link href="/dashboard/support">
                        <button className="w-full py-3 bg-slate-50 text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                            Помощь
                        </button>
                    </Link>
                </div>

                <button
                    onClick={() => signOut()}
                    className="w-full flex items-center gap-4 px-6 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-rose-600 rounded-2xl transition-all group"
                >
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    Выход
                </button>
            </div>
        </aside>
    );
}

function MobileHeader() {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-[100] lg:hidden flex items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-950 rounded-xl flex items-center justify-center">
                    <Sparkles className="text-white w-4 h-4" />
                </div>
                <span className="text-sm font-black tracking-tighter text-slate-900 uppercase italic">
                    Smm<span className="text-blue-600">plan</span>
                </span>
            </Link>

            <Link href="/dashboard/settings">
                <div className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                    <Settings size={18} />
                </div>
            </Link>
        </header>
    );
}

function MobileBottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-2xl border-t border-slate-100 px-4 py-3 pb-8 z-[100] lg:hidden">
            <div className="max-w-md mx-auto flex items-center justify-between">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    const Icon = item.icon;

                    return (
                        <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-1.5 group">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                isActive ? "bg-slate-950 text-white shadow-lg" : "text-slate-400"
                            )}>
                                <Icon size={20} />
                            </div>
                            <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest",
                                isActive ? "text-slate-900" : "text-slate-400"
                            )}>
                                {item.name}
                            </span>
                            {isActive && (
                                <motion.div layoutId="mobile-active-pill" className="absolute -top-1 w-1 h-1 bg-blue-500 rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
