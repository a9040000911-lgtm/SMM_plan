import React from 'react';
import { notFound } from 'next/navigation';
import { getArticleBySlug } from '@/configs/academy-content';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Clock, Share2, FlaskConical, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);
    if (!article) return { title: 'Статья не найдена' };

    return {
        title: `${article.title} | Академия Smmplan`,
        description: article.description
    };
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    const article = getArticleBySlug(slug);

    if (!article) notFound();

    // JSON-LD for Article
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.description,
        author: {
            '@type': 'Organization',
            name: 'Smmplan Editorial'
        },
        publisher: {
            '@type': 'Organization',
            name: 'Smmplan'
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `https://smmplan.pro/academy/${slug}`
        }
    };

    return (
        <div className="w-full pb-32 pt-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />
            
            <div className="max-w-4xl mx-auto px-6">
                <Link 
                    href="/academy" 
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest mb-12 transition-colors group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Назад в Академию
                </Link>

                <header className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                            {article.category}
                        </span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                            <Clock size={12} />
                            <span className="text-[9px] font-bold uppercase">{article.readTime} чтения</span>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 leading-[1.1] tracking-tight">
                        {article.title}
                    </h1>

                    <div className="flex items-center justify-between py-6 border-y border-slate-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                <BookOpen size={20} />
                            </div>
                            <div className="flex flex-col leading-tight">
                                <span className="text-[11px] font-black text-slate-900 uppercase">Smmplan Editorial</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">Экспертный гайд</span>
                            </div>
                        </div>
                        <button className="p-3 rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
                            <Share2 size={18} />
                        </button>
                    </div>
                </header>

                {/* Scientific Metadata / Fact Check */}
                <div className="flex flex-wrap items-center gap-6 mb-12 py-6 border-b border-slate-100">
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Fact-Checked by Smmplan AI
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-100">
                        <FlaskConical size={14} className="text-blue-500" />
                        Scientific IR Optimized
                    </div>
                    <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest ml-auto">
                        ID: {article.slug.slice(0, 8)}
                    </div>
                </div>

                <article className="prose prose-slate max-w-none mb-20">
                    {article.content}
                </article>

                {/* Recommended Services CTA */}
                <div className="p-[2px] bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(37,99,235,0.2)] group my-24 mx-1">
                    <div className="bg-white rounded-[2.95rem] p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-32 -mt-32 blur-3xl opacity-50 transition-all group-hover:bg-blue-100" />
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
                            <div className="flex-1 text-center md:text-left">
                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                                    <Zap size={10} fill="currentColor" /> Мгновенный рост в {article.category}
                                </div>
                                <h3 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tighter mb-4">
                                    Готовы к результатам?
                                </h3>
                                <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                                    Используйте наши проверенные инструменты для безопасного и быстрого набора охватов. 100% гарантия результата.
                                </p>
                            </div>
                            
                            <Link 
                                href={`/catalog?platform=${article.category.toLowerCase()}`}
                                className="group/btn"
                            >
                                <button className="px-10 py-6 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 flex items-center gap-3">
                                    Заказать {article.category}
                                    <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-1" />
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Secondary Back Link */}
                <div className="mt-16 text-center">
                    <Link 
                        href="/academy" 
                        className="text-slate-400 hover:text-blue-500 text-[10px] font-black uppercase tracking-widest transition-colors"
                    >
                        Вернуться к списку статей
                    </Link>
                </div>
            </div>
        </div>
    );
}
