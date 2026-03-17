/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { getClientProjectId } from '@/utils/project-resolver';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, FileText, Clock, ShieldCheck } from 'lucide-react';
import { sanitizeHtml } from '@/utils/sanitizer';
import { CmsService } from '@/services/cms/cms.service';

export const dynamic = 'force-dynamic';
export default async function LegalDocPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const projectId = await getClientProjectId();
    if (!projectId) return notFound();

    // Получаем текущий документ
    const docResult = await CmsService.getLegalDocument(projectId, slug);
    if (!docResult.success || !docResult.data.isActive) return notFound();
    const doc = docResult.data;

    // Получаем список всех активных документов для сайдбара
    const allDocsResult = await CmsService.getAllLegalDocuments(projectId);
    const allDocs = allDocsResult.success ? allDocsResult.data : [];

    return (
        <div className="flex flex-col lg:flex-row gap-12 py-8">
            {/* Sidebar Navigation */}
            <aside className="lg:w-1/4 space-y-6">
                <div className="sticky top-24">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                        <FileText size={14} /> Юридический раздел
                    </h3>
                    <nav className="space-y-2">
                        {allDocs.map((item: any) => (
                            <Link
                                key={item.slug}
                                href={`/docs/${item.slug}`}
                                className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all group ${item.slug === slug
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                    : 'bg-white text-slate-600 border-slate-100 hover:border-primary/30 hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-sm font-bold">{item.title}</span>
                                <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${item.slug === slug ? 'text-white/50' : 'text-slate-300'}`} />
                            </Link>
                        ))}
                    </nav>

                    <div className="mt-8 p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 space-y-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                            <ShieldCheck size={20} />
                        </div>
                        <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            Мы заботимся о вашей безопасности и прозрачности отношений. Все документы актуальны.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Document Content */}
            <main className="lg:w-3/4">
                <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden relative">
                    {/* Decorative Header */}
                    <div className="h-32 bg-gradient-to-r from-slate-900 to-slate-800 p-10 flex items-end relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>
                        <h1 className="text-2xl md:text-3xl font-black text-white relative z-10 tracking-tight leading-tight">
                            {doc.title}
                        </h1>
                    </div>

                    <div className="p-8 md:p-12 lg:p-16">
                        <div className="flex items-center gap-6 mb-10 text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-8">
                            <div className="flex items-center gap-1.5">
                                <Clock size={12} />
                                <span>Обновлено: {new Date(doc.updatedAt).toLocaleDateString('ru-RU')}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-blue-500 bg-blue-50 px-3 py-1 rounded-full">
                                <ShieldCheck size={12} />
                                <span>Официальный документ</span>
                            </div>
                        </div>

                        <div className="prose prose-slate max-w-none">
                            <div
                                className="text-slate-600 leading-loose text-base md:text-lg font-medium selection:bg-primary/10"
                                dangerouslySetInnerHTML={{
                                    __html: sanitizeHtml(doc.content.replace(/\n/g, '<br/>'))
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Footer simple */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-6 pb-12">
                    <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
                        © {new Date().getFullYear()} SMMPLAN. Все права защищены.
                    </div>
                    <div className="flex items-center gap-8">
                        <button onClick={() => typeof window !== 'undefined' && window.print()} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline cursor-pointer">
                            Распечатать PDF
                        </button>
                        <Link href="/support" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-600">
                            Возникли вопросы?
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
