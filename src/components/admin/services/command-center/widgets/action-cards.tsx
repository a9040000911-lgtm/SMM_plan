"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { PackagePlus, RefreshCw, Layers } from 'lucide-react';
import { cn } from '@/utils/ui';
import { useServiceDashboard } from '../manager-context';
import { HealthCheckWidget } from '../health-check';
import { syncAllServicesAction } from '@/app/admin/services/actions';
import { toast } from 'sonner';

// --- WIDGET 1: ACTION CARDS (BENTO) ---
export function ActionCardsWidget() {
    const { setIsImportOpen, isSyncing, setIsSyncing, services } = useServiceDashboard();

    const handleGlobalSync = async () => {
        if (!confirm('Запустить полную синхронизацию всех услуг? Это может занять время.')) return;
        setIsSyncing(true);
        try {
            const res = await syncAllServicesAction() as any;
            if (res.success) {
                toast.success(`Синхронизация завершена! Обновлено: ${res.updatedCount}`);
                setTimeout(() => window.location.reload(), 1500);
            } else {
                toast.error(res.error || 'Ошибка синхронизации');
            }
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            toast.error('Ошибка сети');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-full">
            <div className="md:col-span-3 h-full">
                <HealthCheckWidget />
            </div>

            <div className="md:col-span-2 grid grid-cols-2 gap-4 h-full">
                <div
                    onClick={() => setIsImportOpen(true)}
                    className="group relative bg-white border border-slate-100 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:shadow-xl transition-all overflow-hidden border-dashed cursor-pointer"
                >
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <PackagePlus size={20} />
                    </div>
                    <div className="text-center">
                        <span className="text-[11px] font-black text-slate-800 uppercase ">Импорт</span>
                    </div>
                </div>

                <div
                    onClick={handleGlobalSync}
                    className="bg-white border border-slate-100 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 hover:border-emerald-500 hover:shadow-xl transition-all group overflow-hidden border-dashed cursor-pointer"
                >
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <RefreshCw size={20} className={cn(isSyncing && "animate-spin")} />
                    </div>
                    <div className="text-center">
                        <span className="text-[11px] font-black text-slate-800 uppercase ">Синхронизация</span>
                    </div>
                </div>
            </div>

            <div className="md:col-span-5 bg-slate-900 rounded-[2rem] p-8 flex items-center justify-between group hover:bg-slate-800 transition-all shadow-2xl relative overflow-hidden h-full">
                <div className="relative z-10">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] leading-none">Каталог</span>
                    <h3 className="text-4xl font-black text-white italic mt-1">{services.length}</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 italic">активных сервисов</p>
                </div>
                <div className="relative z-10 p-6 bg-white/5 text-white/20 rounded-3xl group-hover:text-blue-500 group-hover:scale-110 transition-all">
                    <Layers size={48} />
                </div>
                <div className="absolute bottom-[-20px] left-[-20px] w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
            </div>
        </div>
    );
}
