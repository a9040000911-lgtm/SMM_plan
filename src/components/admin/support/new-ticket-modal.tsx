'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { X, Plus, RefreshCw } from 'lucide-react';
import { createTicketByAdminAction } from '@/app/admin/support/actions';

interface NewTicketModalProps {
    userId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function NewTicketModal({ userId, isOpen, onClose, onSuccess }: NewTicketModalProps) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!subject.trim()) return;
        setIsSubmitting(true);
        try {
            await createTicketByAdminAction(userId, subject, message);
            setSubject('');
            setMessage('');
            onSuccess();
            onClose();
        } catch (e) {
            console.error('Failed to create ticket:', e);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-800">Новый тикет</h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Тема обращения</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Например: Проблема с заказом"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Первое сообщение</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Сообщение клиенту..."
                            className="w-full h-32 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!subject.trim() || isSubmitting}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                            Создать
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


