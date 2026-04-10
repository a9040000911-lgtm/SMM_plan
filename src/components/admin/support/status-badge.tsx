import React from 'react';
import { AlertCircle, Clock, Check } from 'lucide-react';

export function StatusBadge({ status }: { status: string }) {
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
