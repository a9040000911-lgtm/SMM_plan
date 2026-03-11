/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { prisma } from '@/lib/prisma';
import {
  Zap,
  ArrowLeft,
  MessageSquare,
  Undo2,
  Lock,
  Gift,
  Ticket
} from 'lucide-react';
import Link from 'next/link';
import { MacroEditor } from '@/components/admin/support/macro-editor';

export const dynamic = 'force-dynamic';

async function getInitialData() {
  const macros = await prisma.supportMacro.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const promos = await prisma.promoCode.findMany({
    where: { isActive: true },
    select: { id: true, code: true, discountPercent: true }
  });

  return { macros, promos };
}

export default async function SupportMacrosPage() {
  const { macros, promos } = await getInitialData();

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'SEND_MESSAGE': return <MessageSquare size={12} className="text-blue-500" />;
      case 'REFUND_LAST_ORDER': return <Undo2 size={12} className="text-rose-500" />;
      case 'CLOSE_TICKET': return <Lock size={12} className="text-slate-500" />;
      case 'ADD_BONUS': return <Gift size={12} className="text-emerald-500" />;
      case 'GIVE_PROMOCODE': return <Ticket size={12} className="text-purple-500" />;
      default: return null;
    }
  };

  const getActionLabel = (action: any) => {
    switch (action.type) {
      case 'SEND_MESSAGE': return 'Отправить текст';
      case 'REFUND_LAST_ORDER': return 'Вернуть деньги';
      case 'CLOSE_TICKET': return 'Закрыть тикет';
      case 'ADD_BONUS': return `Бонус ${action.amount}₽`;
      case 'GIVE_PROMOCODE': return `Промокод: ${action.promoCode || 'ID:' + action.promoId}`;
      default: return action.type;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/support" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Zap className="text-amber-500" fill="currentColor" size={20} />
              Конструктор макросов
            </h2>
            <p className="text-sm text-slate-500">Автоматизация цепочек действий для поддержки.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[13px]">
        {/* Кнопка создания */}
        <MacroEditor availablePromos={promos} />

        {macros.map((m) => (
          <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">Macro Engine</span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MacroEditor editMode initialData={m} availablePromos={promos} />
                </div>
              </div>

              <div>
                <h4 className="font-black text-slate-800 text-lg leading-tight">{m.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{m.description || 'Быстрое решение проблемы'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {(m.actions as any[]).map((action, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl">
                    {getActionIcon(action.type)}
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{getActionLabel(action)}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic text-xs text-slate-500 line-clamp-2 leading-relaxed">
                «{m.text}»
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
