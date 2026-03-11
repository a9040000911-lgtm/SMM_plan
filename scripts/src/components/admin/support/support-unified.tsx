"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Search, Users, Inbox } from 'lucide-react';
import {
    getUserListAction,
    getUserConversationAction,
    getTemplatesAndMacrosAction,
    getSupportProjectsAction,
    UserListItem,
    UserConversation
} from '@/app/admin/support/ticket-actions';
import { UserListItemComponent } from '@/components/admin/support/user-list-item';
import { UserConversationPanel } from '@/components/admin/support/user-conversation-panel';

type FilterType = 'active' | 'all';

export function SupportUnified() {
    // State
    const [users, setUsers] = useState<UserListItem[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedConversation, setSelectedConversation] = useState<UserConversation | null>(null);
    const [templates, setTemplates] = useState<Array<{ id: string; title: string; content: string }>>([]);
    const [macros, setMacros] = useState<Array<{ id: string; name: string; actions: any }>>([]);

    const [filter, setFilter] = useState<FilterType>('active');
    const [search, setSearch] = useState('');

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isLoadingConversation, setIsLoadingConversation] = useState(false);

    const [stats, setStats] = useState({ totalUsers: 0, usersWithOpen: 0, usersWithPending: 0 });

    // Project selection
    const [availableProjects, setAvailableProjects] = useState<Array<{ id: string; name: string; color: string; slug: string }>>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const selectedProject = availableProjects.find(p => p.id === selectedProjectId);

    // Reset pagination when filters change
    useEffect(() => {
        setPage(1);
        setUsers([]);
        setIsLoading(true);
        fetchUsers(1, true); // Reset fetch
    }, [filter, search, selectedProjectId]);

    // Fetch user list
    const fetchUsers = useCallback(async (pageNum: number = 1, isReset: boolean = false) => {
        const loadingSetter = isReset ? setIsLoading : setIsLoadingMore;
        loadingSetter(true);
        try {
            const data = await getUserListAction(filter, search, selectedProjectId, pageNum);

            setUsers(prev => isReset ? data.users : [...prev, ...data.users]);
            setHasMore(data.hasMore);
            setStats(data.stats);
        } catch (e) {
            console.error('Failed to fetch users:', e);
        } finally {
            loadingSetter(false);
        }
    }, [filter, search, selectedProjectId]);

    const loadMore = () => {
        if (!hasMore || isLoadingMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchUsers(nextPage, false);
    };

    const fetchProjects = useCallback(async () => {
        try {
            const data = await getSupportProjectsAction();
            setAvailableProjects(data);
        } catch (e) {
            console.error('Failed to fetch projects:', e);
        }
    }, []);

    // Fetch selected user's conversation
    const fetchConversation = useCallback(async (userId: string) => {
        setIsLoadingConversation(true);
        try {
            const data = await getUserConversationAction(userId);
            setSelectedConversation(data);
        } catch (e) {
            console.error('Failed to fetch conversation:', e);
        } finally {
            setIsLoadingConversation(false);
        }
    }, []);

    // Fetch templates and macros
    const fetchTemplatesAndMacros = useCallback(async () => {
        try {
            const data = await getTemplatesAndMacrosAction();
            setTemplates(data.templates);
            setMacros(data.macros);
        } catch (e) {
            console.error('Failed to fetch templates:', e);
        }
    }, []);

    // Initial load static data
    useEffect(() => {
        // fetchUsers is handled by the filter effect
        fetchTemplatesAndMacros();
        fetchProjects();
    }, [fetchTemplatesAndMacros, fetchProjects]);

    // Load conversation when user is selected
    useEffect(() => {
        if (selectedUserId) {
            fetchConversation(selectedUserId);
        } else {
            setSelectedConversation(null);
        }
    }, [selectedUserId, fetchConversation]);

    // Handle user selection
    const handleSelectUser = (userId: string) => {
        setSelectedUserId(userId);
    };

    // Handle conversation update (after sending message or closing ticket)
    const handleConversationUpdated = () => {
        if (selectedUserId) {
            fetchConversation(selectedUserId);
        }
        fetchUsers(1, true); // Refresh list
    };

    // Handle close panel
    const handleClosePanel = useCallback(() => {
        setSelectedUserId(null);
        setSelectedConversation(null);
        fetchUsers(1, true);
    }, [fetchUsers]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Global support shortcuts (work even if no user selected, but not in inputs)
            const isInput = e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement;

            if (!isInput) {
                if (e.altKey && e.key === '1') {
                    e.preventDefault();
                    setFilter('active');
                } else if (e.altKey && e.key === '2') {
                    e.preventDefault();
                    setFilter('all');
                } else if (e.altKey && e.key === 'r') {
                    e.preventDefault();
                    fetchUsers(1, true);
                } else if (e.key === '/') {
                    e.preventDefault();
                    document.querySelector<HTMLInputElement>('input[placeholder*="Поиск по @username"]')?.focus();
                }
            }

            if (!selectedUserId || isInput) return;

            const currentIndex = users.findIndex(u => u.id === selectedUserId);

            if (e.key === 'ArrowUp' && currentIndex > 0) {
                e.preventDefault();
                setSelectedUserId(users[currentIndex - 1].id);
            } else if (e.key === 'ArrowDown' && currentIndex < users.length - 1) {
                e.preventDefault();
                setSelectedUserId(users[currentIndex + 1].id);
            } else if (e.key === 'Escape') {
                handleClosePanel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedUserId, users, handleClosePanel, fetchUsers]);

    // Filter tabs config
    const filterTabs: { key: FilterType; label: string; count: number }[] = [
        { key: 'active', label: 'Активные', count: stats.usersWithOpen + stats.usersWithPending },
        { key: 'all', label: 'Все', count: stats.totalUsers },
    ];

    return (
        <div className="flex gap-4 h-full pb-0 overflow-hidden">
            {/* LEFT PANEL: USER LIST */}
            <div className={`flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden transition-all h-full ${selectedConversation ? 'w-[340px] shrink-0' : 'w-full max-w-md'
                }`}>
                {/* Header */}
                <div
                    className="p-4 border-b border-slate-100 space-y-3 transition-colors duration-300 relative overflow-hidden"
                    style={{
                        background: selectedProject
                            ? `linear-gradient(to right, ${selectedProject.color}08, #ffffff)`
                            : 'linear-gradient(to right, #f8fafc, #ffffff)'
                    }}
                >
                    {selectedProject && (
                        <div
                            className="absolute top-0 left-0 w-full h-1"
                            style={{ backgroundColor: selectedProject.color }}
                        />
                    )}

                    <div className="flex items-center justify-between">
                        <div>
                            <h2
                                className="text-lg font-black uppercase tracking-tight italic flex items-center gap-2"
                                style={{ color: selectedProject ? selectedProject.color : '#1e293b' }}
                            >
                                <Users size={20} className={!selectedProject ? "text-blue-500" : ""} style={{ color: selectedProject ? selectedProject.color : undefined }} />
                                {selectedProject ? selectedProject.name : 'Поддержка'}
                            </h2>
                            <p className="text-[11px] text-slate-500 font-medium leading-tight">
                                {stats.usersWithOpen > 0 && <span className="text-rose-500 font-bold">{stats.usersWithOpen} с новыми</span>}
                                {stats.usersWithOpen > 0 && stats.usersWithPending > 0 && ' • '}
                                {stats.usersWithPending > 0 && <span className="text-amber-500">{stats.usersWithPending} ожидают</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => fetchUsers(1, true)}
                                className="p-2 hover:bg-slate-100 rounded-md transition-colors"
                                disabled={isLoading}
                            >
                                <RefreshCw size={16} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Project Switcher */}
                    {availableProjects.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center">
                            <button
                                onClick={() => setSelectedProjectId(null)}
                                className={`px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all ${!selectedProjectId
                                    ? 'bg-slate-800 text-white shadow-md shadow-slate-200'
                                    : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
                                    }`}
                            >
                                Все
                            </button>
                            {availableProjects.map(p => {
                                const isSelected = selectedProjectId === p.id;
                                return (
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedProjectId(p.id)}
                                        className={`px-2.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-wide transition-all flex items-center gap-1.5 border`}
                                        style={{
                                            backgroundColor: isSelected ? p.color : '#ffffff',
                                            color: isSelected ? '#ffffff' : '#64748b', // White text on selected (assuming contrast), slate on unselected
                                            borderColor: isSelected ? p.color : '#e2e8f0',
                                            textShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.1)' : 'none'
                                        }}
                                    >
                                        {!isSelected && (
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                        )}
                                        {p.name}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Поиск по @username..."
                            className="w-full pl-9 pr-3 py-2 bg-white/80 border border-slate-200 rounded-md text-xs focus:outline-none focus:ring-2 transition-all shadow-sm"
                            style={{
                                '--tw-ring-color': selectedProject ? `${selectedProject.color}30` : 'rgba(59, 130, 246, 0.2)',
                                borderColor: selectedProject ? `${selectedProject.color}40` : undefined
                            } as React.CSSProperties}
                        />
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1 p-1 bg-slate-100/80 rounded-md">
                        {filterTabs.map(tab => {
                            const isActive = filter === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    onClick={() => setFilter(tab.key)}
                                    className={`flex-1 px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wide transition-all flex items-center justify-center gap-1.5 ${isActive
                                        ? 'bg-white shadow-sm ring-1'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    style={{
                                        color: isActive && selectedProject ? selectedProject.color : (isActive ? '#2563eb' : undefined),
                                        '--tw-ring-color': isActive && selectedProject ? selectedProject.color : (isActive ? '#e2e8f0' : undefined),
                                        boxShadow: isActive ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                    } as React.CSSProperties}
                                    title={`Alt + ${tab.key === 'active' ? '1' : '2'}`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span
                                            className={`ml-0.5 px-1.5 rounded text-[8px] font-black`}
                                            style={{
                                                backgroundColor: isActive && selectedProject ? `${selectedProject.color}20` : (isActive ? '#dbeafe' : '#e2e8f0'),
                                                color: isActive && selectedProject ? selectedProject.color : (isActive ? '#1d4ed8' : '#475569')
                                            }}
                                        >
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* User List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {users.length === 0 && !isLoading ? (
                        <div className="p-8 text-center text-slate-400">
                            <Inbox size={40} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Нет пользователей</p>
                            <p className="text-xs mt-1">Выберите другой фильтр</p>
                        </div>
                    ) : (
                        <div className="pb-4">
                            {(() => {
                                // Grouping by date
                                const groups: { [key: string]: UserListItem[] } = {};
                                const today = new Date().toDateString();
                                const yesterday = new Date(Date.now() - 86400000).toDateString();

                                users.forEach(user => {
                                    if (!user.lastActivity) return;
                                    const date = new Date(user.lastActivity.updatedAt).toDateString();
                                    let key = date;
                                    if (date === today) key = 'Сегодня';
                                    else if (date === yesterday) key = 'Вчера';

                                    if (!groups[key]) groups[key] = [];
                                    groups[key].push(user);
                                });

                                // Sort keys: Сегодня, Вчера, then others desc
                                const sortedKeys = Object.keys(groups).sort((a, b) => {
                                    if (a === 'Сегодня') return -1;
                                    if (b === 'Сегодня') return 1;
                                    if (a === 'Вчера') return -1;
                                    if (b === 'Вчера') return 1;
                                    return new Date(b).getTime() - new Date(a).getTime();
                                });

                                return sortedKeys.map(key => (
                                    <div key={key}>
                                        <div className="sticky top-0 z-10 px-4 py-1.5 bg-slate-50/95 backdrop-blur-sm border-y border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest shadow-sm">
                                            {key}
                                        </div>
                                        {groups[key].map(user => (
                                            <UserListItemComponent
                                                key={user.id}
                                                user={user}
                                                isSelected={selectedUserId === user.id}
                                                onSelect={handleSelectUser}
                                            />
                                        ))}
                                    </div>
                                ));
                            })()}

                            {hasMore && (
                                <div className="p-4 pt-2">
                                    <button
                                        onClick={loadMore}
                                        disabled={isLoadingMore}
                                        className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold uppercase tracking-wide rounded-md transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isLoadingMore ? <RefreshCw size={14} className="animate-spin" /> : null}
                                        {isLoadingMore ? 'Загрузка...' : 'Загрузить еще'}
                                    </button>
                                </div>
                            )}

                            {isLoading && users.length === 0 && (
                                <div className="p-8 text-center text-slate-400 text-sm animate-pulse">Загрузка...</div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT PANEL: USER CONVERSATION */}
            {selectedConversation && (
                <div className="flex-1 h-full relative overflow-hidden">
                    <UserConversationPanel
                        conversation={selectedConversation}
                        templates={templates}
                        macros={macros}
                        onUpdated={handleConversationUpdated}
                        onClose={handleClosePanel}
                    />
                </div>
            )}

            {/* Loading state for conversation */}
            {selectedUserId && !selectedConversation && isLoadingConversation && (
                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                    <div className="text-center text-slate-400 animate-pulse">
                        <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
                        <p className="text-sm">Загрузка...</p>
                    </div>
                </div>
            )}

            {/* Empty state when no user selected */}
            {!selectedUserId && users.length > 0 && (
                <div className="flex-1 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center justify-center">
                    <div className="text-center text-slate-400">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-sm font-medium">Выберите пользователя</p>
                        <p className="text-xs mt-1">для просмотра всех его тикетов</p>
                    </div>
                </div>
            )}
        </div>
    );
}
