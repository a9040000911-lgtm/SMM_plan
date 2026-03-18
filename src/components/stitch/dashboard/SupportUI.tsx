"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Headphones, Clock, Loader2, MessageSquare,
    Plus, ChevronDown, ShieldCheck, Mail, ArrowRight,
    AlertCircle, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { cn } from '@/utils/ui';

interface Ticket {
    id: string;
    subject: string;
    status: 'OPEN' | 'PENDING' | 'CLOSED';
    createdAt: Date;
    messages?: { sender: string; text: string; createdAt: Date }[];
}

interface SupportUIProps {
    initialTickets: Ticket[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    OPEN: { label: 'Открыт', color: 'text-blue-600 bg-blue-50 border-blue-100', icon: <Clock size={12} /> },
    PENDING: { label: 'Ожидает ответа', color: 'text-amber-600 bg-amber-50 border-amber-100', icon: <MessageSquare size={12} /> },
    CLOSED: { label: 'Решен', color: 'text-emerald-600 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={12} /> },
};

export function SupportUI({ initialTickets: tickets }: SupportUIProps) {
    const [activeTicket, setActiveTicket] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [sending, setSending] = useState(false);

    const handleCreate = async () => {
        if (!subject || !message) return;
        setSending(true);
        try {
            const res = await fetch('/api/client/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subject, text: message })
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch { /* ignore */ }
        setSending(false);
    };

    return (
        <div className="space-y-10 pb-20">
            {/* Header / Stats Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-5xl font-black text-slate-950 tracking-tighter uppercase italic">
                        Центр <span className="text-blue-600">Заботы</span>
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Прямая связь с экспертами Smmplan</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex items-center gap-6 px-8 py-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Среднее время ответа</span>
                            <span className="text-sm font-black text-slate-900">~ 15 минут</span>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Статус системы</span>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-sm font-black text-slate-900 uppercase">Online</span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex-1 lg:flex-none h-20 px-10 rounded-[2rem] bg-slate-950 text-white font-black hover:bg-blue-600 active:scale-95 transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group"
                    >
                        <div className={cn("transition-transform duration-500", showForm && "rotate-45")}>
                            <Plus size={20} />
                        </div>
                        <span className="text-xs uppercase tracking-widest leading-none">{showForm ? "Закрыть" : "Создать тикет"}</span>
                    </button>
                </div>
            </div>

            {/* New Ticket Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white border border-slate-100 rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-blue-900/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 blur-[100px] rounded-full" />

                            <div className="max-w-4xl mx-auto space-y-10 relative z-10">
                                <div className="space-y-2 text-center lg:text-left">
                                    <h2 className="text-3xl font-black text-slate-950 uppercase tracking-tight">Новое обращение</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Максимально подробно опишите ситуацию для быстрого решения</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Тема</label>
                                        <input
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="Проблема с накруткой / Ошибка оплаты"
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 px-6 text-sm font-black text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-200"
                                        />
                                    </div>
                                    <div className="flex items-center gap-4 px-6 md:px-0">
                                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                            <ShieldCheck size={24} />
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-tight">Ваш запрос будет передан <br /> дежурному специалисту <br /> моментально.</p>
                                    </div>

                                    <div className="lg:col-span-2 space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">Описание</label>
                                        <textarea
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            rows={5}
                                            placeholder="Укажите номер заказа, ссылки и детали..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-[2.5rem] py-6 px-8 text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 transition-all placeholder:text-slate-200 resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-4 text-slate-300">
                                        <Mail size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Email уведомления включены</span>
                                    </div>
                                    <button
                                        onClick={handleCreate}
                                        disabled={sending || !subject || !message}
                                        className="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    >
                                        {sending ? <Loader2 className="animate-spin" /> : <>Отправить запрос <ArrowRight size={16} /></>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tickets Grid */}
            <div className="grid grid-cols-1 gap-4">
                {tickets.length > 0 ? (
                    tickets.map((ticket, idx) => (
                        <TicketItem
                            key={ticket.id}
                            ticket={ticket}
                            idx={idx}
                            isActive={activeTicket === ticket.id}
                            onToggle={() => setActiveTicket(activeTicket === ticket.id ? null : ticket.id)}
                        />
                    ))
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-32 text-center bg-slate-50/50 border-2 border-dashed border-slate-100 rounded-[3rem]"
                    >
                        <Headphones className="mx-auto text-slate-200 mb-6" size={50} />
                        <h3 className="font-black text-slate-950 uppercase tracking-widest text-sm mb-2">История пуста</h3>
                        <p className="text-xs font-bold text-slate-400">У вас пока нет активных обращений в поддержку</p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}

function TicketItem({ ticket, idx, isActive, onToggle }: { ticket: Ticket, idx: number, isActive: boolean, onToggle: () => void }) {
    const sc = statusConfig[ticket.status] || statusConfig.OPEN;

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={cn(
                "group relative border transition-all duration-500 rounded-[2.5rem] overflow-hidden bg-white",
                isActive ? "border-blue-200 shadow-2xl shadow-blue-900/5 ring-1 ring-blue-50" : "border-slate-100 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5"
            )}
        >
            <button
                onClick={onToggle}
                className="w-full p-6 lg:p-8 text-left transition-all group"
            >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className={cn(
                            "w-12 h-12 lg:w-14 lg:h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:rotate-6",
                            isActive ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-400"
                        )}>
                            <MessageSquare size={24} />
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <h3 className="text-base font-black text-slate-950 uppercase tracking-tight line-clamp-1">{ticket.subject}</h3>
                                <div className={cn("hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", sc.color)}>
                                    {sc.icon} {sc.label}
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>ID: {ticket.id.slice(0, 8)}</span>
                                <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span>{new Date(ticket.createdAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-6 border-t lg:border-t-0 border-slate-50 pt-4 lg:pt-0">
                        <div className="lg:hidden">
                            <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border", sc.color)}>
                                {sc.label}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-slate-400 group-hover:text-blue-600 transition-colors uppercase tracking-widest leading-none">
                            {isActive ? "Скрыть" : "Нажмите для деталей"}
                            <div className={cn("transition-transform duration-500", isActive && "rotate-180")}>
                                <ChevronDown size={14} />
                            </div>
                        </div>
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-8 lg:px-12 pb-12 space-y-8">
                            <div className="h-px bg-slate-50 w-full" />

                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
                                {ticket.messages?.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "flex flex-col",
                                        msg.sender === 'USER' ? 'items-end' : 'items-start'
                                    )}>
                                        <div className={cn(
                                            "max-w-[85%] lg:max-w-[70%] p-6 rounded-[2rem] text-sm font-bold shadow-sm",
                                            msg.sender === 'USER'
                                                ? "bg-slate-950 text-white rounded-tr-none"
                                                : "bg-blue-50 text-blue-900 border border-blue-100 rounded-tl-none"
                                        )}>
                                            {msg.text}
                                        </div>
                                        <div className="flex items-center gap-2 mt-3 px-2">
                                            {msg.sender !== 'USER' && <Headphones size={12} className="text-blue-400" />}
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                {msg.sender === 'USER' ? 'Ваше сообщение' : 'Павел, эксперт Smmplan'} • {new Date(msg.createdAt).toLocaleString('ru-RU')}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Reply Tip */}
                            <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400">
                                        <AlertCircle size={20} />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                                        Чтобы отправить ответное сообщение, пожалуйста, <br />
                                        используйте форму «Новое обращение» или <br />
                                        напишите в Telegram поддержке с указанием ID тикета.
                                    </p>
                                </div>
                                <Link href="https://t.me/smmplan_support">
                                    <button className="hidden sm:flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-blue-500 transition-all">
                                        Написать в TG <ArrowUpRight size={14} />
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}


