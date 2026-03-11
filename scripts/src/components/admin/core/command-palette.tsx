'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
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
  Database
} from 'lucide-react';
import { globalSearchAction } from '@/app/admin/global-search-action';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Обработка горячих клавиш Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Фокус на инпут при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery('');
      setResults(null);
    }
  }, [isOpen]);

  // Живой поиск
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (query.length >= 2) {
        setIsLoading(true);
        const data = await globalSearchAction(query);
        setResults(data);
        setIsLoading(false);
      } else {
        setResults(null);
      }
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const navigateTo = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

      {/* Search Modal */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center p-6 border-b border-slate-100">
          <Search className="text-slate-400 mr-4" size={24} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ищите что угодно: пользователя, ID заказа или тикета..."
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-800 placeholder:text-slate-300"
          />
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="animate-spin text-blue-500" size={20} />}
            <div className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">Esc</div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
          {!results && query.length < 2 && (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-300">
                <Command size={24} />
              </div>
              <p className="text-sm font-bold text-slate-400">Введите минимум 2 символа для начала поиска</p>
              <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest">Используйте Ctrl + K для вызова</p>
            </div>
          )}

          {results && (
            <>
              {/* РЕЗУЛЬТАТЫ: ПОЛЬЗОВАТЕЛИ */}
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

              {/* РЕЗУЛЬТАТЫ: ЗАКАЗЫ */}
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

              {/* РЕЗУЛЬТАТЫ: ТИКЕТЫ */}
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

              {/* РЕЗУЛЬТАТЫ: УСЛУГИ */}
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

              {/* РЕЗУЛЬТАТЫ: ПРОВАЙДЕРЫ */}
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

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-6">
          <div className="flex items-center gap-1.5">
            <div className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black text-slate-500">Ctrl + K</div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Открыть/Закрыть</span>
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
