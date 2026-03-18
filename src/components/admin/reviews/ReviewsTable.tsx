'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Star, CheckCircle2, XCircle, Trash2, Edit3, User, Globe, MessageSquare } from 'lucide-react';
import { updateReviewStatus, deleteReview } from '@/app/admin/reviews/actions';
import { toast } from 'sonner';
import { ReviewModal } from './ReviewModal';
import { cn } from '@/utils/ui';

interface ReviewsTableProps {
    initialReviews: any[];
    projects: { id: string; name: string }[];
    t: any;
}

export function ReviewsTable({ initialReviews, projects, t }: ReviewsTableProps) {
    const [reviews, setReviews] = useState(initialReviews);
    const [editingReview, setEditingReview] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleStatusUpdate = async (id: string, status: any) => {
        const res = await updateReviewStatus(id, status);
        if (res.success) {
            setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
            toast.success('Статус обновлен');
        } else {
            toast.error(res.error || 'Ошибка');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Удалить этот отзыв навсегда?')) return;
        const res = await deleteReview(id);
        if (res.success) {
            setReviews(reviews.filter(r => r.id !== id));
            toast.success('Отзыв удален');
        } else {
            toast.error(res.error || 'Ошибка');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Управление отзывами</h3>
                        <p className="text-xs text-slate-400 font-medium">Всего в списке: {reviews.length}</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingReview(null); setIsModalOpen(true); }}
                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                >
                    <Edit3 size={18} />
                    Добавить отзыв
                </button>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-100/50">
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.table.project_date}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.table.user}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.table.order_rating}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[35%]">{t.table.text}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t.table.status}</th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.table.actions}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {reviews.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 opacity-30 grayscale">
                                            <MessageSquare size={48} />
                                            <p className="text-sm font-bold">{t.table.empty}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                reviews.map((review) => (
                                    <tr key={review.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                {review.project && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Globe size={10} style={{ color: review.project.brandColor }} />
                                                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-tight">
                                                            {review.project.name}
                                                        </span>
                                                    </div>
                                                )}
                                                <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-0.5 rounded-full w-fit">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                {review.avatarUrl ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={review.avatarUrl} alt="" className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center ring-2 ring-slate-50">
                                                        <User size={20} />
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-slate-800 tracking-tight mb-0.5">
                                                        {review.userName || (review.user?.username ? `@${review.user.username}` : t.table.anonymous)}
                                                    </span>
                                                    {review.userRole && (
                                                        <span className="text-[10px] text-slate-400 font-bold leading-none">
                                                            {review.userRole}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            size={14}
                                                            className={cn(
                                                                "transition-all",
                                                                i < review.rating ? "text-amber-500 fill-amber-500" : "text-slate-100"
                                                            )}
                                                        />
                                                    ))}
                                                </div>
                                                {review.order && (
                                                    <div className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 w-fit">
                                                        #{review.order.id}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="relative">
                                                <span className="absolute -left-4 top-0 text-2xl text-slate-100 font-serif leading-none italic select-none">“</span>
                                                <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-2 italic pr-4">
                                                    {review.text || t.table.no_text}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className={cn(
                                                "text-[10px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest inline-flex border-2",
                                                review.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100/50' :
                                                    review.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100/50' :
                                                        'bg-amber-50 text-amber-600 border-amber-100/50 shadow-sm'
                                            )}>
                                                {review.status}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-all">
                                                {review.status !== 'APPROVED' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(review.id, 'APPROVED')}
                                                        className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-all shadow-sm hover:shadow-emerald-100"
                                                        title="Одобрить"
                                                    >
                                                        <CheckCircle2 size={18} />
                                                    </button>
                                                )}
                                                {review.status !== 'REJECTED' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(review.id, 'REJECTED')}
                                                        className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all shadow-sm hover:shadow-rose-100"
                                                        title="Отклонить"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => { setEditingReview(review); setIsModalOpen(true); }}
                                                    className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all shadow-sm hover:shadow-blue-100"
                                                    title="Редактировать"
                                                >
                                                    <Edit3 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(review.id)}
                                                    className="p-2 hover:bg-slate-100 text-slate-300 hover:text-slate-900 rounded-xl transition-all"
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ReviewModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                review={editingReview}
                projects={projects}
            />
        </div>
    );
}


