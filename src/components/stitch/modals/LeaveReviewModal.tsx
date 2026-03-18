'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Send, Loader2, MessageCircle } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface LeaveReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string | null;
}

export function LeaveReviewModal({ isOpen, onClose, projectId }: LeaveReviewModalProps) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [rating, setRating] = useState(5);
    const [text, setText] = useState('');
    const [userName, setUserName] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            const handleEsc = (e: KeyboardEvent) => {
                if (e.key === 'Escape') onClose();
            };
            window.addEventListener('keydown', handleEsc);
            return () => {
                document.body.style.overflow = '';
                window.removeEventListener('keydown', handleEsc);
            };
        }
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return toast.error('Пожалуйста, напишите отзыв');

        setLoading(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    projectId,
                    rating,
                    text,
                    userName: session?.user?.name || userName || 'Анонимный клиент',
                    isAnonymous: !session?.user && !userName,
                })
            });

            if (res.ok) {
                toast.success('Отзыв отправлен на модерацию. Спасибо!');
                onClose();
                setText('');
                setUserName('');
            } else {
                const err = await res.json();
                toast.error(err.message || 'Ошибка при отправке');
            }
        } catch (_err) {
            toast.error('Сетевая ошибка');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] grid place-items-center p-4 overflow-y-auto custom-scrollbar bg-slate-900/60 backdrop-blur-md pb-20 pt-20">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="bg-white w-full max-w-[400px] rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] relative z-10 flex flex-col max-h-[85vh] overflow-hidden border border-white/20"
                    >
                        {/* Header: Fixed */}
                        <div className="shrink-0 p-8 pb-5 flex justify-between items-center bg-white border-b border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-600/30">
                                    <MessageCircle size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none mb-1">Ваш отзыв</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Share experience</p>
                                </div>
                            </div>
                            <button 
                                onClick={onClose} 
                                className="p-3 hover:bg-slate-100 rounded-2xl text-slate-400 transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content: Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 pt-5 custom-scrollbar bg-white overscroll-contain">
                            <form onSubmit={handleSubmit} className="space-y-8 pb-10">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Оценка сервиса</label>
                                    <div className="flex justify-between items-center bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 shadow-inner">
                                        {[1, 2, 3, 4, 5].map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setRating(s)}
                                                className={`transition-all duration-300 ${s <= rating ? 'text-amber-500' : 'text-slate-200'}`}
                                            >
                                                <Star 
                                                    size={32} 
                                                    fill={s <= rating ? 'currentColor' : 'none'} 
                                                    className={`transition-all ${s <= rating ? 'scale-110' : 'hover:scale-110'}`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {!session?.user && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Как вас зовут?</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Александр"
                                            className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl px-6 py-4.5 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-300"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ваши впечатления</label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Напишите здесь всё, что считаете нужным..."
                                        className="w-full bg-slate-50/50 border border-slate-100 rounded-[2rem] px-6 py-5 text-[15px] font-medium text-slate-600 outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600/20 transition-all placeholder:text-slate-300 min-h-[140px] resize-none leading-relaxed"
                                        required
                                    />
                                </div>

                                <div className="flex items-start gap-4 px-1">
                                    <input
                                        type="checkbox"
                                        id="review_consent_final"
                                        required
                                        className="mt-1 shrink-0 w-5 h-5 rounded-lg border-slate-200 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
                                    />
                                    <label htmlFor="review_consent_final" className="text-[11px] text-slate-400 font-medium leading-tight select-none cursor-pointer">
                                        Я подтверждаю своё согласие на <a href="/legal/privacy" target="_blank" className="text-blue-600 hover:underline font-extrabold transition-all">обработку персональных данных</a> в соответствии с политикой конфиденциальности.
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-950 text-white py-6 rounded-[2rem] font-black tracking-[0.2em] text-xs uppercase flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 group overflow-hidden relative"
                                >
                                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                                    <span>Отправить отзыв</span>
                                    
                                    {/* Subtle hover gloss */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}


