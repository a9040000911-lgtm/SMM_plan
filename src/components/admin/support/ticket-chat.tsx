'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, CheckCircle2, User, Shield, BookOpen, Zap } from 'lucide-react';
import { replyToTicketAction, closeTicketAction } from '@/app/admin/support/actions';
import { executeMacroAction } from '@/app/admin/support/macros/actions';
import Link from 'next/link';
import Image from 'next/image';

interface Message {
  id: string;
  sender: 'USER' | 'STAFF';
  text: string;
  imageUrl?: string;
  createdAt: any;
}

interface Template {
  id: string;
  title: string;
  content: string;
}

interface Macro {
  id: string;
  title: string;
  text: string;
  actions: any;
}

export function TicketChat({
  ticketId,
  initialMessages,
  status,
  templates = [],
  macros = []
}: {
  ticketId: string,
  initialMessages: Message[],
  status: string,
  templates?: Template[],
  macros?: Macro[]
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [reply, setReply] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMacros, setShowMacros] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleReply = async () => {
    if (!reply.trim() || isSending) return;
    setIsSending(true);
    try {
      await replyToTicketAction(ticketId, reply);
      setMessages([...messages, {
        id: Math.random().toString(),
        sender: 'STAFF',
        text: reply,
        createdAt: new Date()
      }]);
      setReply('');
    } catch (_e) {
      alert('Ошибка: ' + (_e as any).message);
    } finally {
      setIsSending(false);
    }
  };

  const handleExecuteMacro = async (macroId: string) => {
    if (!confirm('Исполнить макрос? Все действия будут выполнены автоматически.')) return;
    setIsSending(true);
    try {
      const res = await executeMacroAction(ticketId, macroId);
      if (res.success) {
        alert('Макрос выполнен: ' + res.log.join(', '));
        window.location.reload(); // Перезагружаем для обновления статусов
      }
    } catch (_e) {
      alert('Ошибка макроса: ' + (_e as any).message);
    } finally {
      setIsSending(false);
      setShowMacros(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('Вы уверены, что хотите закрыть этот тикет?')) return;
    setIsClosing(true);
    try {
      await closeTicketAction(ticketId);
      window.location.reload();
    } catch (_e) {
      alert('Ошибка при закрытии');
      setIsClosing(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-250px)] min-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex-1">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50 relative custom-scrollbar">
        {messages.map((msg: any) => {
          // Ticket separator header
          if (msg.sender === 'SYSTEM' || msg.isHeader) {
            return (
              <div key={msg.id} className="flex items-center justify-center gap-4 py-2">
                <div className="flex-1 h-px bg-slate-200/60"></div>
                <div className={`px-3 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase ${msg.ticketStatus === 'CLOSED' ? 'bg-slate-200 text-slate-500' : 'bg-blue-100/50 text-blue-600'
                  }`}>
                  {msg.text}
                </div>
                <div className="flex-1 h-px bg-slate-200/60"></div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[85%] flex gap-3 ${msg.sender === 'USER' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 shadow-sm ${msg.sender === 'USER' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-800 text-white'
                  }`}>
                  {msg.sender === 'USER' ? <User size={14} /> : <Shield size={14} />}
                </div>
                <div className={`p-3.5 px-4 rounded-2xl shadow-sm text-[13px] ${msg.sender === 'USER' ? 'bg-white text-slate-800 rounded-tl-sm border border-slate-200' : 'bg-slate-800 text-white rounded-tr-sm border border-slate-700'
                  }`}>
                  {msg.imageUrl && (
                    <div className="mb-3 rounded-lg overflow-hidden border border-slate-100 bg-slate-50 relative group/img">
                      <Link href={`/api/admin/media/${msg.imageUrl}`} target="_blank">
                        <Image
                          src={`/api/admin/media/${msg.imageUrl}`}
                          alt="Attachment"
                          width={600}
                          height={400}
                          unoptimized
                          className="max-w-full h-auto max-h-[300px] object-contain hover:scale-105 transition-transform cursor-zoom-in"
                        />
                      </Link>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div className={`text-[10px] mt-2 font-medium flex items-center gap-1.5 ${msg.sender === 'USER' ? 'text-slate-400' : 'text-slate-400/80'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender === 'STAFF' && <CheckCircle2 size={10} />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Input Area Container */}
      {status !== 'CLOSED' ? (
        <div className="relative p-4 bg-white border-t border-slate-200 space-y-3 shrink-0 z-10">
          
          {/* Macros Panel */}
          {showMacros && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-200 overflow-hidden z-50">
              <div className="p-3 border-b border-white/10 bg-slate-950 text-[10px] font-black uppercase text-amber-400 tracking-widest flex justify-between items-center">
                Автоматизация (Макросы)
                <button onClick={() => setShowMacros(false)} className="text-slate-500 hover:text-slate-300">Закрыть</button>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
                {macros.map(m => (
                  <button key={m.id} onClick={() => handleExecuteMacro(m.id)} className="w-full px-4 py-3 text-left hover:bg-white/5 transition-colors group">
                    <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{m.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">{m.text}</div>
                  </button>
                ))}
                {macros.length === 0 && <div className="p-6 text-center text-xs text-slate-500 italic">Макросы не настроены</div>}
              </div>
            </div>
          )}

          {/* Templates Panel */}
          {showTemplates && (
            <div className="absolute bottom-full mb-2 left-4 right-4 bg-white border border-slate-200 rounded-xl shadow-xl animate-in slide-in-from-bottom-2 duration-200 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest flex justify-between items-center">
                Быстрые ответы
                <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-600">Закрыть</button>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-slate-50 custom-scrollbar">
                {templates.map(t => (
                  <button key={t.id} onClick={() => { setReply(p => p + t.content); setShowTemplates(false); }} className="w-full px-4 py-3 text-left hover:bg-blue-50/50 transition-colors">
                    <span className="text-xs font-bold text-slate-800">{t.title}</span>
                    <span className="text-[10px] text-slate-500 truncate block mt-1">{t.content}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-1">
            <button onClick={() => { setShowTemplates(!showTemplates); setShowMacros(false); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${showTemplates ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <BookOpen size={12} /> Шаблоны
            </button>
            <button onClick={() => { setShowMacros(!showMacros); setShowTemplates(false); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${showMacros ? 'bg-amber-500 text-white shadow-md shadow-amber-200' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}>
              <Zap size={12} fill="currentColor" /> Макросы
            </button>
            <Link href="/admin/support/macros" className="ml-auto flex flex-col items-end">
               <span className="text-[10px] font-bold text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors mb-0.5">Настроить</span>
            </Link>
          </div>

          <div className="flex gap-2">
            <textarea 
              value={reply} 
              onChange={(e) => setReply(e.target.value)} 
              placeholder="Напишите ответ клиенту (Ctrl+Enter для отправки)..." 
              className="flex-1 p-3 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 min-h-[60px] max-h-[150px] resize-y transition-all custom-scrollbar placeholder:text-slate-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  handleReply();
                }
              }}
            />
            <div className="flex flex-col gap-2 shrink-0">
              <button 
                onClick={handleReply} 
                disabled={isSending || !reply.trim()} 
                title="Отправить ответ"
                className="p-3 h-[46px] w-[46px] flex items-center justify-center bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md shadow-blue-200 disabled:opacity-50 disabled:shadow-none"
              >
                <Send size={18} />
              </button>
              <button 
                onClick={handleClose} 
                disabled={isClosing} 
                title="Закрыть тикет"
                className="p-3 h-[46px] w-[46px] flex items-center justify-center bg-slate-100 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all disabled:opacity-50"
              >
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200/50 text-slate-500 rounded-lg text-xs font-bold uppercase tracking-widest">
            <CheckCircle2 size={14} /> Тикет закрыт и решен
          </div>
        </div>
      )}
    </div>
  );
}


