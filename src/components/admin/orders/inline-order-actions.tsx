'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { BrainCircuit, Undo2 } from 'lucide-react';
import { failoverOrderAction, refundOrderAction } from '@/app/admin/orders/actions';
import { toast } from 'sonner';

export function InlineOrderActions({ orderId, status }: { orderId: number, status: string }) {
  const [isRefunding, setIsRefunding] = useState(false);
  const [isFailingOver, setIsFailingOver] = useState(false);

  const handleFailover = async () => {
    if (!confirm('Вы уверены, что хотите переключить провайдера? Система найдет следующего по приоритету и создаст заказ там.')) return;
    setIsFailingOver(true);
    try {
      const res = await failoverOrderAction(orderId);
      if (res.success) {
        toast.success('Заказ успешно переключен!');
      } else {
        toast.error('Ошибка переключения: ' + (res.error || 'Неизвестная ошибка'));
      }
    } catch (e) {
      toast.error('Ошибка: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'));
    } finally {
      setIsFailingOver(false);
    }
  };

  const handleRefund = async () => {
    if (!confirm('Вы уверены, что хотите сделать возврат? Деньги вернутся на баланс пользователя, а заказ будет отменен.')) return;
    setIsRefunding(true);
    try {
      await refundOrderAction(orderId);
      toast.success('Возврат выполнен успешно!');
    } catch (e) {
      toast.error('Ошибка возврата: ' + (e instanceof Error ? e.message : 'Неизвестная ошибка'));
    } finally {
      setIsRefunding(false);
    }
  };

  const canRefund = status !== 'CANCELED' && status !== 'COMPLETED' && status !== 'CANCELED_API';
  const canFailover = status === 'PENDING' || status === 'ERROR' || status === 'PROCESSING' || status === 'PARTIAL';

  return (
    <div className="flex items-center gap-1.5">
      {canFailover && (
        <button
          onClick={handleFailover}
          disabled={isFailingOver}
          title="Сменить провайдера (Рестарт)"
          className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all disabled:opacity-50"
        >
          <BrainCircuit size={16} className={isFailingOver ? 'animate-spin' : ''} />
        </button>
      )}

      {canRefund && (
        <button
          onClick={handleRefund}
          disabled={isRefunding}
          title="Отмена и возврат"
          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
        >
          <Undo2 size={16} className={isRefunding ? 'animate-spin' : ''} />
        </button>
      )}
    </div>
  );
}
