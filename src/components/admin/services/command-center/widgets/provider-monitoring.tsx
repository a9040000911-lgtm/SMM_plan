"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { useServiceDashboard } from '../manager-context';
import { ProviderHub } from '../provider-hub';
import { syncProviderAction } from '@/app/admin/providers/actions';
import { toast } from 'sonner';

// --- WIDGET 2: PROVIDER MONITORING ---
export function ProviderMonitoringWidget() {
    const { providers, syncingProviderId, setSyncingProviderId } = useServiceDashboard();

    const handleProviderSync = async (id: string) => {
        setSyncingProviderId(id);
        try {
            const res = await syncProviderAction(id);
            if (res.success) {
                toast.success('Провайдер синхронизирован');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                toast.error(res.error || 'Ошибка синхронизации');
            }
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            toast.error('Ошибка сети');
        } finally {
            setSyncingProviderId(null);
        }
    };

    const handleTopUp = (provider: any) => {
        toast.info(`Перенаправляем к пополнению ${provider.name}...`);
        setTimeout(() => window.location.href = `/admin/providers?topup=${provider.id}`, 1000);
    };

    return (
        <div className="bg-white border border-slate-100 rounded-[2.5rem] p-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Мониторинг провайдеров</span>
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                <ProviderHub
                    providers={providers}
                    onSync={handleProviderSync}
                    onTopUp={handleTopUp}
                    syncingId={syncingProviderId}
                />
            </div>
        </div>
    );
}
