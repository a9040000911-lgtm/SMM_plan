'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, X, Loader2 } from 'lucide-react';
import { createTemplateAction, updateTemplateAction, deleteTemplateAction } from '@/app/admin/support/templates/actions';

export function TemplateEditor({ 
  editMode = false, 
  initialData = null 
}: { 
  editMode?: boolean, 
  initialData?: any 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsBusy(true);
    try {
      if (editMode && initialData) {
        await updateTemplateAction(initialData.id, title, content);
      } else {
        await createTemplateAction(title, content);
        setTitle('');
        setContent('');
      }
      setIsOpen(false);
    } catch (_e) {
      alert('Ошибка: ' + (_e as any).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Удалить этот шаблон?')) return;
    setIsBusy(true);
    try {
      await deleteTemplateAction(initialData.id);
      setIsOpen(false);
    } catch (_e) {
      alert('Ошибка удаления');
      setIsBusy(false);
    }
  };

  if (!isOpen) {
    return editMode ? (
      <button onClick={() => setIsOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
        <Edit3 size={16} />
      </button>
    ) : (
      <button 
        onClick={() => setIsOpen(true)}
        className="h-full min-h-[160px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-blue-300 hover:text-blue-500 hover:bg-blue-50 transition-all group"
      >
        <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
            <Plus size={24} />
        </div>
        <span className="text-xs font-black uppercase tracking-widest">Создать шаблон</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800">
                {editMode ? 'Редактировать шаблон' : 'Новый шаблон'}
              </h3>
              <button type="button" onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Название (для сотрудников)</label>
                <input 
                  type="text" required value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Например: Задержка выполнения"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Текст ответа (увидит клиент)</label>
                <textarea 
                  required rows={6} value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Здравствуйте! Ваш заказ в работе, пожалуйста ожидайте..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            {editMode && (
              <button 
                type="button" onClick={handleDelete} disabled={isBusy}
                className="p-3 text-rose-600 hover:bg-rose-100 rounded-2xl transition-colors"
              >
                <Trash2 size={20} />
              </button>
            )}
            <div className="flex gap-3 ml-auto">
                <button 
                    type="button" onClick={() => setIsOpen(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-500"
                >
                    Отмена
                </button>
                <button 
                    type="submit" disabled={isBusy}
                    className="flex items-center gap-2 px-8 py-3 bg-slate-900 text-white rounded-2xl text-sm font-black hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all"
                >
                    {isBusy ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Сохранить
                </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
