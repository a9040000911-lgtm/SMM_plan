/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
'use client';

import React, { useCallback } from 'react';
import { Search, X } from 'lucide-react';
import type { KBModule, KBFunction, KBMacro } from '@/data/kb-content';

interface KBSearchResult {
  type: 'function' | 'macro';
  moduleId: string;
  moduleTitle: string;
  item: KBFunction | KBMacro;
  matchField: string;
  matchSnippet: string;
}

interface KBSearchBarProps {
  knowledgeBase: KBModule[];
  onSearch: (query: string, results: KBSearchResult[]) => void;
  query: string;
  setQuery: (q: string) => void;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/[ё]/g, 'е').trim();
}

function findSnippet(text: string, query: string, contextLen = 60): string {
  const normalizedText = normalizeText(text);
  const normalizedQuery = normalizeText(query);
  const idx = normalizedText.indexOf(normalizedQuery);
  if (idx === -1) return text.slice(0, contextLen * 2) + '...';
  const start = Math.max(0, idx - contextLen);
  const end = Math.min(text.length, idx + query.length + contextLen);
  let snippet = '';
  if (start > 0) snippet += '...';
  snippet += text.slice(start, end);
  if (end < text.length) snippet += '...';
  return snippet;
}

export function searchKnowledgeBase(knowledgeBase: KBModule[], query: string): KBSearchResult[] {
  if (!query || query.length < 2) return [];
  const q = normalizeText(query);
  const results: KBSearchResult[] = [];

  for (const mod of knowledgeBase) {
    // Search functions
    for (const fn of mod.functions) {
      const searchableFields: [string, string][] = [
        ['title', fn.title],
        ['description', fn.description],
        ['howItWorks', fn.howItWorks],
        ['usage', fn.usage],
        ['risks', fn.risks],
      ];
      if (fn.glossary) {
        for (const [term, def] of Object.entries(fn.glossary)) {
          searchableFields.push(['glossary', `${term}: ${def}`]);
        }
      }
      if (fn.tags) {
        searchableFields.push(['tags', fn.tags.join(' ')]);
      }

      for (const [field, text] of searchableFields) {
        if (normalizeText(text).includes(q)) {
          results.push({
            type: 'function',
            moduleId: mod.id,
            moduleTitle: mod.title,
            item: fn,
            matchField: field,
            matchSnippet: findSnippet(text, query),
          });
          break; // One match per item is enough
        }
      }
    }

    // Search macros
    if (mod.macros) {
      for (const macro of mod.macros) {
        const searchableFields: [string, string][] = [
          ['title', macro.title],
          ['text', macro.text],
          ['situation', macro.situation || ''],
          ['analysis', macro.analysis || ''],
        ];
        if (macro.textSimple) {
          searchableFields.push(['textSimple', macro.textSimple]);
        }
        if (macro.tags) {
          searchableFields.push(['tags', macro.tags.join(' ')]);
        }

        for (const [field, text] of searchableFields) {
          if (text && normalizeText(text).includes(q)) {
            results.push({
              type: 'macro',
              moduleId: mod.id,
              moduleTitle: mod.title,
              item: macro,
              matchField: field,
              matchSnippet: findSnippet(text, query),
            });
            break;
          }
        }
      }
    }
  }

  return results;
}

export function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text;
  const normalizedQuery = normalizeText(query);
  const normalizedText = normalizeText(text);
  const idx = normalizedText.indexOf(normalizedQuery);
  if (idx === -1) return text;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);

  return (
    <>
      {before}
      <mark className="bg-amber-200/80 text-amber-900 rounded px-0.5 font-bold">{match}</mark>
      {after}
    </>
  );
}

export function KBSearchBar({ knowledgeBase, onSearch, query, setQuery }: KBSearchBarProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    const results = searchKnowledgeBase(knowledgeBase, value);
    onSearch(value, results);
  }, [knowledgeBase, onSearch, setQuery]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('', []);
  }, [onSearch, setQuery]);

  return (
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        <Search size={20} className="text-slate-300 group-focus-within:text-blue-500 transition-colors" />
      </div>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Мгновенный поиск по базе знаний... (модули, функции, макросы, глоссарий)"
        className="w-full pl-14 pr-14 py-4 bg-white border-2 border-slate-100 rounded-2xl text-base font-medium text-slate-800 placeholder:text-slate-300 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 outline-none transition-all shadow-sm hover:shadow-md focus:shadow-lg"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-300 hover:text-slate-500 transition-colors"
        >
          <X size={20} />
        </button>
      )}
    </div>
  );
}

export type { KBSearchResult };
