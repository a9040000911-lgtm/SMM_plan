'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useEffect } from 'react';
import { Timer, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function SupportSlaTimer({ messages, status }: { messages: any[], status: string }) {
    const [elapsed, setElapsed] = useState<number>(0);
    const [isReplied, setIsReplied] = useState<boolean>(false);

    useEffect(() => {
        if (status === 'CLOSED' || !messages || messages.length === 0) return;

        // Find last user message
        const userMessages = messages.filter(m => m.sender === 'USER');
        if (userMessages.length === 0) return;

        const lastUserMsg = userMessages[userMessages.length - 1];
        
        // Find if staff replied after that
        const staffRepliesAfter = messages.filter(m => m.sender === 'STAFF' && new Date(m.createdAt) > new Date(lastUserMsg.createdAt));

        if (staffRepliesAfter.length > 0) {
            // Staff replied, SLA is met for now
            setIsReplied(true);
            return;
        }

        setIsReplied(false);
        const lastTime = new Date(lastUserMsg.createdAt).getTime();

        const calculateElapsed = () => {
            const now = new Date().getTime();
            setElapsed(Math.max(0, now - lastTime));
        };

        calculateElapsed();
        const interval = setInterval(calculateElapsed, 10000); // update every 10s

        return () => clearInterval(interval);
    }, [messages, status]);

    if (status === 'CLOSED') return null;

    if (isReplied) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircle2 size={14} /> <span>Ответ дан</span>
            </div>
        );
    }

    const minutes = Math.floor(elapsed / 60000);
    const hours = Math.floor(minutes / 60);
    
    let state = 'green';
    if (minutes >= 60) state = 'red';
    else if (minutes >= 10) state = 'yellow';

    const formatTime = () => {
        if (hours > 0) return `${hours} ч ${minutes % 60} мин`;
        return `${minutes} мин`;
    };

    return (
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
            state === 'red' ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 
            state === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
            'bg-emerald-50 text-emerald-600 border-emerald-200'
        }`}>
            {state === 'red' ? <AlertTriangle size={14} /> : <Timer size={14} />}
            <span>Ожидание: {formatTime()}</span>
        </div>
    );
}
