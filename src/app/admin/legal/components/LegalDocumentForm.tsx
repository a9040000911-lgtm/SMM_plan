'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2, Bold, Italic, Heading1 } from 'lucide-react';
import { useLanguage } from '@/providers/language-provider';

interface Props {
    projectId: string;
    initialData?: any;
    onCancel?: () => void;
}

const PRESETS = [
    { name_ru: 'Оферта', name_en: 'Offer', title_ru: 'Публичная оферта', title_en: 'Public Offer', content_ru: '1. ОБЩИЕ ПОЛОЖЕНИЯ...\n2. ПРЕДМЕТ ДОГОВОРА...\n3. ПОРЯДОК ОПЛАТЫ...', content_en: '1. GENERAL PROVISIONS...\n2. SUBJECT OF THE AGREEMENT...\n3. PAYMENT PROCEDURE...' },
    { name_ru: 'Политика', name_en: 'Policy', title_ru: 'Политика конфиденциальности', title_en: 'Privacy Policy', content_ru: 'Настоящая политика описывает порядок обработки персональных данных...\n\n1. КАКИЕ ДАННЫЕ МЫ СОБИРАЕМ...\n2. ЦЕЛИ СБОРА...', content_en: 'This policy describes the procedure for processing personal data...\n\n1. WHAT DATA WE COLLECT...\n2. PURPOSES OF COLLECTION...' },
    { name_ru: 'Условия', name_en: 'Terms', title_ru: 'Условия использования', title_en: 'Terms of Use', content_ru: 'Используя данный сервис, вы соглашаетесь с...\n\n1. ПРАВИЛА ПОВЕДЕНИЯ...\n2. ОТВЕТСТВЕННОСТЬ...', content_en: 'By using this service, you agree to...\n\n1. RULES OF CONDUCT...\n2. RESPONSIBILITY...' }
];

export function LegalDocumentForm({ projectId, initialData, onCancel }: Props) {
    const { t, lang } = useLanguage();
    const lf = t.admin.legal_ui.form;
    const router = useRouter();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formState, setFormState] = useState({
        title: initialData?.title || '',
        slug: initialData?.slug || '',
        content: initialData?.content || ''
    });

    const applyPreset = (preset: any) => {
        setFormState({
            ...formState,
            title: lang === 'ru' ? preset.title_ru : preset.title_en,
            content: lang === 'ru' ? preset.content_ru : preset.content_en
        });
    };

    const insertFormatting = (tag: string) => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);

        let replacement = '';
        if (tag === 'b') replacement = `<b>${selectedText}</b>`;
        if (tag === 'i') replacement = `<i>${selectedText}</i>`;
        if (tag === 'h') replacement = `\n\n<b>[ ${selectedText || 'ЗАГОЛОВОК'} ]</b>\n`;

        const newValue = text.substring(0, start) + replacement + text.substring(end);
        setFormState({ ...formState, content: newValue });

        // Возвращаем фокус
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + 3, start + 3 + (selectedText.length || 0));
        }, 0);
    };

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const data: any = {
            projectId,
            slug: formState.slug,
            title: formState.title,
            content: formState.content,
            isActive: (e.currentTarget.elements.namedItem('isActive') as HTMLInputElement).checked
        };

        if (initialData?.id) data.id = initialData.id;

        try {
            const res = await fetch('/api/admin/legal', {
                method: initialData ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || lf.saving_error);

            router.refresh();
            if (onCancel) onCancel();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ПРЕСЕТЫ */}
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lf.presets_label}</label>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map(p => (
                        <button
                            key={p.name_ru}
                            type="button"
                            onClick={() => applyPreset(p)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold uppercase transition-all"
                        >
                            + {lang === 'ru' ? p.name_ru : p.name_en}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lf.title_label}</label>
                <input
                    name="title"
                    required
                    value={formState.title}
                    onChange={e => setFormState({ ...formState, title: e.target.value })}
                    placeholder={lf.title_placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{lf.slug_label}</label>
                <input
                    name="slug"
                    required
                    value={formState.slug}
                    onChange={e => setFormState({ ...formState, slug: e.target.value })}
                    placeholder={lf.slug_placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all overflow-hidden text-blue-600 font-bold"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lf.content_label}</label>
                    <div className="flex items-center gap-1">
                        <button type="button" onClick={() => insertFormatting('b')} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-all" title="Bold">
                            <Bold size={14} />
                        </button>
                        <button type="button" onClick={() => insertFormatting('i')} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-all" title="Italic">
                            <Italic size={14} />
                        </button>
                        <button type="button" onClick={() => insertFormatting('h')} className="p-1.5 hover:bg-slate-100 rounded-md text-slate-600 transition-all" title="Header">
                            <Heading1 size={14} />
                        </button>
                    </div>
                </div>
                <textarea
                    ref={textareaRef}
                    name="content"
                    required
                    rows={12}
                    value={formState.content}
                    onChange={e => setFormState({ ...formState, content: e.target.value })}
                    placeholder={lf.content_placeholder}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none leading-relaxed font-medium"
                />
            </div>

            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <input type="checkbox" name="isActive" id="isActive" defaultChecked={initialData ? initialData.isActive : true} className="w-5 h-5 rounded-md border-slate-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700 cursor-pointer">{lf.publish_label}</label>
            </div>

            {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-xl">{error}</div>}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
            >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {initialData ? lf.save_btn : lf.create_btn}
            </button>
        </form>
    );
}
