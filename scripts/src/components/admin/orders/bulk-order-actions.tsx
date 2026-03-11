'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw, X, Loader2 } from 'lucide-react';
import { bulkCancelOrdersAction, bulkUpdateStatusAction } from '@/app/admin/orders/actions';
import { AdminOrder } from '@/types/admin';

export function BulkOrderActions({ orders }: { orders: AdminOrder[] }) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBusy, setIsBusy] = useState(false);

  // Синхронизация чекбоксов в DOM (находим их по атрибутам)
  useEffect(() => {
    const checkboxes = document.querySelectorAll('.order-checkbox') as NodeListOf<HTMLInputElement>;
    checkboxes.forEach(cb => {
      cb.checked = selectedIds.includes(parseInt(cb.value));
    });

    const masterCb = document.querySelector('.master-checkbox') as HTMLInputElement;
    if (masterCb) {
      masterCb.checked = selectedIds.length === orders.length && orders.length > 0;
      masterCb.indeterminate = selectedIds.length > 0 && selectedIds.length < orders.length;
    }
  }, [selectedIds, orders]);

  // Глобальный слушатель кликов по чекбоксам в таблице (через делегирование)
  useEffect(() => {
    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.classList.contains('order-checkbox')) {
        const id = parseInt(target.value);
        setSelectedIds(prev => {
          const current = prev || [];
          return current.includes(id) ? current.filter(i => i !== id) : [...current, id];
        });
      }
      if (target.classList.contains('master-checkbox')) {
        if (target.checked) setSelectedIds(orders?.filter(o => !!o).map(o => o.id) || []);
        else setSelectedIds([]);
      }
    };

    document.addEventListener('click', handleTableClick);
    return () => document.removeEventListener('click', handleTableClick);
  }, [orders]);

  const handleBulkCancel = async () => {
    if (!confirm(`Вы уверены, что хотите ОТМЕНИТЬ и ВЕРНУТЬ ДЕНЬГИ за ${selectedIds.length} заказов?`)) return;
    setIsBusy(true);
    try {
      const res = await bulkCancelOrdersAction(selectedIds);
      if (res.success) {
        alert(`Готово! Успешно обработано: ${res.count}`);
        setSelectedIds([]);
      } else {
        alert('Ошибка: ' + res.error);
      }
    } catch (_e) {
      alert('Ошибка при выполнении операции');
    } finally {
      setIsBusy(false);
    }
  };

  const handleBulkComplete = async () => {
    if (!confirm(`Обновить статус для ${selectedIds.length} заказов через API провайдера?`)) return;
    setIsBusy(true);
    try {
      const res = await bulkUpdateStatusAction(selectedIds);
      if (res.success) {
        alert(`Статусы обновлены. Успешно: ${res.count}`);
        setSelectedIds([]);
      }
    } catch (_e) {
      alert('Ошибка');
    } finally {
      setIsBusy(false);
    }
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4 animate-in slide-in-from-bottom-8 duration-300">
      <div className="bg-slate-900 text-white rounded-lg p-4 shadow-2xl border border-white/10 flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-4 pl-4">
          <div className="w-10 h-10 rounded-md bg-blue-600 flex items-center justify-center font-black text-sm">
            {selectedIds.length}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Заказов выбрано</div>
            <div className="text-xs font-bold text-white">Массовое управление</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkCancel}
            disabled={isBusy}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-md text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
            Отмена + Возврат
          </button>
          <button
            onClick={handleBulkComplete}
            disabled={isBusy}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-md text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
          >
            <CheckCircle2 size={14} />
            Завершить
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="p-2.5 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
