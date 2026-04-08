import React from 'react';
import { GLOSSARY_TERMS } from '@/data/kb-content';
import { HelpCircle } from 'lucide-react';

export function KBTextParser({ text }: { text: string }) {
    // Escape regex special chars in terms
    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const terms = Object.keys(GLOSSARY_TERMS).sort((a, b) => b.length - a.length); // match longest first
    if (terms.length === 0 || !text) return <>{text}</>;

    const pattern = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi');
    
    const parts = text.split(pattern);

    return (
        <>
            {parts.map((part, i) => {
                const lowerPart = part.toLowerCase();
                const termKey = terms.find(t => t.toLowerCase() === lowerPart);

                if (termKey) {
                    return (
                        <span key={i} className="relative inline-block group">
                            <span className="border-b border-dashed border-blue-400 text-slate-800 font-bold cursor-help transition-colors hover:text-blue-600 hover:border-blue-600">
                                {part}
                            </span>
                            {/* Tooltip */}
                            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-900 rounded-xl shadow-xl text-white text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none scale-95 group-hover:scale-100 origin-bottom block">
                                <span className="font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1 text-[9px]">
                                    <HelpCircle size={10} /> Глоссарий
                                </span>
                                <span className="leading-relaxed font-medium block">
                                    {GLOSSARY_TERMS[termKey]}
                                </span>
                                {/* Arrow */}
                                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 block" />
                            </span>
                        </span>
                    );
                }
                
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}
