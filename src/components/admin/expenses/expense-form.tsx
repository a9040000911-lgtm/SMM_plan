'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { DatePicker } from '@/components/admin/ui/date-picker';
import { createExpenseAction } from '@/app/admin/expenses/actions';

export function ExpenseForm({
    categoriesMap,
    projects = [],
    isGlobalAdmin = false
}: {
    categoriesMap: any,
    projects?: any[],
    isGlobalAdmin?: boolean
}) {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            if (date) {
                formData.set('date', date.toISOString().split('T')[0]);
            }
            await createExpenseAction(formData);
            // Reset form or redirect if needed. 
            // The action itself might handle redirect, but since it's a client call now:
            window.location.reload();
        } catch {
            alert('Ошибка при сохранении');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6 h-fit">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <Plus size={18} className="text-blue-500" />
                Добавить расход
            </h3>
            <form action={handleSubmit} className="space-y-4">
                {isGlobalAdmin && (
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Проект</label>
                        <select name="projectId" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none cursor-pointer">
                            <option value="">Глобальный расход</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.slug})</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Категория</label>
                    <select name="category" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none cursor-pointer">
                        {Object.entries(categoriesMap).map(([k, v]: any) => (
                            <option key={k} value={k}>{v.label}</option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Сумма (₽)</label>
                    <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-rose-600" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Дата</label>
                    <DatePicker
                        value={date}
                        onChange={setDate}
                        placeholder="Выберите дату"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase px-1 tracking-widest">Описание</label>
                    <textarea name="description" rows={3} placeholder="На что потрачены деньги..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm" />
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50"
                >
                    {isLoading ? 'Сохранение...' : 'Зафиксировать расход'}
                </button>
            </form>
        </div>
    );
}


