'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { upsertServiceCategoryAction, deleteServiceCategoryAction } from '@/app/admin/services/actions';
import { IconSelector } from '@/components/admin/services/icon-selector';
import { Platform } from '@prisma/client';
import { X, Save, Trash2, Loader2, TrendingUp } from 'lucide-react';
import { getIcon } from './icon-selector';
import { smartSearch } from '@/utils/smart-search';
import { massLinkCategoryServicesAction } from '@/app/admin/services/mass-link-action';

interface CategoryEditorProps {
    category?: any;
    platform: Platform;
    allProviderServices?: any[];
    onClose: () => void;
    onSuccess: () => void;
}

export function CategoryEditor({ category, platform, allProviderServices, onClose, onSuccess }: CategoryEditorProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
        defaultValues: {
            name: category?.name || '',
            targetType: category?.targetType || 'POST',
            description: category?.description || '',
            priority: category?.priority || 0,
            icon: category?.icon || 'Users'
        }
    });

    const selectedIcon = watch('icon');

    const onSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            await upsertServiceCategoryAction(category?.id, {
                ...data,
                platform: platform
            });

            // Note: Server action returns the object, not {success: true} unless wrapped.
            // But if it throws, it throws.
            // Wait, my action returns object directly on success.
            // Let's assume success if no throw.

            toast.success(category ? 'Категория обновлена' : 'Категория создана');
            onSuccess();
            onClose();
        } catch (_error: any) {
            toast.error(_error.message || 'Ошибка сохранения категории');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
        setIsSubmitting(true);
        try {
            const res = await deleteServiceCategoryAction(category.id);
            if (res.success) {
                toast.success('Категория удалена');
                onSuccess();
                onClose();
            } else {
                toast.error(res.error);
            }
        } catch (_error: any) {
            toast.error('Ошибка удаления');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-800">
                        {category ? 'Редактировать категорию' : `Новая категория ${platform}`}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Название</label>
                        <input
                            {...register('name', { required: 'Название обязательно' })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 ring-blue-500/10 outline-none transition-all"
                            placeholder="Напр. Подписчики, Лайки..."
                        />
                        {errors.name && <span className="text-xs text-rose-500 font-bold">{errors.name.message as string}</span>}
                    </div>

                    {/* Target Type & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Тип цели</label>
                            <select
                                {...register('targetType')}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            >
                                <option value="POST">Пост / Публикация</option>
                                <option value="CHANNEL">Канал / Группа</option>
                                <option value="PROFILE">Профиль / Аккаунт</option>
                                <option value="VIDEO">Видео / Reels</option>
                                <option value="STORY">Сторис</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Приоритет</label>
                            <input
                                type="number"
                                {...register('priority', { valueAsNumber: true })}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                            />
                        </div>
                    </div>

                    {/* Icon */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Иконка</label>
                        <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 flex items-center justify-center bg-white rounded-xl shadow-sm border border-blue-100 text-blue-600">
                                    {getIcon(selectedIcon)}
                                </div>
                                <div className="text-xs text-slate-500 leading-tight">
                                    Выберите иконку, подходящую для этой категории.
                                </div>
                            </div>
                            <IconSelector
                                value={selectedIcon}
                                onChange={(icon) => setValue('icon', icon)}
                            />
                        </div>
                    </div>

                    {/* Mass Mapping Section */}
                    {category && allProviderServices && (
                        <div className="pt-4 border-t border-slate-100">
                            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider mb-2">Умная привязка</h4>
                            <button
                                type="button"
                                onClick={async () => {
                                    const providerId = prompt('Введите ID провайдера для поиска (или оставьте пустым для всех):');
                                    if (providerId === null) return;

                                    toast.info('Начинаю умный поиск соответствий...');

                                    const internalServices = category.internalServices || [];
                                    const mappings: any[] = [];

                                    for (const is of internalServices) {
                                        const matches = allProviderServices!
                                            .filter(ps => ps.platform === platform && (!providerId || ps.providerId === providerId))
                                            .filter(ps => smartSearch(is.name, ps.name))
                                            .sort((a, b) => a.rawPrice - b.rawPrice);

                                        if (matches.length > 0) {
                                            mappings.push({
                                                internalServiceId: is.id,
                                                providerId: matches[0].providerId,
                                                providerServiceId: matches[0].id
                                            });
                                        }
                                    }

                                    if (mappings.length === 0) {
                                        toast.error('Не найдено ни одного соответствия');
                                        return;
                                    }

                                    if (!confirm(`Найдено ${mappings.length} соответствий из ${internalServices.length} услуг. Применить привязку?`)) return;

                                    const res = await massLinkCategoryServicesAction(category.id, mappings);
                                    if (res.success) {
                                        toast.success(`Успешно привязано ${res.count} услуг`);
                                        onSuccess();
                                    } else {
                                        toast.error(res.error || 'Ошибка массовой привязки');
                                    }
                                }}
                                className="w-full flex items-center justify-center gap-2 p-2 bg-emerald-50 text-emerald-600 rounded-xl text-[11px] font-bold border border-emerald-100 hover:bg-emerald-100 transition-colors"
                            >
                                <TrendingUp size={14} /> Массовая привязка провайдера
                            </button>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 flex items-center justify-between gap-4">
                        {category && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="p-3 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-500 active:scale-95 transition-all ${isSubmitting ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <><Save size={18} /> Сохранить категорию</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}


