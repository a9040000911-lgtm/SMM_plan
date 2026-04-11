'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/utils/ui';
import { LogoutButton } from '@/components/admin/core/logout-button';
import {
    LayoutDashboard, ShoppingCart, Users, Briefcase,
    Package, Database, Layers, Tag, Award, MessageSquare, Settings, History,
    ShieldAlert, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, 
    Star, Crown, Rss, Clock, BarChart, Bug, Landmark,
    Scale, Layout
} from 'lucide-react';

import { ProjectSelector } from '@/components/admin/core/project-selector';
import { AdminProvider } from '@/components/admin/core/admin-context';
import { Toaster } from 'sonner';
import { SmmplanLogo } from '@/components/ui/SmmplanLogo';
import { GlobalAdminAlert } from '@/components/admin/core/global-admin-alert';

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
    initialIsCollapsed: boolean;
}

export function LayoutWrapper({
    children,
    user,
    isGlobalAdmin,
    dict: t,
    lang,
    accessibleProjects,
    activeProjectId,
    initialIsCollapsed
}: LayoutWrapperProps) {
    const [isCollapsed, setIsCollapsed] = useState(initialIsCollapsed);
    const pathname = usePathname();

    const toggleCollapse = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        document.cookie = `sidebar-collapsed=${newState}; path=/admin; max-age=31536000`; // 1 year
    };
    
    // Accordion state
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
        'Управление': true,
        'Витрина': true,
        'Финансы': true,
        'Маркетинг': false,
        'Поддержка': false,
        'Система': false,
        'Management': true,
        'Showcase': true,
        'Finance': true,
        'Marketing': false,
        'Support': false,
        'System': false,
    });

    const toggleGroup = (title: string) => {
        setOpenGroups(prev => ({ ...prev, [title]: prev[title] !== false ? false : true }));
    };

    const roleNames: Record<string, string> = {
        'ADMIN': t?.roles?.ADMIN || 'Admin',
        'SUPPORT': t?.roles?.SUPPORT || 'Support',
        'SEO': t?.roles?.SEO || 'SEO',
        'USER': t?.roles?.USER || 'User'
    };

    const nav_sections = t?.nav_sections || {
        management: 'Управление',
        showcase: 'Витрина',
        marketing: 'Маркетинг',
        finance: 'Финансы',
        support: 'Поддержка',
        system: 'Система'
    };

    let navGroups = [
        {
            title: nav_sections.management,
            items: [
                { id: 'dashboard', name: t?.dashboard || 'Панель управления', href: '/admin', icon: LayoutDashboard },
                { id: 'statistics', name: 'Статистика', href: '/admin/analytics/statistics', icon: BarChart },
                { id: 'reports', name: t?.reports || 'Отчеты', href: '/admin/analytics/reports', icon: BarChart },
                { id: 'orders', name: t?.orders || 'Заказы', href: '/admin/orders', icon: ShoppingCart },
                { id: 'users', name: t?.users || 'Пользователи', href: '/admin/users', icon: Users },
                { id: 'employees', name: t?.employees || 'Сотрудники', href: '/admin/employees', icon: Briefcase },
            ]
        },
        {
            title: nav_sections.showcase,
            items: [
                { id: 'services', name: t?.services || 'Услуги', href: '/admin/services', icon: Package },
                { id: 'categories', name: t?.categories || 'Категории', href: '/admin/services/categories', icon: Layers },
                { id: 'providers', name: t?.providers || 'Провайдеры (API)', href: '/admin/providers', icon: Database },
            ]
        },
        {
            title: nav_sections.marketing,
            items: [
                { id: 'marketing', name: 'Контент (Сайт)', href: '/admin/cms', icon: Layout },
                { id: 'legal', name: 'Документы', href: '/admin/legal', icon: Scale },
                { id: 'news', name: t?.news || 'Новости', href: '/admin/news', icon: Rss },
                { id: 'reviews', name: t?.reviews || 'Отзывы', href: '/admin/reviews', icon: Star },
                { id: 'promocodes', name: t?.promocodes || 'Промокоды', href: '/admin/promo-codes', icon: Tag },
                { id: 'loyalty', name: t?.loyalty || 'Лояльность', href: '/admin/loyalty', icon: Crown },
                { id: 'advocacy', name: 'NPS и Опросы', href: '/admin/advocacy/nps', icon: Award },
            ]
        },
        {
            title: nav_sections.finance,
            items: [
                { id: 'finance', name: t?.finance || 'Управление Финансами', href: '/admin/finance', icon: Landmark }
            ]
        },
        {
            title: nav_sections.support,
            items: [
                { id: 'support', name: t?.support || 'Поддержка', href: '/admin/support', icon: MessageSquare },
                { id: 'bug_reports', name: t?.bug_reports || 'Баг-репорты', href: '/admin/support/bug-reports', icon: Bug },
            ]
        },
        {
            title: nav_sections.system,
            items: [
                { id: 'projects', name: t?.projects || 'Проекты', href: '/admin/projects', icon: Settings },
                { id: 'scheduled', name: t?.scheduled || 'Задачи по расписанию', href: '/admin/scheduled', icon: Clock },
                { id: 'logs', name: t?.logs || 'Логи Системы', href: '/admin/logs', icon: History },
                { id: 'security', name: t?.security || 'Безопасность', icon: ShieldAlert, href: '/admin/security' },
                { id: 'settings', name: t?.settings || 'Настройки', href: '/admin/settings', icon: Settings },
            ]
        }
    ];

    if (user.role === 'SUPPORT') {
        const supportGroup = navGroups.find(g => g.title === nav_sections.support);
        const managementGroup = navGroups.find(g => g.title === nav_sections.management);
        const otherGroups = navGroups.filter(g => g.title !== nav_sections.support && g.title !== nav_sections.management);
        
        if (managementGroup) {
            const orders = managementGroup.items.find(i => i.id === 'orders');
            const users = managementGroup.items.find(i => i.id === 'users');
            const dashboard = managementGroup.items.find(i => i.id === 'dashboard');
            managementGroup.items = [orders, users, dashboard].filter(Boolean) as any;
        }

        navGroups = [supportGroup, managementGroup, ...otherGroups].filter(Boolean) as any;
    }

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
                        <SmmplanLogo 
                            textSize="text-xl" 
                            colorMode="white" 
                            showText={!isCollapsed} 
                            className="mb-1" 
                            href="/admin" 
                        />
                        <p className="text-xs text-slate-500 mt-0.5 uppercase tracking-widest font-bold text-[9px] truncate mb-4 pl-1 opacity-70">
                            {t?.title || 'Admin'} — {t?.subtitle || 'Platform'}
                        </p>

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
                        <SmmplanLogo showText={false} iconSize={24} colorMode="white" href="/admin" />
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
                <nav className="flex-1 px-3 space-y-6 mt-4 overflow-y-auto custom-scrollbar pb-20 min-h-0 nav-container overflow-x-hidden">
                    {navGroups.map((group, groupIdx) => {
                        const visibleItems = isGlobalAdmin
                            ? group.items
                            : group.items.filter(item => user.allowedTabs.includes(item.id));

                        if (visibleItems.length === 0) return null;
                        
                        const isOpen = isCollapsed ? true : (openGroups[group.title] !== false);

                        return (
                            <div key={groupIdx} className="space-y-1">
                                <div 
                                    onClick={() => !isCollapsed && toggleGroup(group.title)}
                                    className={cn(
                                        "px-3 mb-2 flex items-center justify-between cursor-pointer group/title transition-all duration-300",
                                        isCollapsed && "h-0 mb-0 opacity-0 overflow-hidden pointer-events-none"
                                    )}
                                >
                                    <h3 className="text-[10px] uppercase font-black tracking-widest text-slate-500 group-hover/title:text-slate-300 transition-colors truncate">
                                        {group.title}
                                    </h3>
                                    {!isCollapsed && (
                                        <ChevronDown size={14} className={cn("text-slate-500 group-hover/title:text-slate-300 transition-transform", isOpen ? "" : "-rotate-90")} />
                                    )}
                                </div>
                                {isOpen && visibleItems.map(item => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;

                                    const hotkeyMap: Record<string, string> = {
                                        'support': 'Alt+H',
                                        'orders': 'Alt+O',
                                        'users': 'Alt+U',
                                        'services': 'Alt+S',
                                        'providers': 'Alt+P',
                                        'dashboard': 'Alt+D'
                                    };

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
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {hotkeyMap[item.id] && (
                                                        <kbd className="text-[10px] font-mono font-medium text-slate-400 bg-slate-700/50 px-1.5 py-0.5 rounded shadow-sm border border-slate-600">
                                                            {hotkeyMap[item.id]}
                                                        </kbd>
                                                    )}
                                                    <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0" />
                                                </div>
                                            )}

                                            {/* Tooltip for collapsed state (simple absolute div) */}
                                            {isCollapsed && (
                                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 border border-slate-700 flex items-center gap-2">
                                                    {item.name}
                                                    {hotkeyMap[item.id] && (
                                                        <span className="text-[9px] text-slate-400 font-mono pl-2 border-l border-slate-700">{hotkeyMap[item.id]}</span>
                                                    )}
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

                {/* Footer / Profile Safe Zone (Hardsized to exactly min-h-16) */}
                <div className={cn("border-t border-slate-800 bg-slate-950 flex flex-shrink-0 items-center transition-all duration-300 overflow-hidden min-h-[4rem]", isCollapsed ? "justify-center p-2 flex-col gap-2" : "justify-between px-4 py-3")}>
                    <div className={cn("flex items-center gap-3 overflow-hidden", isCollapsed ? "flex-col" : "")}>
                        <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs uppercase shrink-0 shadow-md shadow-blue-500/20 border border-blue-500">
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
                    "min-h-screen transition-all duration-300 ease-in-out flex flex-col",
                    isCollapsed ? "pl-20" : "pl-64",
                    // Special handling for support page which sets flex layout
                    pathname.startsWith('/admin/support') ? "h-screen overflow-hidden" : ""
                )}
            >
                {/* Global Critical Alerts */}
                <GlobalAdminAlert />

                {/* We need to replicate the 'support' layout logic here or pass simpler className */}
                <div className={cn(
                    "p-8 max-w-[1600px] mx-auto w-full",
                    pathname.startsWith('/admin/support') && "flex-1 min-h-0 p-6 max-w-none mx-0 h-full"
                )}>
                    {children}<Toaster richColors position='top-right' />
                </div>
            </main>
        </AdminProvider>
    );
}


