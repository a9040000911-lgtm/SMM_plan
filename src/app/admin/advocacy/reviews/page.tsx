'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import {
    Check,
    X,
    Star,
    MessageSquare,
    Box,
    Award
} from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewModeration() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchReviews();
    }, []);

    async function fetchReviews() {
        try {
            const res = await fetch('/api/admin/advocacy/reviews');
            if (res.ok) {
                const json = await res.json();
                setReviews(json.reviews);
            }
        } catch (_err) {
            console.error('Failed to fetch reviews:', _err);
        } finally {
            setLoading(false);
        }
    }

    async function handleModeration(reviewId: string, status: 'APPROVED' | 'REJECTED', qualityScore: number = 2) {
        setProcessing(reviewId);
        try {
            const res = await fetch('/api/admin/advocacy/reviews', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reviewId, status, qualityScore })
            });

            if (res.ok) {
                toast.success(status === 'APPROVED' ? 'Отзыв одобрен и награда начислена' : 'Отзыв отклонен');
                setReviews(prev => prev.filter(r => r.id !== reviewId));
            } else {
                const err = await res.json();
                toast.error(err.error || 'Ошибка при модерации');
            }
        } catch (_err) {
            toast.error('Ошибка сети');
        } finally {
            setProcessing(null);
        }
    }

    if (loading) {
        return (
            <div className="p-8 animate-pulse space-y-8">
                <div className="h-8 w-64 bg-slate-200 rounded"></div>
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-100 rounded-[2.5rem]"></div>)}
            </div>
        );
    }

    const pendingReviews = reviews.filter(r => r.status === 'PENDING');

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Модерация отзывов</h1>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Проверка UGC и начисление бонусов за лояльность</p>
            </div>

            {pendingReviews.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-20 border border-slate-200 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                        <Check size={40} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">Все отзывы обработаны</h3>
                    <p className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest">Нет новых отзывов, ожидающих проверки</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {pendingReviews.map((review) => (
                        <div key={review.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
                            {/* Левая часть: информация о пользователе и заказе */}
                            <div className="p-8 bg-slate-50/50 md:w-80 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col justify-between">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs uppercase">
                                            {review.user.username?.substring(0, 2) || 'US'}
                                        </div>
                                        <div className="flex flex-col overflow-hidden">
                                            <span className="text-sm font-black text-slate-900 truncate">@{review.user.username || 'user'}</span>
                                            <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">ID: {review.id.substring(0, 8)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Box size={14} className="text-slate-400" />
                                            <span className="text-[10px] font-bold uppercase">Заказ: {review.orderId?.substring(0, 8)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-500">
                                            <Star size={14} className="text-amber-500" />
                                            <span className="text-[10px] font-bold uppercase">Общая оценка: {review.rating || 5}/5</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-slate-100">
                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">Создан: {new Date(review.createdAt).toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Правая часть: контент отзыва и действия */}
                            <div className="p-8 flex-1 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare size={16} className="text-indigo-400" />
                                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Текст отзыва</h4>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 relative">
                                        <p className="text-slate-700 font-medium italic">«{review.content}»</p>
                                        <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                            <Award size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-wrap items-center justify-between gap-6">
                                    {/* Quality Selector */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Качество отзыва:</span>
                                        <div className="flex bg-slate-100 p-1 rounded-xl">
                                            {[1, 2, 3].map(q => (
                                                <button
                                                    key={q}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${q === 2 ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                                                        }`}
                                                >
                                                    {q === 1 ? 'Low' : q === 2 ? 'Medium' : 'High'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleModeration(review.id, 'REJECTED')}
                                            disabled={!!processing}
                                            className="px-6 py-2.5 rounded-xl border-2 border-slate-100 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
                                        >
                                            <X size={14} /> Отклонить
                                        </button>
                                        <button
                                            onClick={() => handleModeration(review.id, 'APPROVED')}
                                            disabled={!!processing}
                                            className="px-8 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-black transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_10px_20px_rgba(79,70,229,0.2)]"
                                        >
                                            <Check size={14} /> Одобрить и наградить
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


