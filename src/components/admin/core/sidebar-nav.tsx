'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, type LucideIcon } from 'lucide-react';

interface SidebarNavProps {
    navGroups: {
        title: string;
        items: {
            id: string;
            name: string;
            href: string;
            icon: LucideIcon;
        }[];
    }[];
    allowedTabs?: string[];
    isGlobalAdmin: boolean;
}

export function SidebarNav({ navGroups, isGlobalAdmin, allowedTabs = [] }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto custom-scrollbar pb-6 nav-container">
            {navGroups.map((group, groupIdx) => {
                const visibleItems = isGlobalAdmin
                    ? group.items
                    : group.items.filter(item => allowedTabs.includes(item.id));

                if (visibleItems.length === 0) return null;

                return (
                    <div key={groupIdx} className="space-y-1">
                        <h3 className="px-3 text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">{group.title}</h3>
                        {visibleItems.map(item => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));

                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className={`flex items-center justify-between group px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                                            : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon size={18} className={`transition-colors ${isActive ? 'text-blue-100' : 'text-slate-500 group-hover:text-blue-400'}`} />
                                        {item.name}
                                    </div>
                                    {isActive && (
                                        <ChevronRight size={14} className="text-blue-200" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>
                )
            })}
        </nav>
    );
}
