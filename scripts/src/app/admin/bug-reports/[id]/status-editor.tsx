'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { updateBugStatus } from '../actions';
import { toast } from 'sonner';
import { BugStatus } from '@/generated/client';
import { Loader2 } from 'lucide-react';

interface Props {
    reportId: string;
    initialStatus: BugStatus;
    initialReward: number;
    adminNotes: string;
    isPaid: boolean;
}

export function BugStatusEditor({ reportId, initialStatus, initialReward, adminNotes, isPaid }: Props) {
    const [status, setStatus] = useState<BugStatus>(initialStatus);
    const [reward, setReward] = useState<string>(initialReward.toString());
    const [notes, setNotes] = useState(adminNotes);
    const [isLoading, setIsLoading] = useState(false);

    const handleSave = async () => {
        if (status === 'ACCEPTED' && !isPaid && Number(reward) < 0) {
            toast.error('Сумма вознаграждения не может быть отрицательной');
            return;
        }

        setIsLoading(true);
        const res = await updateBugStatus(reportId, status, Number(reward), notes);
        setIsLoading(false);

        if (res.success) {
            toast.success('Отчет обновлен');
            if (status === 'ACCEPTED' && !isPaid && Number(reward) > 0) {
                toast.success(`Пользователю начислено ${reward}₽`);
            }
        } else {
            toast.error(res.error || 'Ошибка при обновлении отчета');
        }
    };

    return (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Управление</h3>

            <div className="space-y-4">
                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Статус</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as BugStatus)}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                    >
                        <option value="PENDING">Новый (PENDING)</option>
                        <option value="REVIEWING">На проверке (REVIEWING)</option>
                        <option value="ACCEPTED">Принят/Оплачен (ACCEPTED)</option>
                        <option value="REJECTED">Отклонен (REJECTED)</option>
                    </select>
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Вознаграждение (₽)</label>
                    <input
                        type="number"
                        value={reward}
                        onChange={(e) => setReward(e.target.value)}
                        disabled={isPaid}
                        className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 disabled:opacity-50"
                        placeholder="0"
                    />
                    {isPaid && <p className="text-[10px] text-emerald-600 mt-1 font-bold">Уже выплачено</p>}
                </div>

                <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Заметки администратора (не видны клиенту)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full min-h-[100px] p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                        placeholder="Оставьте заметки по фиксу..."
                    />
                </div>

                <button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                >
                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : 'Сохранить изменения'}
                </button>
            </div>
        </div>
    );
}
