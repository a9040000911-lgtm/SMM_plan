"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { MessageSquare, AlertCircle, Clock } from 'lucide-react';
import { UserListItem } from '@/app/admin/support/ticket-actions';

interface UserListItemProps {
    user: UserListItem;
    isSelected: boolean;
    onSelect: (userId: string) => void;
}

function getStatusIndicator(stats: UserListItem['stats'], hasUnread: boolean) {
    if (hasUnread || stats.open > 0) {
        return <div className={`w-2.5 h-2.5 rounded-full ${hasUnread ? 'bg-rose-500 animate-pulse' : 'bg-rose-400'}`} />;
    }
    if (stats.pending > 0) {
        return <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />;
    }
    return <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />;
}

function formatTimeAgo(dateStr: string | undefined): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'сейчас';
    if (diffMins < 60) return `${diffMins} мин`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} ч`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} д`;

    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function UserListItemComponent({ user, isSelected, onSelect }: UserListItemProps) {
    return (
        <button
            onClick={() => onSelect(user.id)}
            className={`w-full p-4 text-left transition-all border-b border-slate-50 ${isSelected
                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                : user.hasUnread
                    ? 'bg-rose-50/30 hover:bg-rose-50/50'
                    : 'hover:bg-slate-50'
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Status indicator */}
                <div className="mt-1.5 shrink-0">
                    {getStatusIndicator(user.stats, user.hasUnread)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Header row */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${user.hasUnread ? 'text-rose-600' : 'text-slate-700'}`}>
                                @{user.username || 'user'}
                            </span>
                            {user.project && (
                                <span
                                    className="px-1.5 py-0.5 rounded-sm text-[8px] font-black uppercase tracking-tighter"
                                    style={{ backgroundColor: `${user.project.color}20`, color: user.project.color }}
                                    title={user.project.name}
                                >
                                    {user.project.name.substring(0, 3)}
                                </span>
                            )}
                        </div>
                        {user.lastActivity && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                                {formatTimeAgo(user.lastActivity.updatedAt)}
                            </span>
                        )}
                    </div>

                    {/* Stats badges */}
                    <div className="flex items-center gap-1.5 mb-1.5">
                        {user.stats.open > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-rose-100 text-rose-600 text-[9px] font-bold">
                                <AlertCircle size={8} />
                                {user.stats.open} новых
                            </span>
                        )}
                        {user.stats.pending > 0 && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm bg-amber-100 text-amber-600 text-[9px] font-bold">
                                <Clock size={8} />
                                {user.stats.pending} ожид.
                            </span>
                        )}
                    </div>

                    {/* Last message preview */}
                    {user.lastActivity && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                            <MessageSquare size={10} className="shrink-0" />
                            <span className="truncate">
                                {user.lastActivity.lastMessageSender === 'USER' ? '👤 ' : '🛡️ '}
                                {user.lastActivity.lastMessage}
                            </span>
                        </div>
                    )}
                </div>

                {/* Unread indicator */}
                {user.hasUnread && (
                    <div className="shrink-0 mt-1">
                        <div className="w-2 h-2 rounded-full bg-rose-500" />
                    </div>
                )}
            </div>
        </button>
    );
}


