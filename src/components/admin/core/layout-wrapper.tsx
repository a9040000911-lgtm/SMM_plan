'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/admin/core/logout-button';
import {
    LayoutDashboard, ShoppingCart, Users, Briefcase,
    Package, Database, Layers, Newspaper, Tag, Award,
    TrendingUp, MessageSquare, BookOpen, Settings, History,
    ShieldAlert, ChevronRight, ChevronsLeft, ChevronsRight,

} from 'lucide-react';

import { ProjectSelector } from '@/components/admin/core/project-selector';
import { AdminProvider } from '@/components/admin/core/admin-context';
import { Toaster } from 'sonner';

interface SidebarUser {
    id: string;
    username: string | null;
    role: string;
    earlyBirdRank: number | null;
    tgId: string; // Passed as string from server
    allowedTabs: string[];
}

interface Project {
    id: string;
    name: string;
    brandColor: string;
}

interface LayoutWrapperProps {
    children: React.ReactNode;
    user: SidebarUser;
    isGlobalAdmin: boolean;
    dict: any; // Using any for dictionary simplicity, or define specific shape
    lang: string;
    accessibleProjects: Project[];
    activeProjectId: string | null;
}

export function LayoutWrapper({
    children,
    user,
    isGlobalAdmin,
    dict: t,
    lang,
    accessibleProjects,
    activeProjectId
}: LayoutWrapperProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();

    // Load preference from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('sidebar-collapsed');
        if (saved) {
            setIsCollapsed(saved === 'true');
        }
    }, []);

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem('sidebar-collapsed', String(newState));
    };

    const roleNames: Record<string, string> = {
        'ADMIN': t?.roles?.ADMIN || 'Admin',
        'SUPPORT': t?.roles?.SUPPORT || 'Support',
        'SEO': t?.roles?.SEO || 'SEO',
        'USER': t?.roles?.USER || 'User'
    };

    const nav_sections = t?.nav_sections || {
        management: 'Management',
        showcase: 'Showcase',
        marketing: 'Marketing',
        finance: 'Finance',
        support: 'Support',
        system: 'System'
    };

    const navGroups = [
        {
            title: nav_sections.management,
            items: [
                { id: 'dashboard', name: t?.dashboard || 'Dashboard', href: '/admin', icon: LayoutDashboard },
                { id: 'orders', name: t?.orders || 'Orders', href: '/admin/orders', icon: ShoppingCart },
                { id: 'users', name: t?.users || 'Users', href: '/admin/users', icon: Users },
                { id: 'employees', name: t?.employees || 'Employees', href: '/admin/employees', icon: Briefcase },
            ]
        },
        {
            title: nav_sections.showcase,
            items: [
                { id: 'services', name: t?.services || 'Services', href: '/admin/services', icon: Package },
                { id: 'categories', name: t?.categories || 'Categories', href: '/admin/services/categories', icon: Layers },
                { id: 'providers', name: t?.providers || 'Providers', href: '/admin/providers', icon: Database },
            ]
        },
        {
            title: nav_sections.marketing,
            items: [
                { id: 'marketing', name: t?.marketing || 'Marketing', href: '/admin/content', icon: Newspaper },
                { id: 'promocodes', name: t?.promocodes || 'Promo Codes', href: '/admin/promo-codes', icon: Tag },
                { id: 'advocacy', name: t?.advocacy || 'Advocacy', href: '/admin/advocacy/nps', icon: Award },
            ]
        },
        {
            title: nav_sections.finance,
            items: [
                { id: 'finance', name: t?.finance || 'Finance', href: '/admin/finance', icon: TrendingUp },
            ]
        },
        {
            title: nav_sections.support,
            items: [
                { id: 'support', name: t?.support || 'Support', href: '/admin/support', icon: MessageSquare },
                { id: 'kb', name: t?.knowledge_base || 'Knowledge Base', href: '/admin/knowledge-base', icon: BookOpen },
            ]
        },
        {
            title: nav_sections.system,
            items: [
                { id: 'projects', name: t?.projects || 'Projects', href: '/admin/projects', icon: Settings },
                { id: 'logs', name: t?.logs || 'Logs', href: '/admin/logs', icon: History },
                { id: 'security', name: t?.security || 'Security', icon: ShieldAlert, href: '/admin/security' },
                { id: 'settings', name: t?.settings || 'Settings', href: '/admin/settings', icon: Settings },
            ]
        }
    ];

    return (
        <AdminProvider
            initialProjectId={activeProjectId}
            initialProjects={accessibleProjects as any}
        >
            {/* Sidebar */}
            <aside
                className={cn(
                    "h-screen bg-slate-900 text-white flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50 transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-20" : "w-64"
                )}
            >
                {/* Header */}
                <div className={cn("flex flex-col items-center justify-center p-4 h-20 relative transition-all duration-300", isCollapsed ? "px-2" : "px-6 items-start")}>
                    <div className={cn("overflow-hidden transition-all duration-300 whitespace-nowrap", isCollapsed ? "w-0 opacity-0 absolute" : "w-full opacity-100")}>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent truncate">
                            SMMPlan — {t?.title || 'Admin'}
                        </h1>
                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold text-[10px] truncate mb-3">{t?.subtitle || 'Platform Management'}</p>

                        {/* Project Selection UI */}
                        {!isCollapsed && (
                            <ProjectSelector
                                allProjects={accessibleProjects}
                                currentProjectId={activeProjectId}
                            />
                        )}
                    </div>

                    {/* Logo Icon when collapsed */}
                    <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-300", isCollapsed ? "opacity-100 scale-100" : "opacity-0 scale-50 pointer-events-none")}>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">S</span>
                    </div>

                    {/* Toggle Button */}
                    <button
                        onClick={toggleCollapse}
                        className={cn(
                            "absolute -right-3 top-8 w-6 h-6 bg-slate-800 border border-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-50 shadow-md",
                            isCollapsed ? "right-1/2 translate-x-1/2 -bottom-3 top-auto rotate-90" : "" // Vertical toggle style for collapsed? No, standard side toggle is better
                        )}
                        style={isCollapsed ? { top: 'auto', bottom: '1rem', right: '50%', transform: 'translateX(50%)' } : {}}
                    >
                        {isCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 space-y-6 mt-4 overflow-y-auto custom-scrollbar pb-6 nav-container overflow-x-hidden">
                    {navGroups.map((group, groupIdx) => {
                        const visibleItems = isGlobalAdmin
                            ? group.items
                            : group.items.filter(item => user.allowedTabs.includes(item.id));

                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={groupIdx} className="space-y-1">
                                <h3 className={cn(
                                    "px-3 text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2 transition-all duration-300 truncate",
                                    isCollapsed && "text-center text-[0px] h-0 mb-0 opacity-0" // Hide titles when collapsed
                                )}>
                                    {group.title}
                                </h3>
                                {visibleItems.map(item => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    return (
                                        <Link
                                            key={item.id}
                                            href={item.href}
                                            title={isCollapsed ? item.name : undefined}
                                            className={cn(
                                                "flex items-center group px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-slate-800 transition-all duration-200 text-slate-300 hover:text-white relative",
                                                isActive && "bg-slate-800 text-white",
                                                isCollapsed ? "justify-center px-2" : "justify-between"
                                            )}
                                        >
                                            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
                                                <Icon size={20} className={cn("text-slate-400 group-hover:text-blue-400 transition-colors shrink-0", isActive && "text-blue-400")} />
                                                <span className={cn("transition-all duration-300 whitespace-nowrap overflow-hidden", isCollapsed ? "w-0 opacity-0 hidden" : "w-auto opacity-100")}>
                                                    {item.name}
                                                </span>
                                            </div>

                                            {!isCollapsed && (
                                                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0" />
                                            )}

                                            {/* Tooltip for collapsed state (simple absolute div) */}
                                            {isCollapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700">
                                                    {item.name}
                                                </div>
                                            )}

                                        </Link>
                                    )
                                })}
                                {/* Separator for groups if collapsed */}
                                {isCollapsed && groupIdx < navGroups.length - 1 && (
                                    <div className="h-px bg-slate-800 w-8 mx-auto my-2" />
                                )}
                            </div>
                        )
                    })}
                </nav>

                {/* Footer / Profile */}
                <div className={cn("border-t border-slate-800 bg-slate-950/50 flex items-center transition-all duration-300 overflow-hidden", isCollapsed ? "justify-center p-2 flex-col gap-2" : "justify-between p-4")}>
                    <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed ? "flex-col" : "")}>
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                            {user.username?.substring(0, 2) || (lang === 'ru' ? 'АД' : 'AD')}
                        </div>

                        <div className={cn("flex flex-col overflow-hidden transition-all duration-300", isCollapsed ? "w-0 h-0 opacity-0" : "w-auto opacity-100")}>
                            <span className="text-sm font-medium truncate">@{user.username || 'admin'}</span>
                            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">
                                {roleNames[user.role] || user.role}
                            </span>
                        </div>
                    </div>

                    <div className={cn("transition-all", isCollapsed ? "pb-2" : "")}>
                        <LogoutButton />
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <main
                className={cn(
                    "min-h-screen transition-all duration-300 ease-in-out",
                    isCollapsed ? "pl-20" : "pl-64",
                    // Special handling for support page which sets flex layout
                    pathname.startsWith('/admin/support') ? "h-screen flex flex-col overflow-hidden" : ""
                )}
            >
                {/* We need to replicate the 'support' layout logic here or pass simpler className */}
                <div className={cn(
                    "p-8 max-w-[1600px] mx-auto",
                    pathname.startsWith('/admin/support') && "flex-1 min-h-0 p-6 max-w-none mx-0 h-full"
                )}>
                    {children}<Toaster richColors position='top-right' />
                </div>
            </main>
        </AdminProvider>
    );
}
