'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { X, Star, Save, Loader2 } from 'lucide-react';
import { ReviewStatus } from '@/generated/client';
import { upsertAdminReview } from '@/app/admin/reviews/actions';
import { toast } from 'sonner';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    review?: any; // If editing
    projects: { id: string; name: string }[];
}

export function ReviewModal({ isOpen, onClose, review, projects }: ReviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        projectId: review?.projectId || projects[0]?.id || '',
        rating: review?.rating || 5,
        text: review?.text || '',
        userName: review?.userName || '',
        userRole: review?.userRole || '',
        status: (review?.status as ReviewStatus) || 'APPROVED',
        isAnonymous: review?.isAnonymous || false,
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await upsertAdminReview(review?.id || null, formData);
            if (res.success) {
                toast.success(review ? 'Отзыв обновлен' : 'Отзыв создан');
                onClose();
            } else {
                toast.error(res.error || 'Ошибка');
            }
        } catch (_err) {
            toast.error('Что-то пошло не так');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">
                            {review ? 'Редактировать отзыв' : 'Добавить отзыв'}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium">Ручное управление отзывами</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                    {/* Project Selection */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Проект</label>
                        <select
                            value={formData.projectId}
                            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none"
                            required
                        >
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Имя автора</label>
                            <input
                                type="text"
                                value={formData.userName}
                                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                                placeholder="Иван Иванов"
                                className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                required
                            />
                        </div>
                        {/* Role/Post */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Роль / Должность</label>
                            <input
                                type="text"
                                value={formData.userRole}
                                onChange={(e) => setFormData({ ...formData, userRole: e.target.value })}
                                placeholder="CEO Tech"
                                className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Оценка</label>
                        <div className="flex gap-2 bg-slate-50 p-3 rounded-2xl w-fit">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, rating: s })}
                                    className={`transition-all hover:scale-110 ${s <= formData.rating ? 'text-amber-500' : 'text-slate-200'}`}
                                >
                                    <Star size={24} fill={s <= formData.rating ? 'currentColor' : 'none'} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Text */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Текст отзыва</label>
                        <textarea
                            value={formData.text}
                            onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                            placeholder="Напишите здесь отзыв..."
                            className="w-full bg-slate-50 border-0 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none min-h-[120px]"
                            required
                        />
                    </div>

                    {/* Status & Options */}
                    <div className="flex items-center justify-between py-2 border-t border-slate-50 gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.isAnonymous}
                                onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
                                className="w-4 h-4 rounded border-slate-200 text-blue-600 focus:ring-blue-500"
                            />
                            <label className="text-xs font-bold text-slate-500">Анонимно</label>
                        </div>

                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value as ReviewStatus })}
                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border-2 transition-all outline-none ${formData.status === 'APPROVED' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                formData.status === 'REJECTED' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                    'bg-amber-50 border-amber-100 text-amber-600'
                                }`}
                        >
                            <option value="PENDING">На проверке</option>
                            <option value="APPROVED">Одобрен</option>
                            <option value="REJECTED">Отклонен</option>
                        </select>
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/30">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl text-sm font-black text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    >
                        Отмена
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-blue-600 transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {review ? 'Сохранить' : 'Добавить'}
                    </button>
                </div>
            </div>
        </div>
    );
}
