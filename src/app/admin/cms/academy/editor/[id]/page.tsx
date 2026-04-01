"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Academy Article Editor with TipTap
 */

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Save, ChevronLeft, Globe, Eye,
    Loader2, Hash, FileText,
    Activity, Clock, User
} from 'lucide-react';
// BlockEditor (TipTap) stubbed — dependencies not yet installed.
// TODO: npm install @tiptap/react @tiptap/starter-kit etc., then restore import.
const BlockEditor = ({ initialContent, onChange, placeholder }: any) => (
    <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8">
        <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-4">⚠ TipTap Editor не установлен</p>
        <textarea
            rows={20}
            defaultValue={initialContent ? JSON.stringify(initialContent, null, 2) : ''}
            onChange={(e: any) => { try { onChange?.(JSON.parse(e.target.value)); } catch {} }}
            placeholder={placeholder}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 text-sm text-white font-mono outline-none resize-none min-h-[400px]"
        />
    </div>
);
import { 
    getAcademyArticlesAction, 
    upsertAcademyArticleAction 
} from '../../actions';
import { toast } from 'sonner';
import { cn } from '@/utils/ui';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ projectId?: string }>;
}

export default function AcademyEditorPage({ params, searchParams }: PageProps) {
    const { id } = use(params);
    const { projectId } = use(searchParams);
    const router = useRouter();

    const [loading, setLoading] = useState(id !== 'new');
    const [saving, setSaving] = useState(false);
    const [article, setArticle] = useState<any>({
        title: '',
        slug: '',
        description: '',
        content: null,
        category: 'Guide',
        readTime: 5,
        isPublished: false
    });

    useEffect(() => {
        if (id !== 'new' && projectId) {
            loadArticle();
        }
    }, [id, projectId]);

    const loadArticle = async () => {
        try {
            const articles = await getAcademyArticlesAction(projectId!);
            const found = articles.find((a: any) => a.id === id);
            if (found) setArticle(found);
            else toast.error('Статья не найдена');
        } catch (err) {
            toast.error('Ошибка при загрузке статьи');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!article.title || !article.slug) {
            toast.error('Заголовок и Slug обязательны');
            return;
        }

        setSaving(true);
        try {
            await upsertAcademyArticleAction(projectId!, article);
            toast.success('Статья сохранена');
            if (id === 'new') router.push(`/admin/cms/academy?projectId=${projectId}`);
        } catch (err: any) {
            toast.error(err.message || 'Ошибка при сохранении');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-blue-500" size={40} />
        </div>
    );

    return (
        <div className="space-y-12">
            {/* Action Bar */}
            <div className="flex items-center justify-between sticky top-0 z-[50] bg-[#02040a]/80 backdrop-blur-xl py-4 border-b border-white/5">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                >
                    <div className="p-2 bg-white/5 rounded-xl group-hover:-translate-x-1 transition-transform">
                        <ChevronLeft size={18} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest">Назад в Академию</span>
                </button>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white/5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors">
                        <Eye size={16} /> Предпросмотр
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Сохранить
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-12">
                {/* Main Content Area */}
                <div className="space-y-12">
                     <div className="space-y-6">
                        <input 
                            type="text"
                            placeholder="Заголовок статьи..."
                            value={article.title}
                            onChange={(e) => setArticle({...article, title: e.target.value})}
                            className="w-full bg-transparent border-none text-5xl md:text-6xl font-black tracking-tighter text-white placeholder:text-white/10 outline-none"
                        />
                        <div className="flex flex-wrap items-center gap-4 opacity-40">
                             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                 <Clock size={14} /> {article.readTime} МИН ЧТЕНИЯ
                             </div>
                             <div className="w-1 h-1 bg-white/40 rounded-full" />
                             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                                 <User size={14} /> ВЫ (Админ)
                             </div>
                        </div>
                     </div>

                     <BlockEditor 
                        initialContent={article.content}
                        onChange={(content: any) => setArticle({...article, content})}
                        placeholder="Напишите историю успеха или руководство..."
                     />
                </div>

                {/* Sidebar Settings */}
                <div className="space-y-8 sticky top-24">
                     {/* Article Settings Card */}
                     <div className="glass p-8 rounded-[2.5rem] border-white/5 space-y-8">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                                 <Globe size={18} />
                             </div>
                             <h4 className="text-sm font-black uppercase tracking-widest">Настройки публикации</h4>
                         </div>

                         <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                                    <Hash size={12} /> Slug (URL-путь)
                                </label>
                                <input 
                                    type="text"
                                    value={article.slug}
                                    onChange={(e) => setArticle({...article, slug: e.target.value})}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500/30 transition-all font-mono"
                                    placeholder="kak-podnyat- охваты"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                                    <Activity size={12} /> Категория
                                </label>
                                <select 
                                    value={article.category}
                                    onChange={(e) => setArticle({...article, category: e.target.value})}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500/30 transition-all appearance-none"
                                >
                                    <option value="Guide">Руководство</option>
                                    <option value="Success Story">История успеха</option>
                                    <option value="Update">Обновление</option>
                                    <option value="Promotion">Продвижение</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 ml-2">
                                    <FileText size={12} /> Краткое описание
                                </label>
                                <textarea 
                                    rows={4}
                                    value={article.description}
                                    onChange={(e) => setArticle({...article, description: e.target.value})}
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm font-bold text-white outline-none focus:border-blue-500/30 transition-all resize-none"
                                    placeholder="О чем эта статья?"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                 <div className="space-y-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest">Статус</div>
                                    <div className="text-[9px] font-bold text-slate-500">{article.isPublished ? 'Опубликовано' : 'Черновик'}</div>
                                 </div>
                                 <button 
                                    onClick={() => setArticle({...article, isPublished: !article.isPublished})}
                                    className={cn(
                                        "w-12 h-6 rounded-full relative transition-colors p-1",
                                        article.isPublished ? "bg-blue-600" : "bg-white/10"
                                    )}
                                 >
                                     <div className={cn(
                                         "w-4 h-4 bg-white rounded-full transition-transform",
                                         article.isPublished ? "translate-x-6" : "translate-x-0"
                                     )} />
                                 </button>
                            </div>
                         </div>
                     </div>

                     {/* AI Insight Card */}
                     <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 p-8 rounded-[2.5rem] border border-blue-500/20">
                         <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">AI SMM Ассистент</h5>
                         <p className="text-xs text-blue-100/60 font-medium leading-relaxed italic">
                             "Я проанализировал вашу статью. Заголовок отличный, но я рекомендую добавить больше ключевых слов про Telegram ботов для лучшего SEO."
                         </p>
                     </div>
                </div>
            </div>
        </div>
    );
}
