/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
'use client';

import React from 'react';
import { Layers, BookOpen, MessageSquare, Hash } from 'lucide-react';

export type KBContentFilter = 'all' | 'functions' | 'macros';
export type KBPlatformFilter = string | null;

interface KBFiltersProps {
  contentFilter: KBContentFilter;
  setContentFilter: (f: KBContentFilter) => void;
  platformFilter: KBPlatformFilter;
  setPlatformFilter: (p: KBPlatformFilter) => void;
  availablePlatforms: string[];
  resultCount?: number;
}

const contentFilterOptions: { value: KBContentFilter; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'Все', icon: <Layers size={14} /> },
  { value: 'functions', label: 'Функции', icon: <BookOpen size={14} /> },
  { value: 'macros', label: 'Макросы', icon: <MessageSquare size={14} /> },
];

const platformIcons: Record<string, string> = {
  'Telegram': '✈️',
  'VK': '🔵',
  'Instagram': '📸',
  'TikTok': '🎵',
  'YouTube': '▶️',
  'Facebook': '👤',
  'Twitter': '🐦',
  'Twitch': '🟣',
  'Rutube': '🔴',
  'Дзен': '📰',
  'Likee': '💖',
};

export function KBFilters({
  contentFilter,
  setContentFilter,
  platformFilter,
  setPlatformFilter,
  availablePlatforms,
  resultCount,
}: KBFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Content Type Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Тип:</span>
        {contentFilterOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setContentFilter(opt.value)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all
              ${contentFilter === opt.value
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}
            `}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}

        {resultCount !== undefined && (
          <div className="ml-auto px-3 py-1.5 bg-slate-100 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {resultCount} {resultCount === 1 ? 'результат' : resultCount < 5 ? 'результата' : 'результатов'}
          </div>
        )}
      </div>

      {/* Platform Filters */}
      {availablePlatforms.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-1">
            <Hash size={12} />
            Платформа:
          </span>
          <button
            type="button"
            onClick={() => setPlatformFilter(null)}
            className={`
              px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all
              ${platformFilter === null
                ? 'bg-slate-800 text-white'
                : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}
            `}
          >
            Все
          </button>
          {availablePlatforms.map((platform) => (
            <button
              key={platform}
              type="button"
              onClick={() => setPlatformFilter(platformFilter === platform ? null : platform)}
              className={`
                inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all
                ${platformFilter === platform
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-transparent hover:border-blue-200'}
              `}
            >
              <span>{platformIcons[platform] || '🔗'}</span>
              {platform}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
