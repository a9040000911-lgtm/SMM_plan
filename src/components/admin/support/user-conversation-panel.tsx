"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { X, Send, Loader2, ChevronDown, ChevronUp, FileText, Zap, AlertCircle, Clock, Check, User, MessageSquare, Volume2, Play, Pause, ZoomIn, ZoomOut, Maximize2, Search, Pencil, Inbox, ExternalLink, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { UserConversation, ConversationTicket, UserOrder } from '@/app/admin/support/ticket-actions';
import { replyToTicketAction, closeTicketAction, addInternalNoteAction } from '@/app/admin/support/actions';
import { getSupportAiSuggestionAction } from '@/app/admin/support/ai-actions';
import { executeMacroAction } from '@/app/admin/support/macro-actions';
import { warnUserAction, banUserAction, unbanUserAction } from '@/app/admin/support/moderation-actions';

interface UserConversationPanelProps {
    conversation: UserConversation;
    templates: Array<{ id: string; title: string; content: string }>;
    macros: Array<{ id: string; name: string; actions: any }>;
    onUpdated: () => void;
    onClose: () => void;
}

function StatusBadge({ status }: { status: string }) {
    const config = {
        OPEN: { icon: AlertCircle, color: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Открыт' },
        PENDING: { icon: Clock, color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Ожидает' },
        CLOSED: { icon: Check, color: 'bg-slate-100 text-slate-500 border-slate-200', label: 'Закрыт' }
    };
    const { icon: Icon, color, label } = config[status as keyof typeof config] || config.OPEN;

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${color}`}>
            <Icon size={10} />
            {label}
        </span>
    );
}

// Lightbox component for image preview with advanced zoom and pan functionality
function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Clamp position within boundaries to prevent image from flying off-screen
    const applyBounds = (newPos: { x: number; y: number }, newScale: number) => {
        if (!imgRef.current) return newPos;

        const w = imgRef.current.clientWidth * newScale;
        const h = imgRef.current.clientHeight * newScale;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const overflowX = Math.max(0, (w - vw) / 2);
        const overflowY = Math.max(0, (h - vh) / 2);

        return {
            x: Math.min(Math.max(newPos.x, -overflowX), overflowX),
            y: Math.min(Math.max(newPos.y, -overflowY), overflowY)
        };
    };

    // Zoom at specific point (cursor)
    const handleZoom = (newScale: number, mouseX: number, mouseY: number) => {
        const currentScale = scale;
        const boundedScale = Math.min(Math.max(0.5, newScale), 8);

        if (boundedScale === currentScale) return;

        // Calculate world coordinates of the mouse point relative to current position
        const worldX = (mouseX - window.innerWidth / 2 - position.x) / currentScale;
        const worldY = (mouseY - window.innerHeight / 2 - position.y) / currentScale;

        // Calculate new position
        const newPos = {
            x: mouseX - window.innerWidth / 2 - worldX * boundedScale,
            y: mouseY - window.innerHeight / 2 - worldY * boundedScale
        };

        setScale(boundedScale);
        setPosition(applyBounds(newPos, boundedScale));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.stopPropagation();
        const delta = e.deltaY > 0 ? 0.8 : 1.25;
        handleZoom(scale * delta, e.clientX, e.clientY);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (scale > 0.1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            const newPos = {
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            };
            setPosition(applyBounds(newPos, scale));
        }
    };

    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-[300] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-default overflow-hidden"
            onClick={onClose}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Top controls */}
            <div className="absolute top-4 right-4 flex items-center gap-2 z-[310]" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md rounded-md p-1 border border-white/10">
                    <button
                        onClick={() => handleZoom(scale * 0.7, window.innerWidth / 2, window.innerHeight / 2)}
                        className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"
                        title="Уменьшить"
                    >
                        <ZoomOut size={20} />
                    </button>
                    <span className="text-white text-[10px] font-black w-14 text-center uppercase tracking-tighter">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={() => handleZoom(scale * 1.5, window.innerWidth / 2, window.innerHeight / 2)}
                        className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"
                        title="Увеличить"
                    >
                        <ZoomIn size={20} />
                    </button>
                    <div className="w-px h-4 bg-white/20 mx-1" />
                    <button
                        onClick={handleReset}
                        className="p-2 hover:bg-white/10 rounded-md text-white transition-colors"
                        title="Сбросить (Double Click)"
                    >
                        <Maximize2 size={20} />
                    </button>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 bg-rose-500 hover:bg-rose-600 rounded-md text-white transition-colors shadow-lg active:scale-95"
                >
                    <X size={24} />
                </button>
            </div>

            {/* Hint */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-white/60 text-[10px] uppercase font-bold tracking-widest pointer-events-none select-none">
                <Search size={12} className="text-white/40" />
                Кликните для зума • Тяните для перемещения • Скролл для масштаба
            </div>

            <div
                className="relative will-change-transform"
                style={{
                    transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                    transition: isDragging ? 'none' : 'transform 150ms ease-out',
                    cursor: isDragging ? 'grabbing' : (scale > 1 ? 'grab' : 'zoom-in')
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (scale === 1) {
                        handleZoom(2.5, e.clientX, e.clientY);
                    } else {
                        handleReset();
                    }
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                }}
            >
                <Image
                    ref={imgRef}
                    src={src}
                    alt="Preview"
                    width={1920}
                    height={1080}
                    className="max-w-[85vw] max-h-[85vh] object-contain rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.5)] select-none pointer-events-none"
                    onLoad={() => {
                        // Optional: Center or fit on load if needed
                    }}
                />
            </div>
        </div>
    );
}

// Audio player component for voice messages with 200% volume boost
function VoicePlayer({ src }: { src: string }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const [volume, setVolume] = useState(1);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isMuted, setIsMuted] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const gainNodeRef = useRef<GainNode | null>(null);

    // Initialize Web Audio API for volume boosting (> 100%)
    const initAudioContext = () => {
        if (!audioRef.current || audioContextRef.current) return;

        try {
            const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
            const ctx = new AudioContextClass();
            const gainNode = ctx.createGain();
            const source = ctx.createMediaElementSource(audioRef.current);

            source.connect(gainNode);
            gainNode.connect(ctx.destination);

            audioContextRef.current = ctx;
            gainNodeRef.current = gainNode;

            // Set initial volume boost
            gainNode.gain.value = isMuted ? 0 : volume;
        } catch (e) {
            console.error('Failed to init AudioContext:', e);
        }
    };

    const togglePlay = () => {
        if (audioRef.current) {
            initAudioContext();
            if (audioContextRef.current?.state === 'suspended') {
                audioContextRef.current.resume();
            }

            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleSpeedToggle = () => {
        const rates = [1, 1.5, 2];
        const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
        setPlaybackRate(nextRate);
        if (audioRef.current) audioRef.current.playbackRate = nextRate;
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return (
        <div className="flex flex-col gap-2 p-3 bg-slate-100/80 backdrop-blur-sm rounded-lg min-w-[240px] border border-slate-200/50 shadow-sm animate-in fade-in slide-in-from-top-1">
            <audio
                ref={audioRef}
                src={src}
                crossOrigin="anonymous"
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onEnded={() => { setIsPlaying(false); setCurrentTime(0); }}
            />

            <div className="flex items-center gap-3">
                <button
                    onClick={togglePlay}
                    className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shrink-0 shadow-md active:scale-95"
                >
                    {isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} className="ml-0.5" fill="currentColor" />}
                </button>

                <div className="flex-1 space-y-1">
                    <div className="h-1 bg-slate-200/80 rounded-full overflow-hidden relative cursor-pointer group">
                        <div
                            className="h-full bg-blue-600 transition-all absolute top-0 left-0"
                            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
                        />
                        <div
                            className="absolute top-0 left-0 w-full h-full opacity-0 hover:opacity-10"
                            onClick={(e) => {
                                if (audioRef.current && duration) {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const percent = (e.clientX - rect.left) / rect.width;
                                    audioRef.current.currentTime = percent * duration;
                                }
                            }}
                        />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 font-bold tabular-nums">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <button
                    onClick={handleSpeedToggle}
                    className="px-1.5 py-1 bg-slate-200 text-slate-600 text-[10px] font-black rounded-md hover:bg-slate-300 transition-colors shrink-0 tabular-nums"
                    title="Скорость воспроизведения"
                >
                    {playbackRate}x
                </button>
            </div>

            <div className="flex flex-col gap-1 pt-1 border-t border-slate-200/50">
                <div className="flex items-center justify-between px-0.5 mb-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Громкость</span>
                    <span className={`text-[9px] font-black tabular-nums ${volume > 1 ? 'text-amber-500 animate-pulse' : 'text-slate-400'}`}>
                        {Math.round(volume * 100)}% {volume > 1 && '🚀'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            const newMuted = !isMuted;
                            setIsMuted(newMuted);
                            if (gainNodeRef.current) gainNodeRef.current.gain.value = newMuted ? 0 : volume;
                        }}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        {isMuted || volume === 0 ? <Volume2 size={12} className="opacity-40" /> : <Volume2 size={12} />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                            const newVol = parseFloat(e.target.value);
                            setVolume(newVol);
                            setIsMuted(newVol === 0);
                            initAudioContext();
                            if (gainNodeRef.current) {
                                gainNodeRef.current.gain.value = newVol;
                            }
                        }}
                        className="flex-1 h-1 bg-slate-200 rounded-full appearance-none cursor-pointer accent-blue-600 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full"
                    />
                </div>
            </div>
        </div>
    );
}

function TicketSection({ ticket, templates, macros, onReply, onClose }: {
    ticket: ConversationTicket;
    templates: any[];
    macros: any[];
    onReply: (tid: string, text: string) => Promise<void>;
    onClose: (tid: string) => Promise<void>;
}) {
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
            // The parent will call onUpdated which re-fetches conversation
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
                                    placeholder={isNoteMode ? "Текст внутренней заметки (только для персонала)..." : "Ответ пользователю..."}
                                    className="flex-1 bg-transparent border-none outline-none text-sm py-1 min-h-[32px] max-h-20 resize-none font-medium text-slate-700 placeholder:text-slate-400"
                                    rows={1}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
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

export function UserConversationPanel({ conversation, templates, macros: _macros, onUpdated, onClose }: UserConversationPanelProps) {
    const [showNewTicketForm, setShowNewTicketForm] = useState(false);
    const [newTicketSubject, setNewTicketSubject] = useState('Обращение от поддержки');
    const [newTicketMessage, setNewTicketMessage] = useState('');
    const [isCreatingTicket, setIsCreatingTicket] = useState(false);
    const [orders, setOrders] = useState<UserOrder[]>([]);
    const [isLoadingOrders, setIsLoadingOrders] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [orderIdCopied, setOrderIdCopied] = useState<string | null>(null);

    // Keyboard shortcuts for panel
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 'n') {
                e.preventDefault();
                // Find visible textarea (might be multiple tickets, but only one is usually focused or just top one)
                const textareas = document.querySelectorAll('textarea');
                if (textareas.length > 0) {
                    (textareas[textareas.length - 1] as HTMLTextAreaElement).focus();
                }
            } else if (e.altKey && (e.key === 'q' || e.key === 'й')) {
                e.preventDefault();
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!conversation?.user?.id) return;
            setIsLoadingOrders(true);
            try {
                const { getLatestUserOrdersAction } = await import('@/app/admin/support/ticket-actions');
                const data = await getLatestUserOrdersAction(conversation.user.id);
                setOrders(data);
            } catch (e) {
                console.error('Failed to fetch orders:', e);
            } finally {
                setIsLoadingOrders(false);
            }
        };
        fetchOrders();
    }, [conversation.user.id]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleReply = async (ticketId: string, text: string) => {
        await replyToTicketAction(ticketId, text);
        onUpdated();
    };

    const handleCloseTicket = async (ticketId: string) => {
        await closeTicketAction(ticketId);
        onUpdated();
    };

    const handleCreateNewTicket = async () => {
        if (!newTicketMessage.trim() || isCreatingTicket) return;
        setIsCreatingTicket(true);
        try {
            const { createTicketByAdminAction } = await import('@/app/admin/support/actions');
            await createTicketByAdminAction(conversation.user.id, newTicketSubject, newTicketMessage);
            setShowNewTicketForm(false);
            setNewTicketSubject('Обращение от поддержки');
            setNewTicketMessage('');
            onUpdated();
        } catch (e) {
            console.error('Failed to create ticket:', e);
            alert('Ошибка при создании тикета');
        } finally {
            setIsCreatingTicket(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm animate-in zoom-in-95 duration-300 h-full overflow-hidden">
            {/* Header / Profile */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white shrink-0">
                <div className="flex items-start justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <Link
                                href={`/admin/users/${conversation.user.id}`}
                                className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 shadow-inner transition-all hover:scale-105 active:scale-95"
                                style={{
                                    backgroundColor: conversation.user.project ? `${conversation.user.project.color}20` : '#dbeafe',
                                    color: conversation.user.project?.color || '#2563eb'
                                }}
                            >
                                <User size={24} />
                            </Link>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                                    <Link href={`/admin/users/${conversation.user.id}`} className="hover:text-blue-600 transition-colors">
                                        @{conversation.user.username || 'user'}
                                    </Link>
                                    {conversation.user.project && (
                                        <span
                                            className="ml-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border"
                                            style={{
                                                backgroundColor: `${conversation.user.project.color}10`,
                                                color: conversation.user.project.color,
                                                borderColor: `${conversation.user.project.color}30`
                                            }}
                                        >
                                            {conversation.user.project.name}
                                        </span>
                                    )}
                                    <button
                                        onClick={() => copyToClipboard(conversation.user.tgId || '')}
                                        className={`p-1.5 rounded-md transition-all ${isCopied ? 'bg-green-100 text-green-600' : 'hover:bg-slate-200 text-slate-400'}`}
                                        title="Копировать TG ID"
                                    >
                                        <FileText size={14} />
                                    </button>
                                </h3>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Link href={`/admin/users/${conversation.user.id}`} className="hover:text-blue-600 transition-colors">
                                        ID: {conversation.user.tgId}
                                    </Link>
                                    {isCopied && <span className="text-green-500 italic animate-in fade-in slide-in-from-left-2">Скопировано!</span>}
                                    <span className="flex items-center gap-1 ml-2 text-slate-400">
                                        <Inbox size={10} />
                                        Всего тикетов: {conversation.tickets.length}
                                    </span>
                                    {(conversation.user as any).isPermanentlyBanned && (
                                        <span className="bg-rose-100 text-rose-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-rose-200">Blocked PERM</span>
                                    )}
                                    {(!(conversation.user as any).isPermanentlyBanned && (conversation.user as any).banExpiresAt && new Date((conversation.user as any).banExpiresAt) > new Date()) && (
                                        <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-amber-200">Blocked until {new Date((conversation.user as any).banExpiresAt).toLocaleTimeString()}</span>
                                    )}
                                    {(conversation.user as any).warningCount > 0 && (
                                        <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-orange-200">Предупреждений: {(conversation.user as any).warningCount}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-4">
                            <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-md shadow-sm">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Баланс</div>
                                <div className="text-sm font-black text-blue-600">{Number(conversation.user.balance).toFixed(2)}₽</div>
                            </div>
                            <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-md shadow-sm">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Всего трат (LTV)</div>
                                <div className="text-sm font-black text-rose-600">{Number(conversation.user.spent).toFixed(2)}₽</div>
                            </div>
                            <div className="px-3 py-1.5 bg-white border border-slate-100 rounded-md shadow-sm">
                                <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Регистрация</div>
                                <div className="text-sm font-black text-slate-600">{new Date(conversation.user.createdAt).toLocaleDateString('ru-RU')}</div>
                            </div>

                            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-md border border-slate-200/50">
                                {((conversation.user as any).isPermanentlyBanned || ((conversation.user as any).banExpiresAt && new Date((conversation.user as any).banExpiresAt) > new Date())) ? (
                                    <button
                                        onClick={async () => {
                                            if (confirm('Разблокировать пользователя и сбросить предупреждения?')) {
                                                await unbanUserAction(conversation.user.id);
                                                onUpdated();
                                            }
                                        }}
                                        className="px-3 py-1 bg-white text-green-600 text-[10px] font-black uppercase rounded-md hover:bg-green-50 transition-all shadow-sm border border-green-100"
                                        title="Снять блокировку и обнулить количество предупреждений"
                                    >
                                        Разблочить
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            onClick={async () => {
                                                const reason = prompt('Причина предупреждения:');
                                                if (reason) {
                                                    await warnUserAction(conversation.user.id, reason);
                                                    onUpdated();
                                                }
                                            }}
                                            className="px-3 py-1 bg-white text-amber-600 text-[10px] font-black uppercase rounded-md hover:bg-amber-50 transition-all shadow-sm border border-amber-100"
                                            title="Выдать предупреждение за спам или оскорбление. 3 предупреждения = автоматический бан на 24 часа."
                                        >
                                            Предупреждение
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const reason = prompt('Причина бана (24ч):');
                                                if (reason) {
                                                    await banUserAction(conversation.user.id, 24, reason);
                                                    onUpdated();
                                                }
                                            }}
                                            className="px-3 py-1 bg-white text-rose-500 text-[10px] font-black uppercase rounded-md hover:bg-rose-50 transition-all shadow-sm border border-rose-100"
                                            title="Заблокировать доступ к поддержке на 24 часа."
                                        >
                                            24ч
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const reason = prompt('Причина вечного бана:');
                                                if (reason) {
                                                    await banUserAction(conversation.user.id, 'PERMANENT', reason);
                                                    onUpdated();
                                                }
                                            }}
                                            className="px-3 py-1 bg-white text-rose-700 text-[10px] font-black uppercase rounded-md hover:bg-rose-100 transition-all shadow-sm border border-rose-200"
                                            title="Перманентная блокировка без возможности автоматической разблокировки."
                                        >
                                            Бан
                                        </button>
                                        <div className="px-1 text-slate-300" title="3 предупреждения приводят к автоматическому бану на 24 часа. Кнопка 'Разблочить' появляется только у забаненных.">
                                            <AlertCircle size={14} />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowNewTicketForm(true)}
                            className="px-5 py-2.5 bg-blue-600 text-white text-xs font-black uppercase rounded-md hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                        >
                            <Zap size={16} />
                            Написать
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 hover:bg-rose-50 rounded-md transition-all active:scale-95"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex items-start min-h-0 overflow-hidden">
                {/* Main Content: Tickets */}
                <div className="flex-1 p-6 space-y-6 bg-slate-50/30 overflow-y-auto custom-scrollbar h-full">
                    {/* New Ticket Form */}
                    {showNewTicketForm && (
                        <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 mb-6 space-y-3 animate-in slide-in-from-top duration-300">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black text-blue-800 uppercase tracking-widest">Новый тикет</h4>
                                <button onClick={() => setShowNewTicketForm(false)} className="text-slate-400 hover:text-slate-600">
                                    <X size={16} />
                                </button>
                            </div>
                            <input
                                type="text"
                                value={newTicketSubject}
                                onChange={(e) => setNewTicketSubject(e.target.value)}
                                placeholder="Тема тикета"
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-semibold"
                            />
                            <textarea
                                value={newTicketMessage}
                                onChange={(e) => setNewTicketMessage(e.target.value)}
                                placeholder="Сообщение пользователю..."
                                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[100px] resize-none font-medium"
                            />
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={() => setShowNewTicketForm(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 uppercase tracking-widest"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleCreateNewTicket}
                                    disabled={!newTicketMessage.trim() || isCreatingTicket}
                                    className="px-6 py-2 bg-blue-600 text-white text-xs font-black rounded-md hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2 uppercase tracking-widest"
                                >
                                    {isCreatingTicket ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                                    Отправить
                                </button>
                            </div>
                        </div>
                    )}

                    {conversation.tickets.length === 0 ? (
                        <div className="text-center text-slate-400 py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-10" />
                            <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Нет активных переписок</p>
                            <button
                                onClick={() => setShowNewTicketForm(true)}
                                className="mt-4 px-6 py-2.5 bg-slate-100 text-slate-600 text-xs font-black rounded-md hover:bg-slate-200 transition-all uppercase tracking-widest"
                            >
                                Написать пользователю
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {conversation.tickets.map((ticket) => (
                                <TicketSection
                                    key={ticket.id}
                                    ticket={ticket}
                                    templates={templates}
                                    macros={_macros || []}
                                    onReply={handleReply}
                                    onClose={handleCloseTicket}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Context Panel: User activity */}
                <div className="w-80 border-l border-slate-100 bg-white shrink-0 flex flex-col h-full overflow-y-auto custom-scrollbar">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock size={12} className="text-blue-500" />
                            Последние заказы
                        </h4>
                    </div>

                    <div className="flex-1 p-5 space-y-4">
                        {isLoadingOrders ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-slate-50 rounded-md animate-pulse" />
                                ))}
                            </div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-8">
                                <Inbox size={24} className="mx-auto mb-2 text-slate-200" />
                                <p className="text-xs text-slate-400 font-medium tracking-tight">Заказов пока нет</p>
                            </div>
                        ) : (
                            orders.map(order => (
                                <div key={order.id} className="group p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all shadow-sm">
                                    <div className="flex items-start justify-between mb-1.5">
                                        <div className="text-[10px] font-black text-slate-700 truncate max-w-[140px]" title={order.serviceName}>
                                            {order.serviceName}
                                        </div>
                                        <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${order.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            order.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-rose-50 text-rose-700 border-rose-100'
                                            }`}>
                                            {order.status}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-[11px] mb-2">
                                        <div className="font-black text-slate-900">{order.amount}₽</div>
                                        <div className="text-[9px] text-slate-400 font-bold tabular-nums">
                                            {new Date(order.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <Link
                                            href={`/admin/orders/${order.id}`}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white text-slate-500 border border-slate-100 rounded-md text-[9px] font-black uppercase hover:border-slate-200 hover:bg-slate-50 transition-all"
                                        >
                                            <FileText size={10} />
                                            ID: {order.id}
                                        </Link>
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(order.id.toString());
                                                setOrderIdCopied(order.id.toString());
                                                setTimeout(() => setOrderIdCopied(null), 2000);
                                            }}
                                            className={`px-2 py-1.5 rounded-md transition-all border ${orderIdCopied === order.id.toString()
                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                : 'bg-white text-slate-300 border-slate-100 hover:border-slate-200'
                                                }`}
                                            title="Копировать ID"
                                        >
                                            <Check size={10} />
                                        </button>
                                        <a
                                            href={order.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors border border-blue-100/50"
                                            title="Открыть ссылку"
                                        >
                                            <ExternalLink size={10} />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-5 mt-auto border-t border-slate-100 bg-slate-50/50">
                        <div className="p-3 bg-blue-600 rounded-lg text-white shadow-lg shadow-blue-500/20">
                            <div className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Статус клиента</div>
                            <div className="text-xs font-black flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)] animate-pulse" />
                                Активен
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

