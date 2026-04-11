"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { RefreshCw, Info } from 'lucide-react';
import { cn } from '@/utils/ui';
import { useServiceDashboard } from '../manager-context';
import { repairCategoriesAction } from '@/app/admin/services/actions';
import { toast } from 'sonner';

// --- WIDGET 4: MAINTENANCE & REPAIR ---
export function MaintenanceWidget() {
    const { isRepairing, setIsRepairing, activeProjectId, isGlobal } = useServiceDashboard();

    const handleRepair = async () => {
        setIsRepairing(true);
        try {
            const res = await repairCategoriesAction(activeProjectId === 'all' ? null : activeProjectId);
            if (res.success) {
                toast.success(`Восстановлено: ${res.count} категорий`);
                setTimeout(() => window.location.reload(), 1000);
            }
        } finally {
            setIsRepairing(false);
        }
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm flex items-center justify-between h-full bg-gradient-to-br from-white to-slate-50/50">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Info size={24} />
                </div>
                <div>
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Системные проверки</div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">
                        {isGlobal ? 'Мастер-каталог: Глобальные изменения' : 'Локальный режим: Настройки проекта'}
                    </div>
                </div>
            </div>
            <button
                onClick={handleRepair}
                disabled={isRepairing}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95 disabled:opacity-50"
            >
                <RefreshCw size={14} className={cn(isRepairing && "animate-spin")} />
                {isRepairing ? 'Ждите...' : 'Починить'}
            </button>
        </div>
    );
}
