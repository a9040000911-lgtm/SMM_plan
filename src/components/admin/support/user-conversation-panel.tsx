"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Send, Loader2, Zap, Clock, Check, User, MessageSquare, Inbox, ExternalLink, FileText, PanelRight } from 'lucide-react';
import { UserConversation, UserOrder } from '@/app/admin/support/ticket-actions';
import { replyToTicketAction, closeTicketAction } from '@/app/admin/support/actions';
import { warnUserAction, banUserAction, unbanUserAction } from '@/app/admin/support/moderation-actions';
import { AdvancedTicketSection } from './advanced-ticket-section';

interface UserConversationPanelProps {
    conversation: UserConversation;
    templates: Array<{ id: string; title: string; content: string }>;
    macros: Array<{ id: string; name: string; actions: any }>;
    onUpdated: () => void;
    onClose: () => void;
}

export function UserConversationPanel({ conversation, templates, macros: _macros, onUpdated, onClose }: UserConversationPanelProps) {
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);
    const [newTicketSubject, setNewTicketSubject] = useState('Обращение от поддержки');
    const [newTicketMessage, setNewTicketMessage] = useState('');
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [orderIdCopied, setOrderIdCopied] = useState<string | null>(null);
    const [activeSidebarTab, setActiveSidebarTab] = useState<'orders' | 'profile'>('orders');
    const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

    // Keyboard shortcuts for panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                const textareas = document.querySelectorAll('textarea');
                if (textareas.length > 0) {
                    (textareas[textareas.length - 1] as HTMLTextAreaElement).focus();
                }
            } else if (e.altKey && (e.key === 'q' || e.key === 'й')) {
                e.preventDefault();
                onClose();
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!conversation?.user?.id) return;
            setIsLoadingOrders(true);
            try {
                const { getLatestUserOrdersAction } = await import('@/app/admin/support/ticket-actions');
                const data = await getLatestUserOrdersAction(conversation.user.id);
                setOrders(data);
            } catch (e) {
                console.error('Failed to fetch orders:', e);
            } finally {
                setIsLoadingOrders(false);
            }
        };
        fetchOrders();
    }, [conversation.user.id]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleReply = async (ticketId: string, text: string) => {
        await replyToTicketAction(ticketId, text);
        onUpdated();
    };

    const handleCloseTicket = async (ticketId: string) => {
        await closeTicketAction(ticketId);
        onUpdated();
    };

    const handleCreateNewTicket = async () => {
        if (!newTicketMessage.trim() || isCreatingTicket) return;
        setIsCreatingTicket(true);
        try {
            const { createTicketByAdminAction } = await import('@/app/admin/support/actions');
            await createTicketByAdminAction(conversation.user.id, newTicketSubject, newTicketMessage);
            setShowNewTicketForm(false);
            setNewTicketSubject('Обращение от поддержки');
            setNewTicketMessage('');
            onUpdated();
        } catch (e) {
            console.error('Failed to create ticket:', e);
            alert('Ошибка при создании тикета');
        } finally {
            setIsCreatingTicket(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm animate-in zoom-in-95 duration-300 h-full overflow-hidden">
            {/* Header / Compact Profile */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
                <div className="flex items-center justify-between">
                    <div className="min-w-0 flex items-center gap-3">
                        <Link
                            href={`/admin/users/${conversation.user.id}`}
                            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-slate-200 hover:scale-105 active:scale-95 transition-transform"
                            style={{
                                backgroundColor: conversation.user.project ? `${conversation.user.project.color}20` : '#dbeafe',
                                color: conversation.user.project?.color || '#2563eb'
                            }}
                        >
                            <User size={20} />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <Link href={`/admin/users/${conversation.user.id}`} className="text-base font-black text-slate-800 hover:text-blue-600 transition-colors tracking-tight">
                                    @{conversation.user.username || 'user'}
                                </Link>
                                {conversation.user.project && (
                                    <span
                                        className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border"
                                        style={{ backgroundColor: `${conversation.user.project.color}10`, color: conversation.user.project.color, borderColor: `${conversation.user.project.color}30` }}
                                    >
                                        {conversation.user.project.name}
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                                <span>ID: {conversation.user.tgId}</span>
                                <button
                                    onClick={() => copyToClipboard(conversation.user.tgId || '')}
                                    className={`hover:text-slate-600 transition-colors ${isCopied ? 'text-green-500' : ''}`}
                                    title="Копировать TG ID"
                                >
                                    {isCopied ? <Check size={10} /> : <FileText size={10} />}
                                </button>
                                <span className="mx-1">•</span>
                                <span className="flex items-center gap-1" title="Активных тикетов">
                                    <MessageSquare size={10} /> {conversation.tickets.length}
                                </span>
                                {(conversation.user as any).warningCount > 0 && (
                                    <span className="text-orange-500 ml-2" title="Предупреждения">⚠️ {(conversation.user as any).warningCount}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNewTicketForm(!showNewTicketForm)}
                            className="px-4 py-2 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-slate-200 transition-colors shadow-sm flex items-center gap-1.5"
                        >
                            {showNewTicketForm ? <X size={12} /> : <Zap size={12} />}
                            {showNewTicketForm ? 'Отмена' : 'Написать'}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 border border-slate-200 bg-white text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 rounded-md transition-all active:scale-95"
                            title="Закрыть панель (Alt+Q)"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-start min-h-0 overflow-hidden bg-slate-50/50">
                {/* Main Content: Tickets */}
                <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar h-full">
                    {/* New Ticket Form */}
                    {showNewTicketForm && (
                        <div className="bg-white border border-blue-200 shadow-sm rounded-lg p-4 animate-in slide-in-from-top-4 duration-300">
                            <input
                                type="text"
                                value={newTicketSubject}
                                onChange={(e) => setNewTicketSubject(e.target.value)}
                                placeholder="Тема тикета"
                                className="w-full mb-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                            />
                            <textarea
                                value={newTicketMessage}
                                onChange={(e) => setNewTicketMessage(e.target.value)}
                                placeholder="Новое сообщение пользователю... (Отправить: Ctrl+Enter)"
                                className="w-full mb-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-none font-medium"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        handleCreateNewTicket();
                                    }
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={handleCreateNewTicket}
                                    disabled={!newTicketMessage.trim() || isCreatingTicket}
                                    className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5 uppercase tracking-widest shadow-md"
                                >
                                    {isCreatingTicket ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                    Создать тикет
                                </button>
                            </div>
                        </div>
                    )}

                    {conversation.tickets.length === 0 ? (
                        <div className="text-center text-slate-400 py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Нет активных переписок</p>
                            <button
                                onClick={() => setShowNewTicketForm(true)}
                                className="mt-4 px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-black rounded-md hover:bg-slate-200 transition-all uppercase tracking-widest"
                            >
                                Написать пользователю
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {conversation.tickets.map((ticket) => (
                                <AdvancedTicketSection
                                    key={ticket.id}
                                    ticket={ticket}
                                    templates={templates}
                                    macros={_macros || []}
                                    onReply={handleReply}
                                    onClose={handleCloseTicket}
                                    onUpdated={onUpdated}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Context Panel: Collapsible (Variant A - collapsed by default) */}
                <div className={`border-l border-slate-100 bg-white shrink-0 flex flex-col h-full overflow-hidden transition-all duration-300 ${isSidebarExpanded ? 'w-72' : 'w-12'}`}>
                    {/* Collapsed: icon strip */}
                    {!isSidebarExpanded ? (
                        <div className="flex flex-col items-center py-3 gap-2">
                            <button
                                onClick={() => { setActiveSidebarTab('orders'); setIsSidebarExpanded(true); }}
                                className="p-2.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                title="Заказы пользователя"
                            >
                                <Clock size={16} />
                            </button>
                            <button
                                onClick={() => { setActiveSidebarTab('profile'); setIsSidebarExpanded(true); }}
                                className="p-2.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                title="Профиль и модерация"
                            >
                                <User size={16} />
                            </button>
                            <div className="w-6 border-t border-slate-100 my-1" />
                            <button
                                onClick={() => setIsSidebarExpanded(true)}
                                className="p-2.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-all"
                                title="Развернуть панель"
                            >
                                <PanelRight size={16} />
                            </button>
                        </div>
                    ) : (
                        /* Expanded: full sidebar */
                        <>
                            <div className="flex border-b border-slate-100 bg-slate-50/80">
                                <button
                                    onClick={() => setActiveSidebarTab('orders')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeSidebarTab === 'orders' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <span className="flex items-center justify-center gap-2"><Clock size={12}/> Заказы</span>
                                </button>
                                <button
                                    onClick={() => setActiveSidebarTab('profile')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${activeSidebarTab === 'profile' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                >
                                    <span className="flex items-center justify-center gap-2"><User size={12}/> Профиль</span>
                                </button>
                                <button
                                    onClick={() => setIsSidebarExpanded(false)}
                                    className="px-2 py-3 text-slate-300 hover:text-slate-500 transition-colors"
                                    title="Свернуть панель"
                                >
                                    <X size={14} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                                {activeSidebarTab === 'orders' && (
                                    <>
                                        {isLoadingOrders ? (
                                            <div className="space-y-3">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-16 bg-slate-50 rounded-md animate-pulse" />
                                                ))}
                                            </div>
                                        ) : orders.length === 0 ? (
                                            <div className="text-center py-8">
                                                <Inbox size={24} className="mx-auto mb-2 text-slate-200" />
                                                <p className="text-xs text-slate-400 font-medium tracking-tight">Заказов пока нет</p>
                                            </div>
                                        ) : (
                                            orders.map(order => (
                                                <div key={order.id} className="group p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-sm">
                                                    <div className="flex items-start justify-between mb-1.5">
                                                        <div className="text-[10px] font-black text-slate-700 truncate max-w-[140px]" title={order.serviceName}>
                                                            {order.serviceName}
                                                        </div>
                                                        <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                            order.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                                order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                                    'bg-rose-50 text-rose-700 border-rose-100'
                                                            }`}>
                                                            {order.status}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-[11px] mb-2">
                                                        <div className="font-black text-slate-900">{order.amount}₽</div>
                                                        <div className="text-[9px] text-slate-400 font-bold tabular-nums">
                                                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-1">
                                                        <a
                                                            href={`/admin/orders/${order.id}`}
                                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white text-slate-500 border border-slate-100 rounded-md text-[9px] font-black uppercase hover:border-slate-200 hover:bg-slate-50 transition-all"
                                                        >
                                                            <FileText size={10} />
                                                            ID: {order.id}
                                                        </a>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(order.id.toString());
                                                                setOrderIdCopied(order.id.toString());
                                                                setTimeout(() => setOrderIdCopied(null), 2000);
                                                            }}
                                                            className={`px-2 py-1.5 rounded-md transition-all border ${orderIdCopied === order.id.toString()
                                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                                : 'bg-white text-slate-300 border-slate-100 hover:border-slate-200'
                                                                }`}
                                                            title="Копировать ID"
                                                        >
                                                            <Check size={10} />
                                                        </button>
                                                        <a
                                                            href={order.link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors border border-blue-100/50"
                                                            title="Открыть ссылку"
                                                        >
                                                            <ExternalLink size={10} />
                                                        </a>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </>
                                )}

                                {activeSidebarTab === 'profile' && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Финансовая сводка</div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                    <div className="text-[10px] text-slate-500 mb-0.5">Баланс</div>
                                                    <div className="text-sm font-black text-blue-600">{Number(conversation.user.balance).toFixed(2)}₽</div>
                                                </div>
                                                <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                                                    <div className="text-[10px] text-slate-500 mb-0.5">LTV (Траты)</div>
                                                    <div className="text-sm font-black text-rose-600">{Number(conversation.user.spent).toFixed(2)}₽</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Модерация аккаунта</div>
                                            <div className="flex flex-col gap-2">
                                                {((conversation.user as any).isPermanentlyBanned || ((conversation.user as any).banExpiresAt && new Date((conversation.user as any).banExpiresAt) > new Date())) ? (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm('Разблокировать пользователя и сбросить предупреждения?')) {
                                                                await unbanUserAction(conversation.user.id);
                                                                onUpdated();
                                                            }
                                                        }}
                                                        className="w-full py-2 bg-green-50 text-green-600 text-xs font-black uppercase tracking-widest border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                                                    >
                                                        Снять бан
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={async () => {
                                                                const reason = prompt('Причина предупреждения:');
                                                                if (reason) {
                                                                    await warnUserAction(conversation.user.id, reason);
                                                                    onUpdated();
                                                                }
                                                            }}
                                                            className="w-full py-2 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-200 rounded-md hover:bg-amber-100 transition-colors"
                                                        >
                                                            + Выдать Предупреждение
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                const reason = prompt('Причина бана (24ч):');
                                                                if (reason) {
                                                                    await banUserAction(conversation.user.id, 24, reason);
                                                                    onUpdated();
                                                                }
                                                            }}
                                                            className="w-full py-2 bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-200 rounded-md hover:bg-rose-100 transition-colors"
                                                        >
                                                            Бан чата (24ч)
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
