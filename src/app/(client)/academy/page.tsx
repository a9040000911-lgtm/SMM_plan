'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { ACADEMY_ARTICLES } from '@/configs/academy-content';
import { 
    BookOpen, 
    ArrowRight, 
    Clock, 
    Send, 
    Instagram, 
    Youtube, 
    Video, 
    ShieldCheck,
    LayoutGrid,
    Gamepad2,
    MessageSquareMore
} from 'lucide-react';
import { cn } from '@/utils/ui';

const CATEGORIES = [
    { id: 'all', label: 'Все статьи', icon: LayoutGrid },
    { id: 'Telegram', label: 'Telegram', icon: Send, color: 'text-blue-500' },
    { id: 'Instagram', label: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'YouTube', label: 'YouTube', icon: Youtube, color: 'text-red-500' },
    { id: 'TikTok', label: 'TikTok', icon: Video, color: 'text-slate-900' },
    { id: 'VK', label: 'ВКонтакте', icon: MessageSquareMore, color: 'text-blue-600' },
    { id: 'Steam', label: 'Steam', icon: Gamepad2, color: 'text-slate-500' },
    { id: 'Безопасность', label: 'Безопасность', icon: ShieldCheck, color: 'text-emerald-500' },
];

export default function AcademyPage() {
    const [activeCategory, setActiveCategory] = useState('all');

    const filteredArticles = useMemo(() => {
        if (activeCategory === 'all') return ACADEMY_ARTICLES;
        return ACADEMY_ARTICLES.filter(a => a.category === activeCategory);
    }, [activeCategory]);

    return (
        <div className="w-full pb-32 pt-12">
            <div className="max-w-7xl mx-auto px-6">
                {/* Hero Header */}
                <div className="relative mb-8 bg-slate-900 rounded-[3rem] py-20 px-10 border border-slate-800 overflow-hidden text-center">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
                    
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest mb-6 italic">
                            <BookOpen size={14} /> SMM Knowledge Library 2026
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white mb-6 uppercase tracking-tighter italic">
                            Библиотека <span className="text-blue-500 not-italic">знаний</span>
                        </h1>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            Выберите платформу, чтобы изучить проверенные стратегии продвижения и секреты алгоритмов. 
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                activeCategory === cat.id 
                                    ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20 scale-105" 
                                    : "bg-white border border-slate-200 text-slate-500 hover:border-blue-500/30 hover:text-blue-600"
                            )}
                        >
                            <cat.icon size={14} className={activeCategory === cat.id ? "text-white" : cat.color} />
                            {cat.label}
                        </button>
                    ))}
                </div>

                {/* Articles Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredArticles.map((article) => {
                        const Icon = CATEGORIES.find(c => c.id === article.category)?.icon || BookOpen;
                        const iconColor = CATEGORIES.find(c => c.id === article.category)?.color || 'text-slate-400';
                        
                        return (
                            <Link 
                                key={article.slug} 
                                href={`/academy/${article.slug}`}
                                className="group block bg-white rounded-[2.5rem] border border-slate-100 p-8 hover:border-blue-500/20 hover:shadow-2xl hover:shadow-blue-500/5 transition-all relative overflow-hidden h-full"
                            >
                                <div className="flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white transition-colors", iconColor.replace('text-', 'bg-').split('-')[0] + '-500/10')}>
                                               <Icon size={16} className={iconColor} />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                                                {article.category}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-blue-500 transition-colors">
                                            <Clock size={12} />
                                            <span className="text-[9px] font-bold uppercase">{article.readTime}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors leading-tight">
                                        {article.title}
                                    </h3>
                                    <p className="text-slate-500 text-sm leading-relaxed mb-8 grow">
                                        {article.description}
                                    </p>

                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500 group-hover:translate-x-1 transition-transform">
                                        Изучить стратегию <ArrowRight size={14} />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {filteredArticles.length === 0 && (
                    <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <BookOpen className="text-slate-300" size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Статей в этом разделе пока нет</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto">
                            Мы работаем над наполнением этого раздела. Совсем скоро здесь появятся эксклюзивные стратегии 2026.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
