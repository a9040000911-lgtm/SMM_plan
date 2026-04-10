"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import { 
    MessageSquare, ChevronDown, ChevronUp, Send, Loader2, FileText, Zap, 
    Search, Sparkles, X, Pencil 
} from 'lucide-react';
import { StatusBadge } from './status-badge';
import { ImageLightbox } from './image-lightbox';
import { VoicePlayer } from './voice-player';
import { ConversationTicket } from '@/app/admin/support/ticket-actions';
import { addInternalNoteAction } from '@/app/admin/support/actions';
import { getSupportAiSuggestionAction } from '@/app/admin/support/ai-actions';
import { executeMacroAction } from '@/app/admin/support/macro-actions';

interface AdvancedTicketSectionProps {
    ticket: ConversationTicket;
    templates: any[];
    macros: any[];
    onReply: (tid: string, text: string) => Promise<void>;
    onClose: (tid: string) => Promise<void>;
}

export function AdvancedTicketSection({ ticket, templates, macros, onReply, onClose }: AdvancedTicketSectionProps) {
    const [isExpanded, setIsExpanded] = useState(ticket.status !== 'CLOSED');
    const [replyText, setReplyText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [showMacros, setShowMacros] = useState(false);
    const [templateSearch, setTemplateSearch] = useState('');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [isExecutingMacro, setIsExecutingMacro] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<string | null>(null);
    const [isNoteMode, setIsNoteMode] = useState(false);

    const handleSend = async () => {
        if (!replyText.trim() || isSending) return;
        setIsSending(true);
        try {
            if (isNoteMode) {
                await addInternalNoteAction(ticket.id, replyText);
            } else {
                await onReply(ticket.id, replyText);
            }
            setReplyText('');
        } catch (e) {
            console.error('Failed to send:', e);
            alert('Ошибка при отправке');
        } finally {
            setIsSending(false);
        }
    };

    const handleAiSuggest = async () => {
        if (isGeneratingAi) return;
        setIsGeneratingAi(true);
        try {
            const res = await getSupportAiSuggestionAction(ticket.id);
            if (res.success && res.suggestion) {
                setReplyText(prev => (prev ? prev + '\n' : '') + res.suggestion);
            } else {
                alert(res.error || 'AI не смог сгенерировать ответ');
            }
        } catch (error) {
            console.error('AI Suggest Error:', error);
            alert('Ошибка при обращении к AI');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleExecuteMacro = async (macroId: string) => {
        if (isExecutingMacro) return;
        setIsExecutingMacro(true);
        try {
            const res = await executeMacroAction(ticket.id, macroId);
            if (res.success) {
                setShowMacros(false);
            } else {
                alert(res.error || 'Ошибка при выполнении макроса');
            }
        } catch (error) {
            console.error('Macro execution error:', error);
            alert('Сбой при выполнении макроса');
        } finally {
            setIsExecutingMacro(false);
        }
    };

    const handleClose = async () => {
        if (isClosing) return;
        setIsClosing(true);
        try {
            await onClose(ticket.id);
        } catch (e) {
            console.error('Failed to close:', e);
            alert('Ошибка при закрытии');
        } finally {
            setIsClosing(false);
        }
    };

    const insertTemplate = (content: string) => {
        setReplyText(prev => prev + content);
        setShowTemplates(false);
    };

    return (
        <div className={`border rounded-lg overflow-hidden transition-all ${ticket.status === 'OPEN' ? 'border-rose-200 bg-rose-50/20' :
            ticket.status === 'PENDING' ? 'border-amber-200 bg-amber-50/20' :
                'border-slate-200 bg-slate-50/30'
            }`}>
            {/* Ticket Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 hover:bg-white/50 transition-colors"
            >
                <div className="flex items-center gap-2 min-w-0">
                    <StatusBadge status={ticket.status} />
                    <span className="font-semibold text-sm text-slate-700 truncate">{ticket.subject}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString('ru-RU')}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                        <MessageSquare size={10} />
                        {ticket.messages.length}
                    </span>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
            </button>

            {/* Messages */}
            {isExpanded && (
                <div className="border-t border-slate-100">
                    <div className="px-4 py-3 space-y-3 bg-white/50">
                        {ticket.messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex flex-col ${msg.sender === 'STAFF' || msg.sender === 'INTERNAL' ? 'items-end' : msg.sender === 'SYSTEM' ? 'items-center' : 'items-start'}`}
                            >
                                {msg.sender === 'SYSTEM' ? (
                                    <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-full">
                                        {msg.text}
                                    </div>
                                ) : (
                                    <>
                                        {/* Sender label for STAFF/INTERNAL */}
                                        {(msg.sender === 'STAFF' || msg.sender === 'INTERNAL') && msg.staffUsername && (
                                            <span className={`text-[9px] font-semibold mb-0.5 px-1 ${msg.sender === 'INTERNAL' ? 'text-amber-600' : 'text-blue-500'}`}>
                                                {msg.sender === 'INTERNAL' ? '📝 Заметка: ' : '🛡️ '}{msg.staffUsername}
                                            </span>
                                        )}
                                        <div className={`
                                            max-w-[85%] p-3 rounded-lg text-sm leading-relaxed
                                            ${msg.sender === 'STAFF'
                                                ? 'bg-blue-600 text-white rounded-br-sm shadow-sm'
                                                : msg.sender === 'INTERNAL'
                                                    ? 'bg-amber-100 border border-amber-200 text-amber-900 rounded-br-sm shadow-sm italic'
                                                    : 'bg-slate-100 rounded-bl-sm text-slate-700'}
                                        `}>
                                            {msg.imageUrl && (
                                                <div className="mb-2 rounded-md overflow-hidden border border-black/5 relative min-h-[100px]">
                                                    <Image
                                                        src={`/api/admin/media/${msg.imageUrl}`}
                                                        alt="Attachment"
                                                        width={400}
                                                        height={300}
                                                        className="max-w-full h-auto max-h-[300px] object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                                                        onClick={() => setLightboxImage(`/api/admin/media/${msg.imageUrl}`)}
                                                    />
                                                </div>
                                            )}
                                            {msg.voiceUrl && (
                                                <div className="mb-2">
                                                    <VoicePlayer src={`/api/admin/media/${msg.voiceUrl}`} />
                                                </div>
                                            )}
                                            {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}
                                        </div>
                                        <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                                            {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Reply input (only for non-closed tickets) */}
                    {ticket.status !== 'CLOSED' && (
                        <div className="p-3 border-t border-slate-100 bg-white">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex bg-slate-100 p-0.5 rounded-md shadow-inner">
                                    <button
                                        onClick={() => setIsNoteMode(false)}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${!isNoteMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Ответ
                                    </button>
                                    <button
                                        onClick={() => setIsNoteMode(true)}
                                        className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all ${isNoteMode ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Заметка
                                    </button>
                                </div>

                                {!isNoteMode && (
                                    <div className="flex items-center gap-2">
                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    setShowTemplates(!showTemplates);
                                                    if (!showTemplates) setTemplateSearch('');
                                                }}
                                                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded transition-colors ${showTemplates ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                            >
                                                <FileText size={10} />
                                                Шаблоны
                                                <ChevronDown size={8} />
                                            </button>
                                            {showTemplates && (
                                                <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-lg shadow-2xl border border-slate-200 py-2 z-[60] animate-in slide-in-from-bottom-2 duration-200">
                                                    <div className="px-3 pb-2 border-b border-slate-100 mb-1">
                                                        <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-md border border-slate-200 focus-within:border-blue-400 transition-colors">
                                                            <Search size={10} className="text-slate-400" />
                                                            <input
                                                                type="text"
                                                                autoFocus
                                                                value={templateSearch}
                                                                onChange={(e) => setTemplateSearch(e.target.value)}
                                                                placeholder="Поиск шаблона..."
                                                                className="bg-transparent border-none outline-none text-[10px] w-full font-medium"
                                                                onClick={e => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        {templates
                                                            .filter(t =>
                                                                t.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                                                                t.content.toLowerCase().includes(templateSearch.toLowerCase())
                                                            )
                                                            .map(t => (
                                                                <button
                                                                    key={t.id}
                                                                    onClick={() => insertTemplate(t.content)}
                                                                    className="w-full px-3 py-2 text-left hover:bg-slate-50 transition-colors group"
                                                                >
                                                                    <p className="text-[11px] font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{t.title}</p>
                                                                    <p className="text-[9px] text-slate-400 truncate mt-0.5">{t.content.substring(0, 60)}...</p>
                                                                </button>
                                                            ))}
                                                        {templates.length === 0 && (
                                                            <div className="px-4 py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                                                Нет шаблонов
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <button
                                                onClick={() => {
                                                    setShowMacros(!showMacros);
                                                    if (!showMacros) setShowTemplates(false);
                                                }}
                                                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded transition-all ${showMacros ? 'bg-amber-50 text-amber-600' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                                            >
                                                <Zap size={10} />
                                                Макросы
                                                <ChevronDown size={8} />
                                            </button>
                                            {showMacros && (
                                                <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-2xl border border-slate-200 py-2 z-[60] animate-in slide-in-from-bottom-2 duration-200">
                                                    <div className="px-3 pb-1 border-b border-slate-100 mb-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Быстрые действия</span>
                                                    </div>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                        {macros.map(m => (
                                                            <button
                                                                key={m.id}
                                                                disabled={isExecutingMacro}
                                                                onClick={() => handleExecuteMacro(m.id)}
                                                                className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors flex items-center justify-between group disabled:opacity-50"
                                                            >
                                                                <div>
                                                                    <p className="text-[11px] font-bold text-slate-700 group-hover:text-amber-600 transition-colors">{m.name}</p>
                                                                    {m.actions?.close && <span className="text-[8px] text-rose-500 font-bold uppercase tracking-tighter">Закроет тикет</span>}
                                                                </div>
                                                                <Zap size={10} className="text-slate-300 group-hover:text-amber-400 transition-colors" />
                                                            </button>
                                                        ))}
                                                        {macros.length === 0 && (
                                                            <div className="px-4 py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                                                Макросы не настроены
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={handleAiSuggest}
                                            disabled={isGeneratingAi}
                                            className={`flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md transition-all border shadow-sm ${isGeneratingAi
                                                ? 'bg-slate-50 text-slate-400 border-slate-100'
                                                : 'bg-gradient-to-r from-indigo-50 to-blue-50 text-indigo-600 border-indigo-100 hover:scale-105 active:scale-95'
                                                }`}
                                            title="Сгенерировать ответ с помощью AI (Gemini)"
                                        >
                                            {isGeneratingAi ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                                            {isGeneratingAi ? 'Рассуждаю...' : 'AI Помощь'}
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={handleClose}
                                    disabled={isClosing}
                                    className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors ml-auto"
                                >
                                    {isClosing ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                                    Закрыть
                                </button>
                            </div>

                            <div className={`flex items-end gap-2 p-2 rounded-md border transition-all ${isNoteMode ? 'bg-amber-50/50 border-amber-200 focus-within:border-amber-400' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400'}`}>
                                <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder={isNoteMode ? "Текст внутренней заметки (только для персонала)... (Отправить: Ctrl+Enter)" : "Ответ пользователю... (Отправить: Ctrl+Enter)"}
                                    className="flex-1 bg-transparent border-none outline-none text-sm py-1 min-h-[32px] max-h-20 resize-none font-medium text-slate-700 placeholder:text-slate-400"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!replyText.trim() || isSending}
                                    className={`p-1.5 rounded-md transition-all shrink-0 shadow-lg active:scale-90 ${!replyText.trim()
                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                        : isNoteMode
                                            ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                                        }`}
                                >
                                    {isSending ? <Loader2 size={14} className="animate-spin" /> : isNoteMode ? <Pencil size={14} /> : <Send size={14} />}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Image Lightbox */}
            {lightboxImage && (
                <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />
            )}
        </div>
    );
}
