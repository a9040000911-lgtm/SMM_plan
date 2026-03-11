'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Список популярных иконок для SMM-сервисов
export const ICON_GALLERY = [
    { name: 'layers', label: 'Подписчики (Layers)' },
    { name: 'heart', label: 'Лайки (Heart)' },
    { name: 'eye', label: 'Просмотры (Eye)' },
    { name: 'zap', label: 'Реакции (Zap)' },
    { name: 'share-2', label: 'Репосты (Share2)' },
    { name: 'message-circle', label: 'Комментарии (MessageCircle)' },
    { name: 'rocket', label: 'Бусты (Rocket)' },
    { name: 'bar-chart-2', label: 'Опросы (BarChart2)' },
    { name: 'camera', label: 'Истории (Camera)' },
    { name: 'user', label: 'Профиль (User)' },
    { name: 'play-circle', label: 'Видео (PlayCircle)' },
    { name: 'link', label: 'Ссылки (Link)' },
    { name: 'clock', label: 'Время (Clock)' },
    { name: 'star', label: 'Звезды (Star)' },
    { name: 'save', label: 'Сохранения (Save)' },
    { name: 'mouse-pointer-2', label: 'Клики (MousePointer2)' },
    { name: 'megaphone', label: 'Реклама (Megaphone)' },
    { name: 'shield', label: 'Гарантия (Shield)' },
    { name: 'globe', label: 'Весь мир (Globe)' },
    { name: 'flame', label: 'Хайп/Тренды (Flame)' },
    { name: 'at-sign', label: 'Упоминания (AtSign)' },
    { name: 'shopping-cart', label: 'Продажи (ShoppingCart)' },
    { name: 'mail', label: 'Рассылки (Mail)' },
    { name: 'award', label: 'Награды (Award)' },
    { name: 'activity', label: 'Активность (Activity)' },
    { name: 'trending-up', label: 'Рост (TrendingUp)' },
    { name: 'smile', label: 'Эмодзи (Smile)' },
    { name: 'thumbs-up', label: 'Лайк (ThumbsUp)' },
    { name: 'bell', label: 'Уведомления (Bell)' },
    { name: 'video', label: 'Стримы (Video)' }
];

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

// Помощник для получения компонента иконки по названию
export const getLucideIcon = (name: string) => {
    if (!name) return LucideIcons.Layers;

    // Приводим из шашлычного-регистра (layers-2) в ПаскальКейс (Layers2)
    const pascalName = name
        .split('-')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');

    return (LucideIcons as any)[pascalName] || (LucideIcons as any)[name] || LucideIcons.HelpCircle;
};

export function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Закрытие при клике вне компонента
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredIcons = ICON_GALLERY.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.label.toLowerCase().includes(search.toLowerCase())
    );

    const CurrentIcon = getLucideIcon(value);

    return (
        <div className={cn("relative", className)} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-900 flex items-center justify-between group h-[42px]"
            >
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-blue-600 shadow-sm">
                        <CurrentIcon size={14} />
                    </div>
                    <span className="text-sm">{value || 'Выберите иконку...'}</span>
                </div>
                <ChevronDown size={16} className={cn("text-slate-400 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 z-[110] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input
                            autoFocus
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Поиск иконки..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-5 gap-1 max-h-[240px] overflow-y-auto pr-1 modern-scrollbar">
                        {filteredIcons.map((item) => {
                            const IconComp = getLucideIcon(item.name);
                            const isActive = value === item.name;

                            return (
                                <button
                                    key={item.name}
                                    type="button"
                                    title={item.label}
                                    onClick={() => {
                                        onChange(item.name);
                                        setIsOpen(false);
                                        setSearch('');
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-2 rounded-xl transition-all relative group",
                                        isActive
                                            ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                            : "hover:bg-slate-50 text-slate-600 hover:text-blue-600"
                                    )}
                                >
                                    <IconComp size={18} />
                                    {isActive && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                            <Check size={8} className="text-white" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {filteredIcons.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ничего не найдено</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
