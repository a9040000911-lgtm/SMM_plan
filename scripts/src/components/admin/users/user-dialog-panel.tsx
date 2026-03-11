'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { X, RefreshCw, AlertCircle, Clock, Check, MessageSquare, Plus } from 'lucide-react';
import { TicketSection } from '@/components/admin/support/ticket-section';
import { NewTicketModal } from '@/components/admin/support/new-ticket-modal';
import { formatAmount } from '@/utils/formatter';
import { SupportUser, SupportTicket, SupportTemplate } from '@/types/support';

interface UserDialogPanelProps {
    userId: string;
    onClose: () => void;
}

export function UserDialogPanel({ userId, onClose }: UserDialogPanelProps) {
    const [user, setUser] = useState<SupportUser | null>(null);
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [stats, setStats] = useState({ total: 0, open: 0, pending: 0, closed: 0 });
    const [templates, setTemplates] = useState<SupportTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
    const [showClosed, setShowClosed] = useState(false);
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);

    const fetchUserDialog = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/support/user-dialog/${userId}`);
            const data = await res.json();
            setUser(data.user);
            setTickets(data.tickets);
            setStats(data.stats);
            setTemplates(data.templates || []);

            // Auto-expand first open ticket
            const firstOpen = data.tickets.find((t: SupportTicket) => t.status === 'OPEN');
            if (firstOpen) {
                setExpandedTickets(new Set([firstOpen.id]));
            }
        } catch (e) {
            console.error('Failed to load dialog:', e);
        } finally {
            setIsLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUserDialog();
    }, [fetchUserDialog]);

    const toggleTicket = (ticketId: string) => {
        setExpandedTickets(prev => {
            const next = new Set(prev);
            if (next.has(ticketId)) {
                next.delete(ticketId);
            } else {
                next.add(ticketId);
            }
            return next;
        });
    };

    const activeTickets = tickets.filter(t => t.status !== 'CLOSED');
    const closedTickets = tickets.filter(t => t.status === 'CLOSED');

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-white rounded-[2.5rem] border border-slate-200">
                <div className="animate-pulse text-slate-400">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-right-4 duration-200 relative">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-black text-xl shadow-lg">
                            {(user?.username || 'U').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800">@{user?.username || 'user'}</h2>
                            <p className="text-xs text-slate-500">
                                Баланс: {formatAmount(user?.balance || 0)}₽ • Потрачено: {formatAmount(user?.spent || 0)}₽
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => fetchUserDialog()}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <RefreshCw size={18} className="text-slate-400" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600">
                        <AlertCircle size={14} />
                        <span className="text-xs font-bold">{stats.open} открытых</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-600">
                        <Clock size={14} />
                        <span className="text-xs font-bold">{stats.pending} ожидают</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-500">
                        <Check size={14} />
                        <span className="text-xs font-bold">{stats.closed} решено</span>
                    </div>
                </div>
            </div>

            {/* Ticket Sections */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {/* Active Tickets */}
                {activeTickets.length === 0 && closedTickets.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Нет обращений от этого пользователя</p>
                    </div>
                ) : (
                    <>
                        {activeTickets.map(ticket => (
                            <TicketSection
                                key={ticket.id}
                                ticket={ticket}
                                isExpanded={expandedTickets.has(ticket.id)}
                                onToggle={() => toggleTicket(ticket.id)}
                                onRefresh={fetchUserDialog}
                                templates={templates}
                            />
                        ))}

                        {/* Closed Tickets Toggle */}
                        {closedTickets.length > 0 && (
                            <div className="pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setShowClosed(!showClosed)}
                                    className="w-full py-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showClosed ? '▲ Скрыть решенные' : `▼ Показать ${closedTickets.length} решенных обращений`}
                                </button>

                                {showClosed && (
                                    <div className="space-y-4 mt-4">
                                        {closedTickets.map(ticket => (
                                            <TicketSection
                                                key={ticket.id}
                                                ticket={ticket}
                                                isExpanded={expandedTickets.has(ticket.id)}
                                                onToggle={() => toggleTicket(ticket.id)}
                                                onRefresh={fetchUserDialog}
                                                templates={templates}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Quick New Ticket Button */}
            <div className="p-4 border-t border-slate-100 bg-slate-50">
                <button
                    className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                    onClick={() => setIsCreatingTicket(true)}
                >
                    <Plus size={18} />
                    Начать новый тикет
                </button>
            </div>

            {/* New Ticket Modal */}
            <NewTicketModal
                userId={userId}
                isOpen={isCreatingTicket}
                onClose={() => setIsCreatingTicket(false)}
                onSuccess={fetchUserDialog}
            />
        </div>
    );
}
