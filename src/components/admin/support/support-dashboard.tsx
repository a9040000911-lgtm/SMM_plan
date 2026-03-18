"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Pagination } from '@/components/admin/core/pagination';
import { Users, RefreshCw, Search, AlertCircle, MessageSquare, Clock, Check } from 'lucide-react';
import { UserDialogPanel } from '@/components/admin/support/user-dialog';

interface UserWithStats {
    id: string;
    username: string;
    lastActivity: {
        lastMessage: string | null;
        lastMessageSender: string | null;
        timestamp: Date;
    };
    stats: {
        open: number;
        pending: number;
        closed: number;
        hasUnread: boolean;
    };
}

export function SupportDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const PAGE_SIZE = 20;

    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

    const [filter, setFilter] = useState<'active' | 'all'>('active');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [totalOpen, setTotalOpen] = useState(0);
    const [totalPending, setTotalPending] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const currentPage = Number(searchParams.get('page')) || 1;

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('filter', filter);
            if (search) params.set('search', search);
            params.set('page', currentPage.toString());
            params.set('limit', PAGE_SIZE.toString());

            const res = await fetch(`/api/admin/support/users?${params.toString()}`);
            const data = await res.json();
            setUsers(data.users || []);
            setTotalOpen(data.totalWithOpen || 0);
            setTotalPending(data.totalWithPending || 0);
            setTotalPages(data.totalPages || 1);
        } catch (e) {
            console.error('Failed to fetch users:', e);
        } finally {
            setIsLoading(false);
        }
    }, [filter, search, currentPage]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
    };

    const handleClosePanel = () => {
        setSelectedUserId(null);
        fetchUsers();
    };

    return (
        <div className="flex h-[calc(100vh-120px)] gap-6">
            {/* LEFT PANEL: USER LIST */}
            <div className={`flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden transition-all ${selectedUserId ? 'w-1/3' : 'w-full'}`}>
                {/* Header */}
                <div className="p-6 border-b border-slate-100 space-y-4 bg-gradient-to-r from-slate-50 to-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight italic flex items-center gap-3">
                                <Users size={24} className="text-blue-500" />
                                Support Center
                            </h2>
                            <p className="text-xs text-slate-500 font-medium mt-1">
                                {totalOpen > 0 && <span className="text-rose-500 font-bold">{totalOpen} новых</span>}
                                {totalOpen > 0 && totalPending > 0 && ' • '}
                                {totalPending > 0 && <span className="text-amber-500">{totalPending} ожидают</span>}
                            </p>
                        </div>
                        <button
                            onClick={() => fetchUsers()}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                            disabled={isLoading}
                        >
                            <RefreshCw size={18} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                if (currentPage !== 1) router.push('?page=1'); // Reset page on search
                            }}
                            placeholder="Поиск по @username..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl">
                        <button
                            onClick={() => { setFilter('active'); if (currentPage !== 1) router.push('?page=1'); }}
                            className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${filter === 'active' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <AlertCircle size={12} />
                            Активные
                        </button>
                        <button
                            onClick={() => { setFilter('all'); if (currentPage !== 1) router.push('?page=1'); }}
                            className={`flex-1 px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            Все
                        </button>
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Загрузка...</div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                            <p className="text-sm">Нет активных обращений</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {users.map((user) => {
                                const isSelected = selectedUserId === user.id;
                                const hasUnread = user.stats.hasUnread;

                                return (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user.id)}
                                        className={`w-full p-4 text-left transition-all ${isSelected ? 'bg-blue-50' : hasUnread ? 'bg-rose-50/50' : 'hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Avatar */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-sm font-black uppercase ${hasUnread
                                                ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg'
                                                : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {(user.username || 'U').substring(0, 2)}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`font-bold text-sm truncate ${hasUnread ? 'text-rose-600' : 'text-slate-800'}`}>
                                                        @{user.username || 'user'}
                                                    </span>
                                                </div>

                                                {/* Stats Pills */}
                                                <div className="flex items-center gap-1.5 mt-1.5">
                                                    {user.stats.open > 0 && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-100 text-rose-600">
                                                            <AlertCircle size={10} />
                                                            <span className="text-[9px] font-bold">{user.stats.open}</span>
                                                        </div>
                                                    )}
                                                    {user.stats.pending > 0 && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
                                                            <Clock size={10} />
                                                            <span className="text-[9px] font-bold">{user.stats.pending}</span>
                                                        </div>
                                                    )}
                                                    {user.stats.closed > 0 && (
                                                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                                                            <Check size={10} />
                                                            <span className="text-[9px] font-bold">{user.stats.closed}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Last Message Preview */}
                                                <p className="text-[11px] text-slate-400 truncate mt-1.5">
                                                    {user.lastActivity.lastMessageSender === 'USER' ? '👤 ' : '🛡️ '}
                                                    {user.lastActivity.lastMessage || 'Нет сообщений'}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <div className="p-4 border-t border-slate-100">
                        <Pagination totalPages={totalPages} />
                    </div>
                </div>
            </div>

            {/* RIGHT PANEL: USER DIALOG */}
            {selectedUserId && (
                <UserDialogPanel
                    userId={selectedUserId}
                    onClose={handleClosePanel}
                />
            )}
        </div>
    );
}


