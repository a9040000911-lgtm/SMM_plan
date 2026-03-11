'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return toast.error('Пожалуйста, напишите отзыв');

        setLoading(true);
        try {
            // We use an API route for public submissions to ensure safety
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

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-slate-100"
                    >
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-6">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <MessageCircle size={24} />
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Оставить отзыв</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8">Ваше мнение помогает нам становиться лучше.</p>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Rating */}
                                <div className="flex justify-center gap-2 bg-slate-50 p-4 rounded-2xl">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setRating(s)}
                                            className={`transition-all hover:scale-125 ${s <= rating ? 'text-amber-500' : 'text-slate-200'}`}
                                        >
                                            <Star size={32} fill={s <= rating ? 'currentColor' : 'none'} />
                                        </button>
                                    ))}
                                </div>

                                {!session?.user && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Ваше имя (необязательно)</label>
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder="Иван"
                                            className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300 transition-all"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Комментарий</label>
                                    <textarea
                                        value={text}
                                        onChange={(e) => setText(e.target.value)}
                                        placeholder="Расскажите о своем опыте..."
                                        className="w-full bg-slate-50 border-0 rounded-2xl px-5 py-4 text-sm font-medium text-slate-600 outline-none focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300 transition-all min-h-[120px] resize-none"
                                        required
                                    />
                                </div>

                                <div className="flex items-start gap-3">
                                    <input
                                        type="checkbox"
                                        id="review_consent"
                                        required
                                        className="mt-1 shrink-0 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="review_consent" className="text-xs text-slate-500 font-medium leading-relaxed">
                                        Я даю согласие на обработку моих персональных данных в соответствии с{' '}
                                        <a href="/docs/policy" target="_blank" className="text-blue-600 hover:underline">Политикой конфиденциальности</a>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black tracking-widest text-xs uppercase flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                    Отправить отзыв
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
