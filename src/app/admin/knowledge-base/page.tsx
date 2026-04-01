/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { knowledgeBase, SECTION_METADATA, type KBModule, type KBFunction, type KBMacro, type CustomMediaType } from '@/data/kb-content';
import { KBSearchBar, searchKnowledgeBase, highlightMatch, type KBSearchResult } from '@/components/admin/knowledge-base/kb-search';
import { KBTableOfContents } from '@/components/admin/knowledge-base/kb-toc';
import { KBFilters, type KBContentFilter, type KBPlatformFilter } from '@/components/admin/knowledge-base/kb-filters';
import { KBTextParser } from '@/components/admin/knowledge-base/kb-parser';
import { KBExamModal } from '@/components/admin/knowledge-base/kb-exam';
import { KBLinkDecoder } from '@/components/admin/knowledge-base/kb-link-decoder';
import {
    BookOpen,
    ChevronRight,
    AlertCircle,
    PlayCircle,
    HelpCircle,
    Info,
    ArrowRight,
    Layers,
    Zap,
    ShieldCheck,
    TrendingUp,
    MessageSquare,
    Copy,
    CheckCircle2,
    Check,
    Hash,
    ChevronDown,
    ChevronUp,
    Link as LinkIcon,
    Image as ImageIcon,
    BookmarkCheck,
    GraduationCap,
    Star,
    Crown as CrownIcon,
    Wallet,
    Trophy,
    Lock,
    Award
} from 'lucide-react';

// Custom Media Components (Rich Media / Visualizations)
function CustomMedia({ type }: { type: CustomMediaType }) {
    const [decoderValue, setDecoderValue] = useState<string>('[R30] Instagram Likes HQ | Max 50K | Speed 5K/D');
    if (type === 'tg-scam') {
        return (
            <div className="w-full bg-slate-100 rounded-xl p-4 flex flex-col gap-2 mt-4 items-center justify-center border border-slate-200 shadow-inner">
                <div className="bg-white p-3 rounded-2xl w-full max-w-sm flex gap-3 shadow-sm items-center">
                    <div className="w-12 h-12 bg-slate-200 rounded-full shrink-0" />
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h5 className="font-bold text-slate-800 text-sm">Crypto Admin</h5>
                            <span className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm">Scam</span>
                        </div>
                        <p className="text-xs text-slate-400">120,400 subscribers</p>
                    </div>
                </div>
                <p className="text-[10px] text-slate-500 italic mt-1">Визуализация: Так выглядит жалоба в профиле Telegram.</p>
            </div>
        );
    }
    
    if (type === 'spike-chart') {
        return (
            <div className="w-full bg-white rounded-xl p-4 flex flex-col gap-4 mt-4 border border-rose-200 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-400 to-rose-600" />
                <h6 className="text-xs font-black text-rose-700 uppercase tracking-widest text-center">График Spikes (Риск блокировки)</h6>
                <div className="flex items-end justify-center h-20 gap-1 opacity-80 mt-2">
                    <div className="w-8 h-2 bg-slate-200 rounded-t-sm" />
                    <div className="w-8 h-2 bg-slate-200 rounded-t-sm" />
                    <div className="w-8 h-20 bg-rose-500 rounded-t-sm animate-pulse shadow-lg shadow-rose-200" />
                    <div className="w-8 h-2 bg-slate-200 rounded-t-sm" />
                    <div className="w-8 h-2 bg-slate-200 rounded-t-sm" />
                </div>
                <div className="flex items-center gap-2 justify-center mt-2 px-2 py-1 bg-rose-50 rounded-lg text-rose-800 text-[10px] font-bold">
                    <AlertCircle size={12} /> Аномальный скачок за 1 час
                </div>
            </div>
        );
    }

    if (type === 'pipeline-funnel') {
        return (
            <div className="w-full bg-indigo-50 rounded-xl p-4 flex flex-col gap-2 mt-4 items-center justify-center border border-indigo-200">
                <h6 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Воронка допродажи (Upsell)</h6>
                <div className="w-48 h-8 bg-blue-500 rounded-t-lg flex items-center justify-center text-white text-xs font-bold shadow-md">Подписчики ($100)</div>
                <div className="w-32 h-8 bg-indigo-500 flex items-center justify-center text-white text-xs font-bold shadow-md">Лайки ($30)</div>
                <div className="w-20 h-8 bg-emerald-500 rounded-b-lg flex items-center justify-center text-white text-xs font-bold shadow-md">Репосты ($10)</div>
            </div>
        );
    }

    if (type === 'service-decoder') {
        const analyzeService = (str: string) => {
            const tags = [];
            const s = str.toUpperCase();
            if (s.includes(' [AR]') || s.includes('[AR]')) tags.push({ label: 'Auto-Refill', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '♻️' });
            if (s.includes('R30') || s.includes('[R30]')) tags.push({ label: 'Гарантия 30 Дней', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: '🛡️' });
            if (s.includes('ND') || s.includes('NON-DROP')) tags.push({ label: 'Non-Drop (Без списаний)', color: 'bg-green-100 text-green-800 border-green-300', icon: '💎' });
            if (s.includes('NR') || s.includes('NO REFILL')) tags.push({ label: 'No Refill (БЕЗ ГАРАНТИИ)', color: 'bg-rose-100 text-rose-800 border-rose-300', icon: '⚠️' });
            if (s.includes('HQ')) tags.push({ label: 'Качество: Высокое (HQ)', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: '✨' });
            if (s.includes('FQ') || s.includes('BOT')) tags.push({ label: 'Качество: Боты', color: 'bg-slate-100 text-slate-800 border-slate-300', icon: '🤖' });
            if (s.includes('REAL')) tags.push({ label: 'Живые (Офферы)', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: '👤' });
            if (s.includes('HR')) tags.push({ label: 'Высокое удержание (HR)', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: '⏱️' });
            
            // Regex for Max
            const maxMatch = s.match(/MAX\s*(\d+[KMkm]?)/i);
            if (maxMatch) tags.push({ label: `Лимит БД: ${maxMatch[1]}`, color: 'bg-orange-100 text-orange-800 border-orange-300', icon: '📊' });
            
            // Speed
            const speedMatch = s.match(/SPEED\s*([^|\-]+)/i);
            if (speedMatch) tags.push({ label: `Скорость: ${speedMatch[1].trim()}`, color: 'bg-cyan-100 text-cyan-800 border-cyan-300', icon: '🚀' });
            
            return tags;
        };
        const parsedTags = analyzeService(decoderValue);

        return (
            <div className="w-full bg-slate-900 rounded-3xl p-6 lg:p-8 flex flex-col gap-6 mt-6 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full" />
                <div className="relative z-10">
                    <h6 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <Trophy size={14} /> Симулятор-Расшифровщик API
                    </h6>
                    <p className="text-sm text-slate-400 mb-4">Скопируйте название услуги провайдера в это поле, чтобы узнать, что оно значит на самом деле.</p>
                    <input 
                        type="text" 
                        value={decoderValue}
                        onChange={(e) => setDecoderValue(e.target.value)}
                        className="w-full bg-black/50 border border-slate-700 text-emerald-400 font-mono text-sm p-4 rounded-xl focus:outline-none focus:border-blue-500 transition-colors shadow-inner"
                        placeholder="Вставьте название услуги, например: [R30] Telegram Members HQ..."
                    />
                </div>
                
                <div className="relative z-10 bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 min-h-[100px]">
                    {parsedTags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {parsedTags.map((t, idx) => (
                                <div key={idx} className={`px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-2 ${t.color}`}>
                                    <span>{t.icon}</span>
                                    <span>{t.label}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-slate-500 text-[10px] font-black uppercase tracking-widest">
                            Нет знакомых тегов (Возможно это Mix)
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return null;
}

export default function KnowledgeBasePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<KBSearchResult[]>([]);
    const [contentFilter, setContentFilter] = useState<KBContentFilter>('all');
    const [platformFilter, setPlatformFilter] = useState<KBPlatformFilter>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [readModules, setReadModules] = useState<Set<string>>(new Set());

    const [showConfetti, setShowConfetti] = useState(false);
    const [isExamOpen, setIsExamOpen] = useState(false);
    const [isCertified, setIsCertified] = useState(false);

    const unreadCount = knowledgeBase.length - readModules.size;
    const isAllRead = unreadCount <= 0;

    // Load progress
    useEffect(() => {
        const saved = localStorage.getItem('smmplan_kb_progress');
        if (saved) {
            try {
                setReadModules(new Set(JSON.parse(saved)));
            } catch (e: any) {
                console.warn('Failed to parse kb progress:', e.message);
            }
        }
    }, []);

    // Save progress
    const markAsRead = useCallback((moduleId: string) => {
        setReadModules(prev => {
            const next = new Set(prev);
            next.add(moduleId);
            localStorage.setItem('smmplan_kb_progress', JSON.stringify(Array.from(next)));
            
            // Check for 100% completion trigger
            if (next.size === knowledgeBase.length && prev.size !== knowledgeBase.length) {
                setShowConfetti(true);
            }
            return next;
        });
    }, []);

    // Collect all unique platforms from KB data
    const availablePlatforms = useMemo(() => {
        const platforms = new Set<string>();
        for (const mod of knowledgeBase) {
            mod.platforms?.forEach(p => platforms.add(p));
            mod.functions.forEach(fn => fn.platforms?.forEach(p => platforms.add(p)));
            mod.macros?.forEach(m => m.platforms?.forEach(p => platforms.add(p)));
        }
        return Array.from(platforms).sort();
    }, []);

    // Helper: Find item by ID for cross-linking
    const resolveKbItemInfo = useCallback((id: string) => {
        let foundTitle = '';
        let foundSectionIcon: any = LinkIcon;
        for (const mod of knowledgeBase) {
            for (const fn of mod.functions) {
                if (fn.id === id) { foundTitle = fn.title; foundSectionIcon = fn.icon; break; }
            }
            if (mod.macros) {
                for (const m of mod.macros) {
                    if (m.id === id) { foundTitle = m.title; foundSectionIcon = MessageSquare; break; }
                }
            }
        }
        return { title: foundTitle, icon: foundSectionIcon };
    }, []);

    // Filter modules based on search, content filter, and platform filter
    const filteredModules = useMemo(() => {
        let modules = [...knowledgeBase];

        // If searching, only show modules that have matching items
        if (searchQuery.length >= 2) {
            const matchingIds = new Set(searchResults.map(r => (r.item as any).id));
            modules = modules.map(mod => ({
                ...mod,
                functions: mod.functions.filter(fn => matchingIds.has(fn.id)),
                macros: mod.macros?.filter(m => matchingIds.has(m.id)),
            })).filter(mod => mod.functions.length > 0 || (mod.macros && mod.macros.length > 0));
        }

        // Content filter
        if (contentFilter === 'functions') {
            modules = modules.map(mod => ({ ...mod, macros: [] }))
                .filter(mod => mod.functions.length > 0);
        } else if (contentFilter === 'macros') {
            modules = modules.map(mod => ({ ...mod, functions: [] }))
                .filter(mod => mod.macros && mod.macros.length > 0);
        }

        // Platform filter
        if (platformFilter) {
            modules = modules.map(mod => ({
                ...mod,
                functions: mod.functions.filter(fn =>
                    fn.platforms?.includes(platformFilter) ||
                    mod.platforms?.includes(platformFilter)
                ),
                macros: mod.macros?.filter(m =>
                    m.platforms?.includes(platformFilter) ||
                    mod.platforms?.includes(platformFilter)
                ),
            })).filter(mod => mod.functions.length > 0 || (mod.macros && mod.macros.length > 0));
        }

        return modules;
    }, [searchQuery, searchResults, contentFilter, platformFilter]);

    // Group filtered modules by section
    const sectionedModules = useMemo(() => {
        const grouped = new Map<string, KBModule[]>();
        for (const mod of filteredModules) {
            if (!grouped.has(mod.section)) {
                grouped.set(mod.section, []);
            }
            grouped.get(mod.section)!.push(mod);
        }
        const order = ['GENERAL', 'PLATFORMS', 'ANTIFRAUD', 'SUPPORT', 'ADMIN'];
        return order.map(s => ({
            key: s as keyof typeof SECTION_METADATA,
            modules: grouped.get(s) || []
        })).filter(s => s.modules.length > 0);
    }, [filteredModules]);

    const totalModules = knowledgeBase.length;
    const readCount = readModules.size;
    const progressPercent = Math.round((readCount / totalModules) * 100) || 0;

    // Gamification Rank calculation
    const currentRank = useMemo(() => {
        if (progressPercent >= 100) return { title: 'B2B Эксперт Smmplan', icon: CrownIcon, color: 'text-amber-500', bg: 'bg-amber-100/50', bar: 'bg-gradient-to-r from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20' };
        if (progressPercent >= 70) return { title: 'Middle Траблшутер', icon: Star, color: 'text-indigo-500', bg: 'bg-indigo-50', bar: 'bg-indigo-500' };
        if (progressPercent >= 34) return { title: 'Junior Support', icon: Award, color: 'text-blue-500', bg: 'bg-blue-50', bar: 'bg-blue-500' };
        return { title: 'Стажер (Начинающий)', icon: GraduationCap, color: 'text-slate-500', bg: 'bg-slate-100', bar: 'bg-emerald-500' };
    }, [progressPercent]);

    // IntersectionObserver for active section tracking
    useEffect(() => {
        const sectionElements = document.querySelectorAll('[data-kb-section]');
        if (sectionElements.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        setActiveId(entry.target.id);
                    }
                }
            },
            { rootMargin: '-20% 0px -70% 0px' }
        );

        sectionElements.forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, [sectionedModules]);

    const handleSearch = useCallback((query: string, results: KBSearchResult[]) => {
        setSearchResults(results);
    }, []);

    const toggleModule = useCallback((moduleId: string) => {
        setExpandedModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    }, []);

    const copyToClipboard = useCallback((text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    const totalItems = useMemo(() => {
        let count = 0;
        filteredModules.forEach(m => {
            count += m.functions.length;
            count += m.macros?.length || 0;
        });
        return count;
    }, [filteredModules]);

    const isSearching = searchQuery.length >= 2;

    const renderText = (text: string) => {
        if (isSearching) {
            return highlightMatch(text, searchQuery);
        }
        return <KBTextParser text={text} />;
    };

    return (
        <div className="max-w-[1600px] mx-auto pb-20 px-4">
            {/* Header & Onboarding Tracker */}
            <div className="space-y-6 mb-8">
                {/* Render Celebration Overlay */}
                {showConfetti && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-500">
                        <div className="bg-white p-8 lg:p-12 rounded-[3rem] max-w-2xl w-full text-center relative overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                            {/* Decorative background sunburst */}
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/50 via-white to-white pointer-events-none" />
                            
                            <div className="relative z-10 space-y-6">
                                <div className="mx-auto w-32 h-32 bg-gradient-to-tr from-amber-300 to-yellow-500 rounded-full flex items-center justify-center shadow-inner shadow-white/50 border-4 border-amber-100 animate-bounce">
                                    <CrownIcon size={64} className="text-white drop-shadow-md" />
                                </div>
                                
                                <div>
                                    <h2 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Абсолютный Эксперт!</h2>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-lg mx-auto">
                                        Вы изучили <strong className="text-amber-600">100%</strong> материалов Базы Знаний, успешно сдали все тесты и получили статус B2B Эксперта Smmplan!
                                    </p>
                                </div>

                                <div className="py-6 flex justify-center gap-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 w-1/3">
                                        <ShieldCheck size={24} className="mx-auto text-emerald-500 mb-2" />
                                        <div className="text-[10px] font-black uppercase text-slate-400">Антифрод</div>
                                        <div className="text-lg font-bold text-slate-700">✓ Пройден</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 w-1/3">
                                        <TrendingUp size={24} className="mx-auto text-blue-500 mb-2" />
                                        <div className="text-[10px] font-black uppercase text-slate-400">Маркетинг</div>
                                        <div className="text-lg font-bold text-slate-700">✓ Изучен</div>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 w-1/3">
                                        <Wallet size={24} className="mx-auto text-amber-500 mb-2" />
                                        <div className="text-[10px] font-black uppercase text-slate-400">Экономика</div>
                                        <div className="text-lg font-bold text-slate-700">✓ Понята</div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => setShowConfetti(false)}
                                    className="px-10 py-4 bg-slate-900 text-white font-bold text-sm tracking-widest uppercase rounded-2xl shadow-xl shadow-slate-900/20 hover:scale-105 transition-all w-full md:w-auto"
                                >
                                    Приступить к работе
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">База Знаний V3</h1>
                            <p className="text-slate-500 font-medium">Ваш навигатор по интеллектуальным модулям SMM-платформы</p>
                        </div>
                    </div>
                    
                    {/* Progress Bar (Onboarding) */}
                    <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-sm w-full lg:w-80">
                        <div className="flex justify-between items-end mb-2">
                            <h5 className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 px-2 py-1 rounded-md ${currentRank.bg} ${currentRank.color}`}>
                                <currentRank.icon size={14} /> {currentRank.title}
                            </h5>
                            <span className={`text-sm font-bold ${currentRank.color}`}>{progressPercent}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-1000 ease-out ${currentRank.bar}`} style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="mt-2 text-[10px] font-medium text-slate-400 flex justify-between">
                            <span>Изучено {readCount} из {totalModules} модулей</span>
                            {progressPercent === 100 && <span className="text-amber-500 font-bold">✓ Сертификация пройдена</span>}
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <KBSearchBar
                    knowledgeBase={knowledgeBase}
                    onSearch={handleSearch}
                    query={searchQuery}
                    setQuery={setSearchQuery}
                />

                {/* Filters */}
                <KBFilters
                    contentFilter={contentFilter}
                    setContentFilter={setContentFilter}
                    platformFilter={platformFilter}
                    setPlatformFilter={setPlatformFilter}
                    availablePlatforms={availablePlatforms}
                    resultCount={totalItems}
                />
            </div>

            {/* Neuro Link Decoder Tool */}
            <div className="mb-8">
                <KBLinkDecoder />
            </div>

            {/* Main Layout: Content + TOC */}
            <div className="flex gap-8">
                {/* Content Area */}
                <div className="flex-1 min-w-0 space-y-8">
                    {/* Quick Search Results panel */}
                    {isSearching && searchResults.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-6 space-y-3">
                            <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <Zap size={14} /> Быстрые результаты ({searchResults.length})
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {searchResults.slice(0, 8).map((result, i) => (
                                    <a
                                        key={i}
                                        href={`#${(result.item as any).id}`}
                                        className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-blue-50 transition-all group border border-transparent hover:border-blue-200"
                                    >
                                        <div className={`p-1.5 rounded-lg text-xs font-black ${
                                            result.type === 'macro'
                                                ? 'bg-indigo-100 text-indigo-600'
                                                : 'bg-emerald-100 text-emerald-600'
                                        }`}>
                                            {result.type === 'macro' ? <MessageSquare size={12} /> : <BookOpen size={12} />}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-bold text-slate-700 truncate">
                                                {highlightMatch((result.item as any).title, searchQuery)}
                                            </div>
                                            <div className="text-[10px] text-slate-400 truncate">
                                                {result.moduleTitle} · {result.matchField}
                                            </div>
                                        </div>
                                        <ChevronRight size={14} className="ml-auto shrink-0 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No results */}
                    {isSearching && searchResults.length === 0 && (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-300 text-2xl">🔍</div>
                            <h3 className="text-lg font-bold text-slate-500">Ничего не найдено</h3>
                            <p className="text-sm text-slate-400">Попробуйте другой запрос или сбросьте фильтры</p>
                        </div>
                    )}

                    {/* Sections & Modules */}
                    {sectionedModules.map(({ key, modules }) => {
                        const meta = SECTION_METADATA[key];
                        return (
                            <div key={key} className="space-y-6">
                                {/* Section Header */}
                                <div className={`px-6 py-5 rounded-[2rem] border ${meta.colorClass} flex items-center gap-4`}>
                                    <div className="p-3 bg-white/60 rounded-xl shadow-sm backdrop-blur-sm">
                                        <meta.icon size={28} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-widest">{meta.title}</h2>
                                        <p className="text-sm font-medium opacity-80 mt-0.5">{meta.description}</p>
                                    </div>
                                </div>

                                {/* Section Modules */}
                                {modules.map((module) => {
                                    const isExpanded = expandedModules.has(module.id) || isSearching; // Auto-expand when searching
                                    const isRead = readModules.has(module.id);
                                    
                                    return (
                                        <div key={module.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden hover:border-blue-200 transition-all group ml-2 lg:ml-6 relative">
                                            {/* Connector Line from Section */}
                                            <div className={`absolute -left-6 lg:-left-6 top-12 w-6 border-b-2 border-dashed ${meta.colorClass.split(' ')[2]} opacity-30`} />

                                            {/* Module Header */}
                                            <button
                                                onClick={() => toggleModule(module.id)}
                                                className="w-full p-8 border-b border-slate-50 bg-slate-50/30 text-left flex items-center justify-between"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-white rounded-2xl text-slate-700 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all relative">
                                                        <module.icon size={24} />
                                                        {isRead && <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white text-white flex items-center justify-center"><Check size={12} strokeWidth={4} /></div>}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-800">{isSearching ? highlightMatch(module.title, searchQuery) : module.title}</h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Модуль {module.id.toUpperCase().slice(0, 8)}</span>
                                                            {module.platforms && module.platforms.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 ml-2">
                                                                    {module.platforms.slice(0, 4).map(p => (
                                                                        <span key={p} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg">{p}</span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-2 text-slate-300 flex items-center gap-4">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="p-6 space-y-6">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <p className="text-slate-600 font-medium leading-relaxed italic text-sm px-2 flex-1 relative">
                                                            <span className="opacity-40 font-serif text-3xl absolute -top-2 -left-3 leading-none">&ldquo;</span>
                                                            {isSearching ? highlightMatch(module.description, searchQuery) : module.description}
                                                        </p>
                                                        {!isRead && (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); markAsRead(module.id); }}
                                                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-colors shrink-0"
                                                            >
                                                                <BookmarkCheck size={16} /> Прочитано
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Functions */}
                                                    {module.functions.length > 0 && (
                                                        <div className="space-y-4">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                                                <Layers size={14} /> Функции ({module.functions.length})
                                                            </h4>
                                                            {module.functions.map((fn) => (
                                                                <section
                                                                    id={fn.id}
                                                                    key={fn.id}
                                                                    data-kb-section
                                                                    className="scroll-mt-24 bg-slate-50 rounded-[2rem] border border-slate-100 overflow-hidden"
                                                                >
                                                                    <div className="p-6 border-b border-slate-100/50 flex items-center gap-4">
                                                                        <div className="p-3 bg-white rounded-xl text-blue-600 shadow-sm">
                                                                            <fn.icon size={20} />
                                                                        </div>
                                                                        <div>
                                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider rounded-md">Экспертиза</span>
                                                                            </div>
                                                                            <h4 className="text-lg font-black text-slate-800">
                                                                                {isSearching ? highlightMatch(fn.title, searchQuery) : fn.title}
                                                                            </h4>
                                                                        </div>
                                                                    </div>

                                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center gap-2 text-blue-600">
                                                                                <PlayCircle size={16} />
                                                                                <h5 className="font-black uppercase tracking-widest text-[10px]">Принцип работы</h5>
                                                                            </div>
                                                                            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 relative overflow-hidden">
                                                                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                                                                    <HelpCircle size={60} />
                                                                                </div>
                                                                                <p className="text-slate-700 font-medium leading-relaxed text-sm relative z-10 w-full break-words">
                                                                                    {renderText(fn.howItWorks)}
                                                                                </p>
                                                                            </div>

                                                                            {/* Visualizations (Custom Media) */}
                                                                            {fn.customMedia && (
                                                                                <CustomMedia type={fn.customMedia} />
                                                                            )}

                                                                            <div className="space-y-2">
                                                                                <div className="flex items-center gap-2 text-slate-800">
                                                                                    <Info size={16} />
                                                                                    <h5 className="font-black uppercase tracking-widest text-[10px]">Инструкция / Комментарий</h5>
                                                                                </div>
                                                                                <p className="text-slate-600 font-medium leading-relaxed pl-4 border-l-2 border-slate-200 text-sm">
                                                                                    {renderText(fn.usage)}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        <div className="space-y-4">
                                                                            <div className="flex items-center gap-2 text-rose-600">
                                                                                <AlertCircle size={16} />
                                                                                <h5 className="font-black uppercase tracking-widest text-[10px]">Риски / Чего НЕ делать</h5>
                                                                            </div>
                                                                            <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100">
                                                                                <p className="text-rose-900 font-bold text-sm leading-relaxed">
                                                                                    {renderText(fn.risks)}
                                                                                </p>
                                                                            </div>

                                                                            {fn.glossary && Object.keys(fn.glossary).length > 0 && (
                                                                                <div className="space-y-2">
                                                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                                                        <BookOpen size={16} />
                                                                                        <h5 className="font-black uppercase tracking-widest text-[10px]">Ключевые слова</h5>
                                                                                    </div>
                                                                                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 space-y-2">
                                                                                        {Object.entries(fn.glossary).map(([term, definition]) => (
                                                                                            <div key={term}>
                                                                                                <span className="text-xs font-black text-emerald-800">{term}</span>
                                                                                                <span className="text-xs text-emerald-700/70 ml-2">{definition}</span>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Cross Linking (Related Topics) */}
                                                                    {fn.relatedIds && fn.relatedIds.length > 0 && (
                                                                        <div className="px-6 pb-6 pt-2 border-t border-slate-100/50 mt-4 flex items-center gap-3">
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">📚 Связанные темы:</span>
                                                                            <div className="flex flex-wrap gap-2">
                                                                                {fn.relatedIds.map(rid => {
                                                                                    const info = resolveKbItemInfo(rid);
                                                                                    if (!info.title) return null;
                                                                                    return (
                                                                                        <a key={rid} href={`#${rid}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 transition-colors shadow-sm">
                                                                                            <info.icon size={12} className="opacity-50" />
                                                                                            {info.title}
                                                                                        </a>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </section>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Macros */}
                                                    {module.macros && module.macros.length > 0 && (
                                                        <div className="space-y-4 mt-8">
                                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                                                                <MessageSquare size={14} /> Скрипты ответов ({module.macros.length})
                                                            </h4>
                                                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                                {module.macros.map((macro) => (
                                                                    <div
                                                                        key={macro.id}
                                                                        id={macro.id}
                                                                        data-kb-section
                                                                        className="scroll-mt-24 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col"
                                                                    >
                                                                        {/* Macro Header */}
                                                                        <div className="flex items-center gap-2 mb-4">
                                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                                                macro.category === 'TRUST' ? 'bg-emerald-100 text-emerald-700' :
                                                                                macro.category === 'TECH' ? 'bg-blue-100 text-blue-700' :
                                                                                macro.category === 'CONFLICT' ? 'bg-rose-100 text-rose-700' :
                                                                                macro.category === 'SALES' ? 'bg-orange-100 text-orange-700' :
                                                                                macro.category === 'TELEGRAM' ? 'bg-sky-100 text-sky-700' :
                                                                                macro.category === 'ALGO' ? 'bg-purple-100 text-purple-700' :
                                                                                macro.category === 'FINANCE' ? 'bg-amber-100 text-amber-700' :
                                                                                'bg-slate-100 text-slate-700'
                                                                            }`}>
                                                                                {macro.category}
                                                                            </span>
                                                                            <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase truncate max-w-[200px]">
                                                                                {isSearching ? highlightMatch(macro.title, searchQuery) : macro.title}
                                                                            </span>
                                                                        </div>

                                                                        {/* Situation */}
                                                                        {macro.situation && (
                                                                            <div className="mb-4 p-3 bg-rose-50/50 rounded-xl border border-rose-100/50 italic text-xs text-rose-800/70 font-medium">
                                                                                <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 not-italic flex items-center gap-1">
                                                                                    <AlertCircle size={10} /> Контекст / Возражение
                                                                                </div>
                                                                                &ldquo;{isSearching ? highlightMatch(macro.situation, searchQuery) : macro.situation}&rdquo;
                                                                            </div>
                                                                        )}

                                                                        {/* Response Variants */}
                                                                        <div className="space-y-3 flex-1 flex flex-col justify-end">
                                                                            {/* Official */}
                                                                            <div className="p-4 bg-slate-900 rounded-2xl relative group/official">
                                                                                <div className="flex justify-between items-center mb-2">
                                                                                    <span className="text-[9px] font-black text-indigo-400 tracking-widest uppercase">🏢 B2B / Официальный ответ</span>
                                                                                    <button
                                                                                        onClick={() => copyToClipboard(macro.text, `${macro.id}-official`)}
                                                                                        className="text-slate-500 hover:text-white transition-colors"
                                                                                    >
                                                                                        {copiedId === `${macro.id}-official`
                                                                                            ? <Check size={14} className="text-emerald-400" />
                                                                                            : <Copy size={14} />
                                                                                        }
                                                                                    </button>
                                                                                </div>
                                                                                <p className="text-xs font-medium text-slate-300 leading-relaxed break-words">
                                                                                    {renderText(macro.text)}
                                                                                </p>
                                                                            </div>

                                                                            {/* Simple */}
                                                                            {macro.textSimple && (
                                                                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 relative group/simple">
                                                                                    <div className="flex justify-between items-center mb-2">
                                                                                        <span className="text-[9px] font-black text-emerald-600 tracking-widest uppercase">🤝 B2C / Простой скрипт</span>
                                                                                        <button
                                                                                            onClick={() => copyToClipboard(macro.textSimple!, `${macro.id}-simple`)}
                                                                                            className="text-slate-400 hover:text-emerald-600 transition-colors"
                                                                                        >
                                                                                            {copiedId === `${macro.id}-simple`
                                                                                                ? <Check size={14} className="text-emerald-500" />
                                                                                                : <Copy size={14} />
                                                                                        }
                                                                                        </button>
                                                                                    </div>
                                                                                    <p className="text-xs font-medium text-slate-700 leading-relaxed break-words">
                                                                                        {renderText(macro.textSimple)}
                                                                                    </p>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Macro Cross Links */}
                                                                        {macro.relatedIds && macro.relatedIds.length > 0 && (
                                                                            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center gap-3">
                                                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">📚 См. также:</span>
                                                                                <div className="flex flex-wrap gap-2">
                                                                                    {macro.relatedIds.map(rid => {
                                                                                        const info = resolveKbItemInfo(rid);
                                                                                        if (!info.title) return null;
                                                                                        return (
                                                                                            <a key={rid} href={`#${rid}`} className="px-2 py-1 bg-slate-50 text-slate-500 rounded-md text-[9px] font-bold hover:bg-slate-100 transition-colors">
                                                                                                {info.title}
                                                                                            </a>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Mark as read local button if not read */}
                                                    {!readModules.has(module.id) && (
                                                        <div className="mt-8 border-t border-slate-100/50 pt-8 flex justify-center">
                                                            <button 
                                                                onClick={() => markAsRead(module.id)}
                                                                className="px-6 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors flex items-center gap-2"
                                                            >
                                                                <Check size={16} /> Понято и прочитано
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {/* Final Certification Block */}
                    {!isSearching && (
                        <div className={`mt-12 p-8 md:p-12 rounded-[2rem] border relative overflow-hidden transition-all duration-500 flex flex-col items-center justify-center text-center ${
                            isCertified 
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400/50 shadow-2xl shadow-emerald-500/20' 
                                : isAllRead
                                    ? 'bg-slate-900 border-indigo-500/30'
                                    : 'bg-slate-50 border-slate-200'
                        }`}>
                            {isCertified && (
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay" />
                            )}
                            
                            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 z-10 ${
                                isCertified ? 'bg-white/20 text-white shadow-xl backdrop-blur-md' : 'bg-slate-800 text-indigo-400 shadow-xl'
                            }`}>
                                <CrownIcon size={40} className={isCertified ? "fill-white/20" : ""} />
                            </div>

                            <h2 className={`text-3xl font-black mb-4 z-10 ${isCertified ? 'text-white' : isAllRead ? 'text-white' : 'text-slate-800'}`}>
                                Итоговая Сертификация Саппорта
                            </h2>
                            
                            <p className={`text-base font-medium max-w-lg mb-8 z-10 ${isCertified ? 'text-emerald-50' : isAllRead ? 'text-slate-400' : 'text-slate-500'}`}>
                                {isCertified 
                                    ? 'Вы успешно сдали технический экзамен по архитектуре, алгоритмам и юнит-экономике. Ваш статус "Эксперт" теперь привязан к профилю.'
                                    : isAllRead
                                        ? 'Вы прочитали все модули базы знаний. Настало время доказать вашу компетентность на реальных кейсах. У вас неограниченное количество попыток.'
                                        : `Вам необходимо полностью изучить материал, прежде чем сдавать экзамен. Осталось непрочитанных модулей: ${unreadCount}.`
                                }
                            </p>

                            {!isCertified && (
                                <button
                                    disabled={!isAllRead}
                                    onClick={() => setIsExamOpen(true)}
                                    className={`relative z-10 px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 flex items-center gap-3 ${
                                        isAllRead
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30 hover:scale-105 hover:-translate-y-1'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                                >
                                    {isAllRead ? (
                                        <><Award size={20} /> Пройти Экзамен</>
                                    ) : (
                                        <><Lock size={20} /> Доступ Закрыт</>
                                    )}
                                </button>
                            )}

                            {isCertified && (
                                <div className="relative z-10 inline-flex items-center gap-2 px-6 py-3 bg-white/10 border border-white/20 rounded-full text-white font-bold text-xs uppercase tracking-widest backdrop-blur-md">
                                    <CheckCircle2 size={16} /> Сертификация Засчитана
                                </div>
                            )}
                        </div>
                    )}

                    {/* Footer */}
                    {!isSearching && (
                        <div className="pt-12 text-center space-y-4">
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-50 rounded-2xl text-emerald-700 font-black text-[10px] uppercase tracking-widest border border-emerald-100">
                                <ShieldCheck size={14} /> Режим: Обучение Саппорта (Level 3)
                            </div>
                        </div>
                    )}
                </div>

                {/* Table of Contents Sidebar */}
                <div className="hidden lg:block w-72 xl:w-80 shrink-0">
                    <KBTableOfContents
                        knowledgeBase={filteredModules}
                        activeId={activeId}
                    />
                </div>
            </div>
            
            {/* Exam Modal */}
            <KBExamModal 
                isOpen={isExamOpen}
                onClose={() => setIsExamOpen(false)}
                onPass={() => {
                    setIsCertified(true);
                    setShowConfetti(true);
                }}
            />
        </div>
    );
}
