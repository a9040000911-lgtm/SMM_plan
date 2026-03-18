'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Check, Clock, AlertCircle, Send } from 'lucide-react';
import { closeTicketAction, replyToTicketAction } from '@/app/admin/support/actions';
import { SupportTicket, TicketStatus, SupportTemplate } from '@/types/support';

interface TicketSectionProps {
    ticket: SupportTicket;
    isExpanded: boolean;
    onToggle: () => void;
    onRefresh: () => void;
    templates: SupportTemplate[];
}

const statusConfig: Record<TicketStatus, { icon: any; color: string; bg: string; border: string; label: string }> = {
    OPEN: { icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Открыт' },
    PENDING: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Ожидает' },
    CLOSED: { icon: Check, color: 'text-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', label: 'Решено' }
};

export function TicketSection({ ticket, isExpanded, onToggle, onRefresh, templates }: TicketSectionProps) {
    const [reply, setReply] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const config = statusConfig[ticket.status];
    const StatusIcon = config.icon;

    const handleReply = async () => {
        if (!reply.trim() || isSending) return;
        setIsSending(true);
        try {
            await replyToTicketAction(ticket.id, reply);
            setReply('');
            onRefresh();
        } catch (e) {
            console.error('Reply failed:', e);
        } finally {
            setIsSending(false);
        }
    };

    const handleClose = async () => {
        if (isClosing) return;
        setIsClosing(true);
        try {
            await closeTicketAction(ticket.id);
            onRefresh();
        } catch (e) {
            console.error('Close failed:', e);
        } finally {
            setIsClosing(false);
        }
    };

    const lastMessage = ticket.messages[ticket.messages.length - 1];
    const hasNewUserMessage = lastMessage?.sender === 'USER' && ticket.status !== 'CLOSED';

    return (
        <div className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${ticket.status === 'CLOSED' ? 'opacity-60' : ''
            } ${config.border} ${hasNewUserMessage ? 'ring-2 ring-rose-300 ring-offset-2' : ''}`}>
            {/* Header */}
            <button
                onClick={onToggle}
                className={`w-full p-4 flex items-center justify-between ${config.bg} hover:brightness-95 transition-all`}
            >
                <div className="flex items-center gap-3">
                    <StatusIcon size={20} className={config.color} />
                    <div className="text-left">
                        <span className="font-bold text-slate-800">{ticket.subject}</span>
                        {!isExpanded && (
                            <p className="text-xs text-slate-500 mt-0.5">
                                {ticket._count.messages} сообщений • {new Date(ticket.createdAt).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                        {config.label}
                    </span>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </button>

            {/* Content */}
            {isExpanded && (
                <div className="bg-white">
                    {/* Messages */}
                    <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                        {ticket.messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.sender === 'USER'
                                        ? 'bg-slate-100 text-slate-800 rounded-bl-none'
                                        : 'bg-slate-800 text-white rounded-br-none'
                                    }`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <div className="text-[10px] mt-1 opacity-50">
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    {ticket.status !== 'CLOSED' && (
                        <div className="p-4 border-t border-slate-100 space-y-3">
                            {/* Quick Templates */}
                            {templates.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {templates.slice(0, 4).map((t) => (
                                        <button
                                            key={t.id}
                                            onClick={() => setReply(t.template)}
                                            className="shrink-0 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                        >
                                            {t.name}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Reply Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                                    placeholder="Ответить..."
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                <button
                                    onClick={handleReply}
                                    disabled={!reply.trim() || isSending}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl transition-colors"
                                >
                                    <Send size={16} />
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={isClosing}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl transition-colors flex items-center gap-2"
                                >
                                    <Check size={16} />
                                    <span className="text-sm font-medium">Решено</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}


