'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home, Globe, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdmin } from '@/components/admin/core/admin-context';
import { ProjectSelector } from './project-selector';

interface Breadcrumb {
    label: string;
    href: string;
}

interface AdminHeaderProps {
    title?: string;
    subtitle?: string;
    projectId?: string | null;
    projects?: Array<{ id: string, name: string, brandColor: string }>;
    rightElement?: React.ReactNode;
}

export function AdminHeader({ title, subtitle, projectId: propProjectId, projects: propProjects, rightElement }: AdminHeaderProps) {
    const pathname = usePathname();
    const context = useAdmin();

    const activeProjectId = propProjectId || context.activeProjectId;
    const allProjects = propProjects || context.projects;

    const currentProject = allProjects?.find(p => p.id === activeProjectId);
    const isGlobal = activeProjectId === 'all' || !activeProjectId;

    // Generate breadcrumbs from pathname
    const generateBreadcrumbs = (): Breadcrumb[] => {
        const paths = pathname.split('/').filter(Boolean);
        const breadcrumbs: Breadcrumb[] = [];

        let currentHref = '';
        // eslint-disable-next-line unused-imports/no-unused-vars
        paths.forEach((path, index) => {
            currentHref += `/${path}`;

            // Skip numeric IDs or UUIDs from breadcrumb labels but keep them in path
            const isId = /^\d+$/.test(path) || path.length > 20;

            let label = path.charAt(0).toUpperCase() + path.slice(1);

            // Custom labels
            if (path === 'admin') label = 'Главная';
            if (path === 'services') label = 'Услуги';
            if (path === 'orders') label = 'Заказы';
            if (path === 'users') label = 'Пользователи';
            if (path === 'providers') label = 'Провайдеры';
            if (path === 'settings') label = 'Настройки';
            if (path === 'finance') label = 'Финансы';
            if (path === 'support') label = 'Поддержка';

            if (isId) {
                label = `#${path.slice(-6).toUpperCase()}`;
            }

            breadcrumbs.push({ label, href: currentHref });
        });

        return breadcrumbs;
    };

    const breadcrumbs = generateBreadcrumbs();

    return (
        <div className="mb-8 space-y-4">
            {/* Top Bar: Breadcrumbs & Project Indicator */}
            <div className="flex items-center justify-between">
                <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Link href="/admin" className="hover:text-blue-600 transition-colors flex items-center gap-1">
                        <Home size={12} />
                    </Link>
                    {breadcrumbs.map((bc, i) => (
                        <React.Fragment key={bc.href}>
                            <ChevronRight size={10} className="text-slate-300" />
                            <Link
                                href={bc.href}
                                className={cn(
                                    "hover:text-blue-600 transition-colors",
                                    i === breadcrumbs.length - 1 ? "text-slate-600" : ""
                                )}
                            >
                                {bc.label}
                            </Link>
                        </React.Fragment>
                    ))}
                </nav>

                {/* Project Context Badge / Selector */}
                <div className="flex items-center gap-3">
                    {/* Project Selector (Dropdown version) */}
                    {allProjects && allProjects.length > 0 && activeProjectId && (
                        <div className="w-56">
                            <ProjectSelector
                                allProjects={allProjects as any}
                                currentProjectId={activeProjectId}
                            />
                        </div>
                    )}

                    {/* Simple badge fallback / current indicator */}
                    {!activeProjectId && (
                        <div className={cn(
                            "px-4 py-1.5 rounded-full flex items-center gap-2 border shadow-sm transition-all",
                            isGlobal
                                ? "bg-slate-900 border-slate-800 text-white"
                                : "bg-white border-blue-100 text-blue-600"
                        )}>
                            {isGlobal ? (
                                <>
                                    <Globe size={12} className="text-blue-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Global Master Mode</span>
                                </>
                            ) : (
                                <>
                                    <Briefcase size={12} className="text-blue-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest truncate max-w-[150px]">
                                        Project: {currentProject?.name || 'Local Context'}
                                    </span>
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: currentProject?.brandColor || '#3b82f6' }}
                                    />
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Title Area */}
            {(title || rightElement) && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
                    <div>
                        {title && (
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic leading-none">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {rightElement && (
                        <div className="flex items-center gap-3">
                            {rightElement}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
