'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Zap, X, Save, Loader2, MessageSquare, Undo2, Lock, Gift, Ticket } from 'lucide-react';
import { createMacroAction } from '@/app/admin/support/macros/actions';

const ACTION_TYPES = [
  { value: 'SEND_MESSAGE', label: 'Сообщение', icon: MessageSquare },
  { value: 'REFUND_LAST_ORDER', label: 'Возврат денег', icon: Undo2 },
  { value: 'CLOSE_TICKET', label: 'Закрыть тикет', icon: Lock },
  { value: 'ADD_BONUS', label: 'Начислить бонус', icon: Gift },
  { value: 'GIVE_PROMOCODE', label: 'Дать промокод', icon: Ticket },
];

export function MacroEditor({
  editMode = false,
  initialData = null,
  availablePromos = []
}: {
  editMode?: boolean,
  initialData?: any,
  availablePromos?: { id: string, code: string, discountPercent: number }[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [text, setText] = useState(initialData?.text || '');
  const [actions, setActions] = useState<any[]>(initialData?.actions || []);

  const handleAddAction = (type: string) => {
    if (type === 'ADD_BONUS') {
        const amount = prompt('Сумма бонуса (руб):', '50');
        if (!amount) return;
        setActions([...actions, { type, amount: parseFloat(amount) }]);
    } else if (type === 'GIVE_PROMOCODE') {
        if (availablePromos.length === 0) return alert('Нет активных промокодов');
        const promoList = availablePromos.map((p, i) => `${i + 1}. ${p.code} (-${p.discountPercent}%)`).join('\n');
        const choice = prompt(`Выберите промокод (1-${availablePromos.length}):\n${promoList}`);
        if (!choice) return;
        const index = parseInt(choice) - 1;
        const promo = availablePromos[index];
        if (promo) {
            setActions([...actions, { type, promoId: promo.id, promoCode: promo.code }]);
        }
    } else {
        setActions([...actions, { type }]);
    }
  };

  const removeAction = (idx: number) => {
    setActions(actions.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (actions.length === 0) return alert('Добавьте действия');
    setIsBusy(true);
    try {
      await createMacroAction({ title, text, actions });
      setTitle(''); setText(''); setActions([]);
      setIsOpen(false);
    } catch (e) {
      alert('Ошибка: ' + (e as any).message);
    } finally {
      setIsBusy(false);
    }
  };

  if (!isOpen) {
    return editMode ? (
      <button onClick={() => setIsOpen(true)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all">
        <Zap size={16} />
      </button>
    ) : (
      <button
        onClick={() => setIsOpen(true)}
        className="h-full min-h-[200px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-amber-300 hover:text-amber-600 transition-all group"
      >
        <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
            <Zap size={24} fill="currentColor" className="text-amber-400" />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">Создать макрос</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6 text-[13px]">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 italic">Macro Constructor</h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Название</label>
                  <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex justify-between">
                    <span>Сообщение</span>
                    <span className="text-blue-500 font-black italic">{'{promo}'} {'{username}'}</span>
                  </label>
                  <textarea required rows={6} value={text} onChange={(e) => setText(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 text-amber-600">Цепочка автоматизации</label>
                <div className="flex flex-wrap gap-2">
                  {ACTION_TYPES.map(a => (
                    <button key={a.value} type="button" onClick={() => handleAddAction(a.value)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold hover:border-blue-200 transition-all">
                      <a.icon size={12} className="text-blue-500" /> {a.label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-slate-900 rounded-2xl space-y-2 min-h-[120px]">
                  {actions.map((a, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-3 rounded-xl text-white group">
                      <span className="flex items-center gap-2 uppercase font-black text-[9px] tracking-widest">
                        <span className="text-slate-600">{idx + 1}</span> {a.type}
                        {a.amount ? <span className="text-emerald-400 ml-1">({a.amount}₽)</span> : ''}
                        {a.promoCode ? <span className="text-purple-400 ml-1">({a.promoCode})</span> : ''}
                      </span>
                      <button type="button" onClick={() => removeAction(idx)} className="text-rose-400 hover:text-rose-500"><X size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button type="submit" disabled={isBusy} className="flex items-center gap-2 px-12 py-4 bg-slate-900 text-white rounded-3xl text-sm font-black hover:bg-slate-800 shadow-xl transition-all">
              {isBusy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Деплой макроса
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


