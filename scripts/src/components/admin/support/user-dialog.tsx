"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Image as ImageIcon, CheckCheck } from 'lucide-react';
import Image from 'next/image';

interface UserDialogPanelProps {
    userId: string;
    onClose: () => void;
}

interface Message {
    id: string;
    sender: 'USER' | 'STAFF' | 'SYSTEM';
    text: string;
    createdAt: string;
    imageUrl?: string;
    isRead?: boolean;
}

export function UserDialogPanel({ userId, onClose }: UserDialogPanelProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [replyText, setReplyText] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const fetchMessages = async () => {
        try {
            // In a real app, this would be a specific endpoint for messages
            // For now, we simulate fetching or use a placeholder endpoint
            // const res = await fetch(`/api/admin/support/messages?userId=${userId}`);
            // const data = await res.json();
            // setMessages(data.messages);

            // MOCK DATA for compilation fix until API is ready
            setMessages([
                { id: '1', sender: 'USER', text: 'Здравствуйте, есть вопрос.', createdAt: new Date().toISOString() },
                { id: '2', sender: 'STAFF', text: 'Добрый день! Слушаю вас.', createdAt: new Date().toISOString() }
            ]);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, [userId]);

    const handleSend = async () => {
        if (!replyText.trim()) return;
        setIsSending(true);
        try {
            // await fetch('/api/admin/support/reply', {
            //   method: 'POST',
            //   body: JSON.stringify({ userId, text: replyText })
            // });

            // Mock update
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'STAFF',
                text: replyText,
                createdAt: new Date().toISOString()
            }]);
            setReplyText('');
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="w-1/3 bg-white rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-300">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                    <h3 className="font-bold text-slate-800">Чат с пользователем</h3>
                    <p className="text-xs text-slate-400">ID: {userId}</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors opacity-50 hover:opacity-100">
                    <X size={20} />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
                {isLoading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin text-slate-300" /></div>
                ) : messages.length === 0 ? (
                    <div className="text-center text-slate-400 text-sm mt-10">История сообщений пуста</div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex flex-col ${msg.sender === 'STAFF' ? 'items-end' : 'items-start'}`}>
                            <div className={`
                max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed
                ${msg.sender === 'STAFF'
                                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-200'
                                    : 'bg-white border border-slate-100 rounded-bl-none shadow-sm text-slate-700'}
              `}>
                                {msg.imageUrl && (
                                    <div className="mb-2 rounded-lg overflow-hidden bg-black/10 relative min-h-[100px]">
                                        <Image
                                            src={msg.imageUrl}
                                            alt="Attachment"
                                            width={400}
                                            height={300}
                                            className="max-w-full h-auto object-contain"
                                        />
                                    </div>
                                )}
                                {msg.text}
                            </div>
                            <span className="text-[10px] text-slate-300 mt-1 px-1">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {msg.sender === 'STAFF' && <CheckCheck size={12} className="inline ml-1 opacity-60" />}
                            </span>
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <button className="p-3 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                        <ImageIcon size={20} />
                    </button>
                    <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Напишите ответ..."
                        className="flex-1 bg-transparent border-none outline-none text-sm py-3 min-h-[44px] max-h-32 resize-none"
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
                        className={`p-3 rounded-full transition-all shadow-lg ${replyText.trim() ? 'bg-blue-600 text-white hover:scale-105 active:scale-95' : 'bg-slate-200 text-slate-400'}`}
                    >
                        {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                </div>
            </div>
        </div>
    );
}
