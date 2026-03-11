'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { RefreshCcw, Loader2 } from 'lucide-react';
import { bulkUpdateStatusAction } from '@/app/admin/orders/actions';
import { useRouter } from 'next/navigation';

export function SyncAllButton() {
    const [isSyncing, setIsSyncing] = useState(false);
    const router = useRouter();

    const handleSyncAll = async () => {
        // Находим все ID заказов из таблицы (или просто просим сервер синхронизировать все PENDING/PROCESSING)
        // Для простоты, этот экшен может синхронизировать последние 50 активных заказов
        // Но так как bulkUpdateStatusAction ожидает список ID, нам нужно передать их или изменить экшен.

        // В данном случае, давайте просто вызовем экшен, который возьмет на себя поиск активных заказов,
        // или передадим пустой массив, а экшен поймет это как "все активные".

        setIsSyncing(true);
        try {
            // Мы можем передать пустой массив, если модифицируем экшен, 
            // но сейчас давайте передадим ID всех видимых на странице чекбоксов
            const checkboxes = document.querySelectorAll('.order-checkbox:checked') as NodeListOf<HTMLInputElement>;
            let ids = Array.from(checkboxes).map(cb => parseInt(cb.value));

            // Если ничего не выбрано - синхронизируем все видимые на странице
            if (ids.length === 0) {
                const allCheckboxes = document.querySelectorAll('.order-checkbox') as NodeListOf<HTMLInputElement>;
                ids = Array.from(allCheckboxes).map(cb => parseInt(cb.value));
            }

            if (ids.length === 0) {
                alert('Нет заказов для синхронизации');
                return;
            }

            const res = await bulkUpdateStatusAction(ids);
            if (res.success) {
                alert(`Синхронизировано заказов: ${res.count}`);
                router.refresh();
            } else {
                alert('Ошибка синхронизации: ' + res.error);
            }
        } catch (e) {
            console.error(e);
            alert('Произошла ошибка при синхронизации');
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isSyncing ? <Loader2 size={16} className="animate-spin text-blue-600" /> : <RefreshCcw size={16} className="text-slate-400" />}
            {isSyncing ? 'Синхронизация...' : 'Синхронизировать всё'}
        </button>
    );
}
