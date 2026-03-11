'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { BrainCircuit, RefreshCw, Undo2 } from 'lucide-react';
import { failoverOrderAction, refundOrderAction, syncOrderAction } from '@/app/admin/orders/actions';

export function OrderActions({ orderId, status }: { orderId: number, status: string }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  const [isFailingOver, setIsFailingOver] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await syncOrderAction(orderId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      alert('Ошибка синхронизации: ' + message);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleFailover = async () => {
    if (!confirm('Вы уверены, что хотите переключить провайдера? Система найдет следующего по приоритету и создаст заказ там.')) return;
    setIsFailingOver(true);
    try {
      const res = await failoverOrderAction(orderId);
      if (res.success) {
        alert('Заказ успешно переключен!');
      } else {
        alert('Ошибка переключения: ' + (res.error || 'Неизвестная ошибка'));
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      alert('Ошибка: ' + message);
    } finally {
      setIsFailingOver(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('Вы уверены, что хотите сделать возврат? Деньги вернутся на баланс пользователя, а заказ будет отменен.')) return;
    setIsRefunding(true);
    try {
      await refundOrderAction(orderId);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      alert('Ошибка возврата: ' + message);
    } finally {
      setIsRefunding(false);
    }
  };

  const canRefund = status !== 'CANCELED' && status !== 'COMPLETED';
  const canFailover = status === 'PENDING' || status === 'ERROR' || status === 'PROCESSING';

  return (
    <div className="flex gap-2">
      <button
        onClick={handleSync}
        disabled={isSyncing}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-sm"
      >
        <RefreshCw size={16} className={isSyncing ? 'animate-spin' : ''} />
        {isSyncing ? 'Синхронизация...' : 'Обновить статус'}
      </button>

      {canFailover && (
        <button
          onClick={handleFailover}
          disabled={isFailingOver}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-sm font-semibold hover:bg-indigo-100 disabled:opacity-50 transition-all shadow-sm"
        >
          <BrainCircuit size={16} className={isFailingOver ? 'animate-spin' : ''} />
          {isFailingOver ? 'Переключаем...' : 'Сменить провайдера'}
        </button>
      )}

      {canRefund && (
        <button
          onClick={handleRefund}
          disabled={isRefunding}
          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-sm font-semibold hover:bg-rose-100 disabled:opacity-50 transition-all shadow-sm"
        >
          <Undo2 size={16} className={isRefunding ? 'animate-spin' : ''} />
          {isRefunding ? 'Возвращаем...' : 'Сделать возврат'}
        </button>
      )}
    </div>
  );
}
