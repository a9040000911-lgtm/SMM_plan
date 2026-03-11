/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { 
  FileStack, 
  ArrowLeft,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';
import { TemplateEditor } from '@/components/admin/support/template-editor';

export const dynamic = 'force-dynamic';

async function getTemplates() {
  return await prisma.supportTemplate.findMany({
    orderBy: { updatedAt: 'desc' }
  });
}

export default async function SupportTemplatesPage() {
  const templates = await getTemplates();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/support" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <ArrowLeft size={20} className="text-slate-600" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <FileStack className="text-blue-500" />
              Шаблоны ответов
            </h2>
            <p className="text-sm text-slate-500">Готовые заготовки для быстрой работы поддержки.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Кнопка создания */}
        <TemplateEditor />

        {templates.map((t) => (
          <div key={t.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <BookOpen size={10} />
                  Тема
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <TemplateEditor editMode initialData={t} />
                </div>
              </div>
              <h4 className="font-black text-slate-800">{t.title}</h4>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-4 italic">
                «{t.content}»
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-50 text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
              Последнее изменение: {new Date(t.updatedAt).toLocaleDateString()}
            </div>
          </div>
        ))}

        {templates.length === 0 && (
            <div className="col-span-full py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
                <FileStack size={48} className="mb-4 opacity-20" />
                <p className="font-bold">База шаблонов пуста</p>
                <p className="text-xs">Создайте свой первый быстрый ответ</p>
            </div>
        )}
      </div>
    </div>
  );
}
