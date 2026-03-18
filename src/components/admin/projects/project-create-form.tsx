'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useActionState } from 'react';
import { createProjectAction } from '@/app/admin/projects/actions';
import { Button } from '@/components/admin/ui';
import { AlertCircle } from 'lucide-react';

export function ProjectCreateForm() {
    // useActionState is available in React 19 / Next.js 15+
    const [state, formAction, isPending] = useActionState<any, FormData>(createProjectAction, null);

    const error = state?.error;
    const success = state?.success;

    return (
        <form action={formAction} className="w-full space-y-3">
            {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-600 animate-in fade-in slide-in-from-top-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span className="text-[10px] font-black uppercase tracking-tight leading-tight">{error}</span>
                </div>
            )}

            <input
                name="name"
                placeholder="Название (например, SmmPlan Gold)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                required
            />
            <input
                name="slug"
                placeholder="Slug (id, например: gold)"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                required
            />

            <div className="flex gap-2">
                <input
                    name="brandColor"
                    type="color"
                    defaultValue="#3b82f6"
                    className="w-12 h-11 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
                    title="Фирменный цвет"
                />
                <input
                    name="domain"
                    placeholder="Домен сайта"
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                />
            </div>

            <input
                name="botToken"
                type="password"
                placeholder="Telegram Bot Token"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all outline-none"
            />

            <Button
                type="submit"
                className="w-full py-6 font-black uppercase text-[10px] tracking-widest"
                disabled={isPending}
            >
                {isPending ? 'Создание...' : 'Создать платформу'}
            </Button>

            {success && (
                <p className="text-[9px] text-emerald-600 font-bold text-center uppercase tracking-widest mt-2">
                    Проект успешно создан! Перезагрузка...
                </p>
            )}
        </form>
    );
}


