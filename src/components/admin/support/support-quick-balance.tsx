'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { adjustBalanceAction } from '@/app/admin/users/actions';
import { refundOrderAction } from '@/app/admin/orders/actions';
import { toast } from 'sonner';
import { Coins, Undo2, Loader2, Plus, Minus } from 'lucide-react';

export function SupportQuickBalance({ userId, orderId, orderStatus }: { userId: string, orderId?: number | null, orderStatus?: string | null }) {
    const [amount, setAmount] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [isRefunding, setIsRefunding] = useState(false);

    const handleAdjust = async (type: 'add' | 'deduct') => {
        const val = parseFloat(amount.replace(',', '.'));
        if (isNaN(val) || val <= 0) return toast.error('Введите корректную сумму');
        
        const finalAmount = type === 'add' ? val : -val;
        const reason = type === 'add' ? `Бонус/Начисление (Тикет)` : `Списание (Тикет)`;

        if (!confirm(`Вы уверены, что хотите ${type === 'add' ? 'начислить' : 'списать'} ${val}₽?`)) return;

        setIsAdjusting(true);
        try {
            await adjustBalanceAction(userId, finalAmount, reason);
            toast.success('Баланс успешно обновлен');
            setAmount('');
        } catch (e: any) {
            toast.error('Ошибка: ' + e.message);
        } finally {
            setIsAdjusting(false);
        }
    };

    const handleRefund = async () => {
        if (!orderId) return;
        if (!confirm('Вы уверены, что хотите отменить этот заказ и вернуть средства пользователю?')) return;
        
        setIsRefunding(true);
        try {
            await refundOrderAction(orderId);
            toast.success('Заказ отменен, средства возвращены');
        } catch (e: any) {
            toast.error('Ошибка возврата: ' + e.message);
        } finally {
            setIsRefunding(false);
        }
    };

    const canRefund = orderId && orderStatus && !['CANCELED', 'COMPLETED', 'CANCELED_API'].includes(orderStatus);

    return (
        <div className="bg-slate-50 rounded-lg p-5 border border-slate-100 shadow-sm space-y-4">
            <h5 className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-1.5">
                <Coins size={14} className="text-emerald-500" /> Управление балансом
            </h5>
            
            <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₽</span>
                    <input 
                        type="number" 
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                </div>
                <button 
                    onClick={() => handleAdjust('add')}
                    disabled={isAdjusting || !amount}
                    title="Начислить"
                    className="p-2 h-[38px] w-[38px] flex items-center justify-center bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors disabled:opacity-50"
                >
                    {isAdjusting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                </button>
                <button 
                    onClick={() => handleAdjust('deduct')}
                    disabled={isAdjusting || !amount}
                    title="Списать"
                    className="p-2 h-[38px] w-[38px] flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors disabled:opacity-50"
                >
                    {isAdjusting ? <Loader2 size={16} className="animate-spin" /> : <Minus size={16} />}
                </button>
            </div>

            {canRefund && (
                <button 
                    onClick={handleRefund}
                    disabled={isRefunding}
                    className="w-full py-2.5 bg-amber-50 text-amber-700 text-xs font-bold rounded-md hover:bg-amber-100 transition-colors flex items-center justify-center gap-2 border border-amber-200 disabled:opacity-50"
                >
                    {isRefunding ? <Loader2 size={14} className="animate-spin" /> : <Undo2 size={14} />}
                    Возврат за активный заказ тикета
                </button>
            )}
        </div>
    );
}
