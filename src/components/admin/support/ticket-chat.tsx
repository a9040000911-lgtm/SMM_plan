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
    <div className="flex flex-col h-[600px] bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 text-[13px]">
        {messages.map((msg: any) => {
          // Ticket separator header
          if (msg.sender === 'SYSTEM' || msg.isHeader) {
            return (
              <div key={msg.id} className="flex items-center justify-center gap-4 py-4">
                <div className="flex-1 h-px bg-slate-200"></div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${msg.ticketStatus === 'CLOSED' ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                  {msg.text}
                </div>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] flex gap-3 ${msg.sender === 'USER' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto shadow-sm ${msg.sender === 'USER' ? 'bg-blue-100 text-blue-600' : 'bg-slate-800 text-white'
                  }`}>
                  {msg.sender === 'USER' ? <User size={14} /> : <Shield size={14} />}
                </div>
                <div className={`p-4 rounded-2xl shadow-sm ${msg.sender === 'USER' ? 'bg-white text-slate-800 rounded-bl-none border border-slate-100' : 'bg-slate-900 text-white rounded-br-none'
                  }`}>
                  {msg.imageUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50 relative group/img">
                      <Link href={`/api/admin/media/${msg.imageUrl}`} target="_blank">
                        <Image
                          src={`/api/admin/media/${msg.imageUrl}`}
                          alt="Attachment"
                          width={600}
                          height={400}
                          unoptimized
                          className="max-w-full h-auto max-h-[300px] object-contain hover:scale-[1.02] transition-transform cursor-zoom-in"
                        />
                      </Link>
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                  <div className={`text-[9px] mt-2 font-bold uppercase opacity-40 ${msg.sender === 'USER' ? 'text-slate-500' : 'text-slate-300'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Macros Panel */}
      {showMacros && (
        <div className="absolute bottom-[140px] left-4 right-4 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
          <div className="p-3 border-b border-white/5 bg-slate-950 text-[10px] font-black uppercase text-amber-400 tracking-widest flex justify-between items-center">
            Автоматизация (Макросы)
            <button onClick={() => setShowMacros(false)} className="text-slate-500">Закрыть</button>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-white/5">
            {macros.map(m => (
              <button key={m.id} onClick={() => handleExecuteMacro(m.id)} className="w-full p-4 text-left hover:bg-white/5 transition-colors group">
                <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">{m.title}</div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">{m.text}</div>
              </button>
            ))}
            {macros.length === 0 && <div className="p-6 text-center text-xs text-slate-500 italic">Макросы не настроены</div>}
          </div>
        </div>
      )}

      {/* Templates Panel */}
      {showTemplates && (
        <div className="absolute bottom-[140px] left-4 right-4 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest flex justify-between items-center">
            Быстрые ответы
            <button onClick={() => setShowTemplates(false)}>Закрыть</button>
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
            {templates.map(t => (
              <button key={t.id} onClick={() => { setReply(p => p + t.content); setShowTemplates(false); }} className="w-full p-4 text-left text-xs hover:bg-blue-50 transition-colors">
                <span className="font-bold text-slate-800">{t.title}</span>
                <span className="text-[10px] text-slate-400 truncate block mt-1">{t.content}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {status !== 'CLOSED' ? (
        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2 px-1">
            <button onClick={() => { setShowTemplates(!showTemplates); setShowMacros(false); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showTemplates ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
              <BookOpen size={12} /> Шаблоны
            </button>
            <button onClick={() => { setShowMacros(!showMacros); setShowTemplates(false); }} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showMacros ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100'}`}>
              <Zap size={12} fill="currentColor" /> Макросы
            </button>
            <Link href="/admin/support/macros" className="ml-auto text-[10px] font-bold text-slate-400 hover:text-blue-500 uppercase tracking-widest transition-colors">Настроить</Link>
          </div>

          <div className="flex gap-3">
            <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Напишите ответ..." className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-none transition-all" />
            <div className="flex flex-col gap-2">
              <button onClick={handleReply} disabled={isSending || !reply.trim()} className="p-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"><Send size={24} /></button>
              <button onClick={handleClose} disabled={isClosing} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-600 transition-all"><CheckCircle2 size={20} /></button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-slate-50 text-center"><div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-600 rounded-full text-xs font-black uppercase tracking-widest"><CheckCircle2 size={14} /> Тикет закрыт</div></div>
      )}
    </div>
  );
}
