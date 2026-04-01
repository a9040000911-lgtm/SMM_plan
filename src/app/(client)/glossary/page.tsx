import React from 'react';
import { Glossary } from '@/components/stitch/tools/Glossary';
import { HelpCircle, Sparkles } from 'lucide-react';

export default function GlossaryPage() {
    return (
        <main className="min-h-screen pt-32 pb-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-20">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] italic">Knowledge Base</span>
                        <Sparkles size={14} className="text-blue-500" />
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-950 tracking-tighter uppercase italic leading-none mb-6">
                        ГЛОССАРИЙ <span className="text-blue-600 not-italic">SMM 2026</span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Разбираемся в терминах, сленге и нюансах продвижения. 
                        Всё, что нужно знать новичку для безопасного и эффективного роста.
                    </p>
                </div>

                {/* Main Component */}
                <Glossary />

                {/* Footer Help */}
                <div className="mt-24 p-12 bg-slate-900 rounded-[3rem] text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 blur-[100px] -mr-32 -mt-32" />
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-white uppercase italic mb-4">Остались вопросы?</h2>
                        <p className="text-slate-400 max-w-xl mx-auto mb-8 font-medium">
                            Наша база знаний постоянно пополняется. Если вы встретили незнакомый термин в нашем сервисе — напишите в поддержку, и мы добавим его в глоссарий.
                        </p>
                        <a 
                            href="https://t.me/smmplan_support" 
                            target="_blank"
                            className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl"
                        >
                            <HelpCircle size={16} />
                            Задать вопрос эксперту
                        </a>
                    </div>
                </div>
            </div>
        </main>
    );
}
