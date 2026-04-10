/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import React from 'react';

export interface FaqItem {
    question: string;
    answer: string;
}

interface Props {
    faqs: FaqItem[];
    title?: string;
}

export const AiFaqBlock: React.FC<Props> = ({ faqs, title = "Часто задаваемые вопросы" }) => {
    if (!faqs || faqs.length === 0) return null;

    // Generate FAQPage Schema for AI Overviews
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
                "@type": "Answer",
                "text": faq.answer
            }
        }))
    };

    return (
        <section className="mt-16 w-full">
            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 mb-8 border-b border-slate-200 pb-4">
                {title}
            </h3>
            
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
            />

            <div className="space-y-4">
                {faqs.map((faq, idx) => (
                    <details 
                        key={idx} 
                        className="group bg-slate-50 border border-slate-200 rounded-3xl p-6 open:bg-white open:border-blue-200 open:shadow-lg transition-all"
                    >
                        <summary className="flex items-center justify-between cursor-pointer font-bold text-slate-900 group-open:text-blue-600 transition-colors list-none">
                            {faq.question}
                            <span className="shrink-0 ml-4 w-6 h-6 flex items-center justify-center bg-slate-200 rounded-full group-open:bg-blue-100 group-open:rotate-45 transition-transform text-slate-500 group-open:text-blue-600">+</span>
                        </summary>
                        <p className="mt-4 text-sm text-slate-600 leading-relaxed font-medium">
                            {faq.answer}
                        </p>
                    </details>
                ))}
            </div>
        </section>
    );
};
