/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { List, ChevronDown, ChevronRight } from 'lucide-react';
import type { KBModule } from '@/data/kb-content';
import { SECTION_METADATA } from '@/data/kb-content';

interface KBTableOfContentsProps {
  knowledgeBase: KBModule[];
  activeId: string | null;
}

export function KBTableOfContents({ knowledgeBase, activeId }: KBTableOfContentsProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [isCompact, setIsCompact] = useState(false);
  const tocRef = useRef<HTMLDivElement>(null);

  // Group modules by section
  const sections = useMemo(() => {
    const grouped = new Map<string, KBModule[]>();
    for (const mod of knowledgeBase) {
      if (!grouped.has(mod.section)) {
        grouped.set(mod.section, []);
      }
      grouped.get(mod.section)!.push(mod);
    }
    // Sort sections explicitly
    const order = ['GENERAL', 'PLATFORMS', 'ANTIFRAUD', 'SUPPORT', 'ADMIN'];
    return order.map(s => ({
      key: s as keyof typeof SECTION_METADATA,
      modules: grouped.get(s) || []
    })).filter(s => s.modules.length > 0);
  }, [knowledgeBase]);

  // Auto-expand module containing active item
  useEffect(() => {
    if (!activeId) return;
    for (const mod of knowledgeBase) {
      const hasActiveFunc = mod.functions.some(fn => fn.id === activeId);
      const hasActiveMacro = mod.macros?.some(m => m.id === activeId);
      if (hasActiveFunc || hasActiveMacro) {
        setExpandedModules(prev => new Set(prev).add(mod.id));
        break;
      }
    }
  }, [activeId, knowledgeBase]);

  const toggleModule = useCallback((moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsCompact(!isCompact)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-slate-800 text-white rounded-2xl shadow-2xl hover:bg-slate-700 transition-all"
        aria-label="Toggle Table of Contents"
      >
        <List size={24} />
      </button>

      {/* Mobile Overlay */}
      {isCompact && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm"
          onClick={() => setIsCompact(false)}
        />
      )}

      {/* TOC Panel */}
      <div
        ref={tocRef}
        className={`
          ${isCompact ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          fixed right-0 top-0 bottom-0 w-80 lg:w-72 xl:w-80
          lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)]
          bg-white lg:bg-transparent
          border-l lg:border-l-0 border-slate-200
          z-50 lg:z-0
          overflow-y-auto
          transition-transform lg:transition-none duration-300
          scrollbar-thin scrollbar-thumb-slate-200
          p-6 lg:pl-0
        `}
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl text-slate-500">
            <List size={16} />
          </div>
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Оглавление</h3>
        </div>

        <nav className="space-y-6">
          {sections.map(({ key, modules }) => {
            const meta = SECTION_METADATA[key];
            return (
              <div key={key}>
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={`w-2 h-2 rounded-full ${meta.colorClass.split(' ')[0]}`} />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{meta.title}</span>
                </div>

                {/* Modules list for this section */}
                <div className="space-y-1">
                  {modules.map((mod) => {
                    const isExpanded = expandedModules.has(mod.id);
                    const isModuleActive = mod.functions.some(fn => fn.id === activeId) ||
                                           (mod.macros && mod.macros.some(m => m.id === activeId));

                    return (
                      <div key={mod.id}>
                        <button
                          onClick={() => toggleModule(mod.id)}
                          className={`
                            w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all
                            ${isModuleActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}
                          `}
                        >
                          {isExpanded
                            ? <ChevronDown size={14} className="shrink-0 text-slate-400 mt-0.5" />
                            : <ChevronRight size={14} className="shrink-0 text-slate-400 mt-0.5" />
                          }
                          <span className="text-xs font-bold leading-snug">{mod.title.split(':')[0]}</span>
                        </button>

                        {isExpanded && (
                          <div className="ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5 mt-1 mb-2">
                            {mod.functions.map((fn) => (
                              <button
                                key={fn.id}
                                onClick={() => { scrollTo(fn.id); setIsCompact(false); }}
                                className={`
                                  w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all
                                  ${activeId === fn.id
                                    ? 'bg-blue-100 text-blue-700 font-bold'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}
                                `}
                              >
                                {fn.title}
                              </button>
                            ))}
                            {mod.macros && mod.macros.length > 0 && (
                              <>
                                <div className="px-3 pt-2 pb-1">
                                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Макросы</span>
                                </div>
                                {mod.macros.map((macro) => (
                                  <button
                                    key={macro.id}
                                    onClick={() => { scrollTo(macro.id); setIsCompact(false); }}
                                    className={`
                                      w-full text-left px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all
                                      ${activeId === macro.id
                                        ? 'bg-indigo-100 text-indigo-700 font-bold'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}
                                    `}
                                  >
                                    {macro.title}
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </>
  );
}
