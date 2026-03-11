'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { MessageSquare, Send, Loader2, StickyNote, Save } from 'lucide-react';
import { sendMessageToUserAction, updateSupportNotesAction } from '@/app/admin/support/actions';

export function SupportMessenger({ 
  userId, 
  initialNotes 
}: { 
  userId: string, 
  initialNotes: string | null 
}) {
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState(initialNotes || '');
  const [isSending, setIsSending] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      await sendMessageToUserAction(userId, message);
      alert('Сообщение успешно отправлено пользователю в Telegram!');
      setMessage('');
    } catch (e) {
      alert('Ошибка при отправке: ' + (e as any).message);
    } finally {
      setIsSending(false);
    }
  };

  const templates = [
    { label: 'Закрыт профиль', text: 'Здравствуйте! Ваш профиль закрыт приватностью. Пожалуйста, откройте его, чтобы мы могли выполнить заказ.' },
    { label: 'Битая ссылка', text: 'Добрый день! Указанная вами ссылка не открывается. Пожалуйста, проверьте её корректность.' },
    { label: 'Задержка', text: 'Ваш заказ находится на проверке у провайдера. Пожалуйста, ожидайте, выполнение начнется в ближайшее время.' },
    { label: 'Возврат сделан', text: 'Средства за проблемный заказ возвращены на ваш баланс. Приносим извинения за неудобства.' },
  ];

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      await updateSupportNotesAction(userId, notes);
      alert('Заметки обновлены');
    } catch (e) {
      alert('Ошибка при сохранении: ' + (e as any).message);
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      {/* ПРЯМАЯ СВЯЗЬ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <MessageSquare size={18} className="text-blue-500" />
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-widest">Написать клиенту</h3>
        </div>
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div className="flex flex-wrap gap-2 mb-2">
            {templates.map((t) => (
              <button 
                key={t.label}
                onClick={() => setMessage(t.text)}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-100 transition-colors border border-blue-100"
              >
                {t.label}
              </button>
            ))}
          </div>
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Введите сообщение для отправки в Telegram..."
            className="w-full flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[120px]"
          />
          <button 
            onClick={handleSendMessage}
            disabled={isSending || !message.trim()}
            className="w-full py-3 bg-slate-900 text-white rounded-xl text-sm font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            Отправить в Telegram
          </button>
        </div>
      </div>

      {/* ВНУТРЕННИЕ ЗАМЕТКИ */}
      <div className="bg-amber-50/30 rounded-3xl border border-amber-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-amber-100 bg-amber-50 flex items-center gap-3">
          <StickyNote size={18} className="text-amber-600" />
          <h3 className="font-bold text-amber-800 text-xs uppercase tracking-widest">Служебные заметки</h3>
        </div>
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Информация для других сотрудников..."
            className="w-full flex-1 p-4 bg-white border border-amber-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 min-h-[120px]"
          />
          <button 
            onClick={handleSaveNotes}
            disabled={isSavingNotes}
            className="w-full py-3 bg-amber-600 text-white rounded-xl text-sm font-black hover:bg-amber-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSavingNotes ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            Сохранить заметки
          </button>
        </div>
      </div>
    </div>
  );
}
