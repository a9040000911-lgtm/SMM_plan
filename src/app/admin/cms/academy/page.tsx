"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Visionary CMS Studio: Academy Articles
 */

import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit3, 
    Trash2,
    Filter,
    FileText,
    Globe,
    Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    getAcademyArticlesAction, 
    deleteAcademyArticleAction, 
    getActiveProjectIdAction 
} from './actions';
import { toast } from 'sonner';

export default function AcademyPage() {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [projectId, setProjectId] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            const id = await getActiveProjectIdAction();
            setProjectId(id);
            if (id) {
                try {
                    const data = await getAcademyArticlesAction(id);
                    setArticles(data);
                } catch (e: any) {
                    toast.error(e.message);
                }
            }
            setLoading(false);
        };
        init();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Вы уверены, что хотите удалить эту статью?')) return;
        try {
            await deleteAcademyArticleAction(id);
            setArticles(prev => prev.filter(a => a.id !== id));
            toast.success('Статья удалена');
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const filtered = articles.filter(a => 
        a.title.toLowerCase().includes(search.toLowerCase()) || 
        a.category.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Статьи Академии</h2>
                    <p className="text-slate-500 text-sm mt-1 font-medium italic">Управляйте базой знаний вашего проекта</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={16} />
                        <input 
                            type="text" 
                            placeholder="Поиск по статьям..." 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-[#0f141e]/50 border border-white/5 rounded-xl pl-10 pr-6 py-2.5 text-xs font-bold w-64 focus:ring-2 focus:ring-blue-500/20 transition-all text-white outline-none"
                        />
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                        <Plus size={16} /> Новая статья
                    </button>
                    <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-slate-400 transition-all">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* --- ARTICLES GRID --- */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-[#0f141e]/30 rounded-[2.5rem] border border-white/5" />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-[#0f141e]/30 border-2 border-dashed border-white/5 rounded-[3rem] p-20 flex flex-col items-center text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-slate-600 mb-6">
                        <FileText size={40} />
                    </div>
                    <h4 className="text-xl font-black text-slate-300">Статей пока нет</h4>
                    <p className="text-sm text-slate-500 mt-2 max-w-xs font-medium">Создайте первую статью, чтобы наполнить Академию полезным контентом.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filtered.map((article, i) => (
                            <motion.div
                                key={article.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-[#0f141e]/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden group hover:border-blue-500/30 transition-all duration-500 relative"
                            >
                                {/* Status Badge */}
                                <div className="absolute top-6 left-6 z-10">
                                    {article.isPublished ? (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-500/20">
                                            <Globe size={10} /> Published
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-500/20">
                                            <Lock size={10} /> Draft
                                        </span>
                                    )}
                                </div>

                                {/* Preview / Image Placeholder */}
                                <div className="h-44 bg-gradient-to-br from-slate-900 to-[#1a1f2e] relative overflow-hidden">
                                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
                                     <div className="absolute inset-0 flex items-center justify-center">
                                         <FileText className="text-white/5 group-hover:scale-110 transition-transform duration-700" size={80} />
                                     </div>
                                </div>

                                <div className="p-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{article.category}</span>
                                        <div className="w-1 h-1 bg-slate-700 rounded-full" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{article.readTime} min read</span>
                                    </div>
                                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors leading-tight mb-4">
                                        {article.title}
                                    </h3>
                                    
                                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10" />
                                            <span className="text-[10px] font-bold text-slate-400 tracking-tight">@{article.author?.username || 'admin'}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
                                                <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(article.id)} className="p-2.5 bg-red-500/5 hover:bg-red-500/20 rounded-xl text-red-500/50 hover:text-red-500 transition-all">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
