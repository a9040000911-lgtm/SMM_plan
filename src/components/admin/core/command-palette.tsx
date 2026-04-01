'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  User,
  ShoppingCart,
  MessageSquare,
  Command,
  ArrowRight,
  Loader2,
  Package,
  Database,
  BookOpen,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';
import { globalSearchAction } from '@/app/admin/global-search-action';
import { knowledgeBase } from '@/data/kb-content';
import { searchKnowledgeBase, type KBSearchResult } from '@/components/admin/knowledge-base/kb-search';

type PaletteMode = 'search' | 'knowledge';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<PaletteMode>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [kbResults, setKbResults] = useState<KBSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Hotkeys: Ctrl+K for search, Ctrl+Shift+K for knowledge
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (e.shiftKey) {
          setIsOpen(true);
          setMode('knowledge');
        } else {
          setIsOpen(prev => !prev);
          setMode('search');
        }
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(null);
      setKbResults([]);
    }
  }, [isOpen, mode]);

  // Live search - different logic per mode
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        if (mode === 'search') {
          setIsLoading(true);
          const data = await globalSearchAction(query);
          setResults(data);
          setIsLoading(false);
        } else {
          const results = searchKnowledgeBase(knowledgeBase, query);
          setKbResults(results);
        }
      } else {
        setResults(null);
        setKbResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [query, mode]);

  const navigateTo = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const copyText = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Mode Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            onClick={() => { setMode('search'); setQuery(''); setResults(null); setKbResults([]); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'search'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Search size={14} /> Поиск
          </button>
          <button
            onClick={() => { setMode('knowledge'); setQuery(''); setResults(null); setKbResults([]); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-all ${
              mode === 'knowledge'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles size={14} /> Знания
          </button>
        </div>

        {/* Search Input */}
        <div className="flex items-center p-6 border-b border-slate-100">
          {mode === 'knowledge'
            ? <BookOpen className="text-indigo-400 mr-4" size={24} />
            : <Search className="text-slate-400 mr-4" size={24} />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === 'knowledge'
              ? 'Описание ситуации: \"клиент пропал из поиска\", \"scam\", \"собачки\"...'
              : 'Ищите что угодно: пользователя, ID заказа или тикета...'
            }
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-300"
          />
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="animate-spin text-blue-500" size={20} />}
            <div className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">Esc</div>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {/* EMPTY STATE */}
          {query.length < 2 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                {mode === 'knowledge' ? <BookOpen size={24} /> : <Command size={24} />}
              </div>
              <p className="text-sm font-bold text-slate-400">
                {mode === 'knowledge'
                  ? 'Опишите ситуацию клиента для поиска макроса'
                  : 'Введите минимум 2 символа для начала поиска'
                }
              </p>
              <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">
                {mode === 'knowledge' ? 'Ctrl + Shift + K' : 'Ctrl + K'}
              </p>
            </div>
          )}

          {/* KNOWLEDGE MODE RESULTS */}
          {mode === 'knowledge' && kbResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Sparkles size={12} /> Найдено {kbResults.length} совпадений
              </h4>
              {kbResults.map((result, i) => {
                const isMacro = result.type === 'macro';
                const macro = isMacro ? (result.item as any) : null;

                return (
                  <div
                    key={i}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all space-y-3"
                  >
                    {/* Result Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${
                          isMacro ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                        }`}>
                          {isMacro ? <MessageSquare size={12} /> : <BookOpen size={12} />}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{(result.item as any).title}</span>
                      </div>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                        {result.moduleTitle.split(':')[0]}
                      </span>
                    </div>

                    {/* Macro Copy Buttons */}
                    {isMacro && macro && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyText(macro.text, `cp-${macro.id}-off`)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                        >
                          {copiedId === `cp-${macro.id}-off`
                            ? <><Check size={12} className="text-emerald-400" /> Скопировано!</>
                            : <><Copy size={12} /> Официальный</>
                          }
                        </button>
                        {macro.textSimple && (
                          <button
                            onClick={() => copyText(macro.textSimple, `cp-${macro.id}-sim`)}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-200"
                          >
                            {copiedId === `cp-${macro.id}-sim`
                              ? <><Check size={12} /> Скопировано!</>
                              : <><Copy size={12} /> Простой</>
                            }
                          </button>
                        )}
                      </div>
                    )}

                    {/* Function: Navigate to KB page */}
                    {!isMacro && (
                      <button
                        onClick={() => navigateTo(`/admin/knowledge-base#${(result.item as any).id}`)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <ArrowRight size={12} /> Открыть в Базе Знаний
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mode === 'knowledge' && query.length >= 2 && kbResults.length === 0 && (
            <div className="py-12 text-center text-slate-400 italic text-sm font-medium">
              Ничего не найдено. Попробуйте описать ситуацию другими словами.
            </div>
          )}

          {/* SEARCH MODE RESULTS */}
          {mode === 'search' && results && (
            <>
              {results.users.length > 0 && (
                <div className="space-y-2">
                  <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Пользователи</h4>
                  {results.users.map((u: any) => (
                    <button key={u.id} onClick={() => navigateTo(`/admin/users/${u.id}`)} className="w-full flex items-center justify-between p-4 hover:bg-blue-50 rounded-2xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                          <User size={18} />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-800">@{u.username || 'user'}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{u.role}</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {results.orders.length > 0 && (
                <div className="space-y-2">
                  <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Заказы</h4>
                  {results.orders.map((o: any) => (
                    <button key={o.id} onClick={() => navigateTo(`/admin/orders/${o.id}`)} className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 rounded-2xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black text-[10px] uppercase">
                          <ShoppingCart size={18} />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-800">Заказ #{o.id}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{o.status} • {o.totalPrice}₽</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {results.tickets.length > 0 && (
                <div className="space-y-2">
                  <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Обращения</h4>
                  {results.tickets.map((t: any) => (
                    <button key={t.id} onClick={() => navigateTo(`/admin/support/${t.id}`)} className="w-full flex items-center justify-between p-4 hover:bg-purple-50 rounded-2xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black uppercase">
                          <MessageSquare size={18} />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-800">{t.subject}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Тикет #{t.id.split('-')[0].toUpperCase()} • {t.status}</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-purple-500 transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {results.services?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Услуги</h4>
                  {results.services.map((s: any) => (
                    <button key={s.id} onClick={() => navigateTo(`/admin/services/${s.id}`)} className="w-full flex items-center justify-between p-4 hover:bg-blue-50 rounded-2xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                          <Package size={18} />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-800">{s.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{s.platform} • ID: {s.id.slice(-6)}</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {results.providers?.length > 0 && (
                <div className="space-y-2">
                  <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Провайдеры</h4>
                  {results.providers.map((p: any) => (
                    <button key={p.id} onClick={() => navigateTo(`/admin/providers?providerId=${p.id}`)} className="w-full flex items-center justify-between p-4 hover:bg-indigo-50 rounded-2xl transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black">
                          <Database size={18} />
                        </div>
                        <div className="text-left">
                          <div className="text-sm font-bold text-slate-800">{p.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{p.isEnabled ? 'Активен' : 'Отключен'}</div>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              )}

              {results.users.length === 0 && results.orders.length === 0 && results.tickets.length === 0 && results.services?.length === 0 && results.providers?.length === 0 && (
                <div className="py-12 text-center text-slate-400 italic text-sm font-medium">Ничего не найдено по вашему запросу</div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500">Ctrl + K</div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Поиск</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500">Ctrl + Shift + K</div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Знания</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500">Esc</div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Выйти</span>
          </div>
        </div>
      </div>
    </div>
  );
}
