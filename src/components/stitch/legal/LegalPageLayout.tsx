/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface LegalPageLayoutProps {
    title: string;
    lastUpdated: string;
    children: React.ReactNode;
}

export const LegalPageLayout = ({ title, lastUpdated, children }: LegalPageLayoutProps) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col pt-20">
            {/* Header Content Area */}
            <div className="bg-white border-b border-slate-100 py-12 px-6">
                <main className="max-w-3xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-8 group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Вернуться на главную
                    </Link>
                    <h1 className="text-4xl font-black tracking-tighter text-slate-900 mb-4">{title}</h1>
                    <p className="text-sm font-medium text-slate-400">
                        Последнее обновление: {lastUpdated}
                    </p>
                </main>
            </div>

            {/* Document Content Area */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
                <div className="bg-white rounded-[2rem] p-8 md:p-12 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] border border-slate-100/60">
                    <article className="prose prose-slate prose-blue max-w-none">
                        {children}
                    </article>
                </div>
            </main>
        </div>
    );
};


