'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import * as React from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { ru } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import 'react-day-picker/dist/style.css';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

import { subDays, startOfDay } from 'date-fns';

interface DatePickerProps {
    className?: string;
    value?: Date;
    onChange?: (date: Date | undefined) => void;
    placeholder?: string;
    style?: React.CSSProperties;
    showPresets?: boolean;
}

export function DatePicker({
    className,
    value,
    onChange,
    placeholder = "Выберите дату",
    style,
    showPresets = true
}: DatePickerProps) {
    const [isOpen, setIsOpen] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);

    // Close on click outside
    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [ref]);

    const presets = [
        { label: 'Сегодня', getValue: () => startOfDay(new Date()) },
        { label: 'Вчера', getValue: () => startOfDay(subDays(new Date(), 1)) },
        { label: 'Неделю назад', getValue: () => startOfDay(subDays(new Date(), 7)) },
    ];

    return (
        <div className={cn("relative", className)} ref={ref} style={style}>
            <div
                className="flex items-center w-full bg-white/80 border border-slate-200 rounded-xl px-3 py-2 text-xs focus-within:ring-2 focus-within:ring-blue-500/20 transition-all shadow-sm cursor-pointer group hover:bg-white"
                onClick={() => setIsOpen(!isOpen)}
            >
                <CalendarIcon className="mr-2 h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                <span className={cn("flex-1 truncate", !value && "text-slate-400")}>
                    {value ? format(value, "dd.MM.yyyy", { locale: ru }) : placeholder}
                </span>
                {value && (
                    <div
                        role="button"
                        tabIndex={0}
                        className="ml-auto text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange?.(undefined);
                        }}
                    >
                        <X className="h-3 w-3" />
                    </div>
                )}
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full left-0 mt-2 bg-white border border-slate-200 rounded-[1.5rem] shadow-2xl p-0 overflow-hidden flex animate-in fade-in zoom-in-95 duration-200">
                    {showPresets && (
                        <div className="w-32 bg-slate-50 border-r border-slate-100 p-2 flex flex-col gap-1">
                            <div className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Быстрый выбор</div>
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    onClick={() => {
                                        onChange?.(preset.getValue());
                                        setIsOpen(false);
                                    }}
                                    className="text-left px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="p-2">
                        <DayPicker
                            mode="single"
                            selected={value}
                            onSelect={(date) => {
                                onChange?.(date);
                                setIsOpen(false);
                            }}
                            locale={ru}
                            initialFocus
                            modifiersClassNames={{
                                selected: 'bg-slate-900 text-white hover:bg-slate-800 rounded-lg',
                                today: 'text-blue-500 font-black'
                            }}
                            styles={{
                                caption: { color: 'rgb(15 23 42)', fontWeight: 900, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' },
                                head_cell: { color: 'rgb(100 116 139)', fontWeight: 800, fontSize: '10px' },
                                day: { borderRadius: '8px' }
                            }}
                            className='rdp-custom m-0'
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
