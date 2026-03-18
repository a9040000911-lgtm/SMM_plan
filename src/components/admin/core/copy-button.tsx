'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn } from '@/utils/ui';
import { toast } from 'sonner';

interface CopyButtonProps {
    value: string;
    className?: string;
    iconSize?: number;
    label?: string;
}

export function CopyButton({ value, className, iconSize = 12, label }: CopyButtonProps) {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(value);
            setIsCopied(true);
            toast.success(label ? `${label} скопирован` : 'Скопировано в буфер');
            setTimeout(() => setIsCopied(false), 2000);
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (err) {
            toast.error('Ошибка при копировании');
        }
    };

    return (
        <button
            onClick={handleCopy}
            className={cn(
                "p-1 rounded-md transition-all active:scale-95",
                isCopied
                    ? "text-emerald-500 bg-emerald-50"
                    : "text-slate-400 hover:text-slate-600 hover:bg-slate-100",
                className
            )}
            title="Копировать"
        >
            {isCopied ? <Check size={iconSize} /> : <Copy size={iconSize} />}
        </button>
    );
}


