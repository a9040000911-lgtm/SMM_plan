'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { useState } from 'react';
import { Button, AdminCard } from '@/components/admin/ui';
import {
    Bot,
    Save,
    LayoutGrid,
    MessageSquare,
    Wand2,
    Check,
    Play,
    Trash2,
    Plus,
    Eye,
    EyeOff
} from 'lucide-react';
import {
    checkBotTokenAction,
    updateBotIdentityAction,
    saveBotFullConfigAction,
    removeBotTokenAction
} from '@/app/admin/projects/[id]/actions-bot';
import { generateFunnelAction } from '@/app/admin/projects/[id]/actions';
import { sanitizeHtml } from '@/utils/sanitizer';
import { Tone } from '@/services/ai/bot-module.generator';
import { toast } from 'sonner';

// --- CONSTANTS FROM APPEARANCE EDITOR ---
const AVAILABLE_ACTIONS = [
    { id: 'ORDER', label: '🚀 Заказать', icon: '🚀', description: 'Выбор категории услуг.' },
    { id: 'AUTO', label: '🤖 Авто-пилот', icon: '🤖', description: 'Умный анализ ссылки.' },
    { id: 'BALANCE', label: '💼 Баланс', icon: '💼', description: 'Баланс и пополнение.' },
    { id: 'ORDERS', label: '📦 Мои заказы', icon: '📦', description: 'История заказов.' },
    { id: 'PROFILE', label: '👤 Профиль', icon: '👤', description: 'Личный кабинет.' },
    { id: 'REFERRALS', label: '👥 Рефералы', icon: '👥', description: 'Партнерская программа.' },
    { id: 'CATALOG', label: '📑 Каталог', icon: '📑', description: 'Весь список услуг.' },
    { id: 'SUPPORT', label: '🆘 Поддержка', icon: '🆘', description: 'Связь с саппортом.' },
    { id: 'WEBAPP', label: '📱 Web-App', icon: '📱', description: 'Запуск веб-приложения.' },
    { id: 'URL_BUTTON', label: '🔗 Ссылка', icon: '🔗', description: 'Внешний URL.' }
];

interface Props {
    projectId: string;
    project: {
        botToken: string | null;
        botUsername: string | null;
        config: any;
    };
}

export function ProjectTelegramTab({ projectId, project }: Props) {
    const [token, setToken] = useState(project.botToken || '');
    const [showToken, setShowToken] = useState(false);
    const [botStatus, setBotStatus] = useState<'IDLE' | 'CHECKING' | 'ONLINE' | 'OFFLINE'>('IDLE');
    const [botInfo, setBotInfo] = useState<{ username?: string; name?: string } | null>(null);

    const [config, setConfig] = useState(() => ({
        welcomeText: project.config?.welcomeText || '👋 Добро пожаловать!',
        menuLayout: project.config?.menuLayout || [
            [{ id: 'ORDER', label: '🚀 Заказать' }, { id: 'AUTO', label: '🤖 Авто-пилот' }],
            [{ id: 'BALANCE', label: '💼 Баланс' }, { id: 'PROFILE', label: '👤 Профиль' }]
        ],
        botModules: project.config?.botModules || [],
        managerId: project.config?.managerId || ''
    }));

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [tone, setTone] = useState<Tone>('PROFESSIONAL');

    // --- TOKEN LOGIC ---
    const handleCheckToken = async () => {
        if (!token) return;
        setBotStatus('CHECKING');
        const res = await checkBotTokenAction(token);
        if (res.ok) {
            setBotStatus('ONLINE');
            setBotInfo({ username: res.username, name: res.firstName });
            toast.success('Бот активен!');
        } else {
            setBotStatus('OFFLINE');
            toast.error(`Ошибка: ${res.error}`);
        }
    };

    const handleSaveToken = async () => {
        try {
            setIsSaving(true);
            await updateBotIdentityAction(projectId, token);
            toast.success('Токен сохранен и бот обновлен');
            handleCheckToken();
        } catch (e: any) {
            toast.error(e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemoveBot = async () => {
        if (!confirm('Отключить бота?')) return;
        await removeBotTokenAction(projectId);
        setToken('');
        setBotStatus('IDLE');
        toast.info('Бот отключен');
    };

    // --- CONFIG LOGIC ---
    const handleSaveConfig = async () => {
        setIsSaving(true);
        try {
            await saveBotFullConfigAction(projectId, config);
            toast.success('Конфигурация бота сохранена');
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e: any) {
            toast.error('Ошибка сохранения');
        } finally {
            setIsSaving(false);
        }
    };

    const handleGenerateMarketing = async () => {
        setIsGenerating(true);
        try {
            const modules = await generateFunnelAction(projectId, tone);
            setConfig(prev => ({ ...prev, botModules: modules }));
            toast.success('Маркетинговая воронка сгенерирована');
        // eslint-disable-next-line unused-imports/no-unused-vars
        } catch (e) {
            toast.error('Ошибка генерации AI');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: SETTINGS */}
            <div className="lg:col-span-8 space-y-8">
                {/* 1. IDENTITY & TOKEN */}
                <AdminCard className="p-0 overflow-hidden border-slate-200 shadow-sm">
                    <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${botStatus === 'ONLINE' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight">Подключение бота</h3>
                                {botInfo && <p className="text-[10px] font-bold text-emerald-600 uppercase">@{botInfo.username} — {botInfo.name}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {botStatus === 'ONLINE' ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Online
                                </div>
                            ) : (
                                <div className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                                    Offline
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bot API Token</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type={showToken ? "text" : "password"}
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="123456:ABC-DEF..."
                                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
                                    />
                                    <button
                                        onClick={() => setShowToken(!showToken)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <Button onClick={handleCheckToken} variant="outline" size="sm" className="h-10 w-10 shrink-0" title="Проверить">
                                    <Play size={14} className={botStatus === 'CHECKING' ? 'animate-spin' : ''} />
                                </Button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button onClick={handleSaveToken} disabled={isSaving || !token} className="flex-1 gap-2 bg-slate-900 text-white rounded-xl py-5">
                                <Save size={16} /> Применить токен
                            </Button>
                            {project.botToken && (
                                <Button onClick={handleRemoveBot} variant="outline" className="text-rose-600 border-rose-100 hover:bg-rose-50 rounded-xl">
                                    <Trash2 size={16} />
                                </Button>
                            )}
                        </div>
                    </div>
                </AdminCard>

                {/* 2. MENU & EXPERIENCE */}
                <AdminCard className="p-6 space-y-6 border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight flex items-center gap-2">
                            <LayoutGrid size={18} className="text-blue-500" />
                            Главное меню бота
                        </h3>
                        <Button variant="ghost" size="sm" onClick={() => setConfig(p => ({ ...p, menuLayout: [...p.menuLayout, [{ id: 'ORDER', label: '🚀 Заказать' }]] }))} className="text-[10px] font-black uppercase text-blue-600 gap-1 p-0 px-2 h-7">
                            <Plus size={12} /> Добавить ряд
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {config.menuLayout.map((row: any[], rIdx: number) => (
                            <div key={rIdx} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-wrap gap-2 relative group/row">
                                {row.map((btn, bIdx) => (
                                    <div key={bIdx} className="flex-1 min-w-[150px] bg-white border border-slate-200 p-2 rounded-xl space-y-2">
                                        <select
                                            value={btn.id}
                                            onChange={(e) => {
                                                const newLayout = [...config.menuLayout];
                                                const action = AVAILABLE_ACTIONS.find(a => a.id === e.target.value);
                                                newLayout[rIdx][bIdx] = { ...btn, id: e.target.value, label: action?.label || btn.label };
                                                setConfig(p => ({ ...p, menuLayout: newLayout }));
                                            }}
                                            className="w-full text-[10px] font-bold bg-slate-50 border-none outline-none p-1.5 rounded-lg"
                                        >
                                            {AVAILABLE_ACTIONS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
                                        </select>
                                        <input
                                            value={btn.label}
                                            onChange={(e) => {
                                                const newLayout = [...config.menuLayout];
                                                newLayout[rIdx][bIdx] = { ...btn, label: e.target.value };
                                                setConfig(p => ({ ...p, menuLayout: newLayout }));
                                            }}
                                            className="w-full text-xs font-bold border-none outline-none px-1.5 py-1"
                                            placeholder="Текст..."
                                        />
                                        <button
                                            onClick={() => {
                                                const newLayout = [...config.menuLayout];
                                                newLayout[rIdx] = newLayout[rIdx].filter((_: any, i: number) => i !== bIdx);
                                                if (newLayout[rIdx].length === 0) newLayout.splice(rIdx, 1);
                                                setConfig(p => ({ ...p, menuLayout: newLayout }));
                                            }}
                                            className="absolute -right-1 -top-1 bg-rose-500 text-white p-0.5 rounded-full opacity-0 group-hover/row:opacity-100 transition-opacity"
                                        >
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={() => {
                                        const newLayout = [...config.menuLayout];
                                        newLayout[rIdx].push({ id: 'SUPPORT', label: '🆘 Саппорт' });
                                        setConfig(p => ({ ...p, menuLayout: newLayout }));
                                    }}
                                    className="w-10 h-10 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 hover:border-blue-300 hover:text-blue-500 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="h-px bg-slate-100" />

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-black text-slate-800 uppercase text-sm tracking-tight flex items-center gap-2">
                                <MessageSquare size={18} className="text-indigo-500" />
                                Приветственное сообщение
                            </h3>
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                                {['PROFESSIONAL', 'FRIENDLY', 'AGGRESSIVE'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setTone(t as Tone)}
                                        className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${tone === t ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                                <Button onClick={handleGenerateMarketing} disabled={isGenerating} size="sm" className="h-6 gap-1 bg-white text-indigo-600 hover:bg-slate-50 border shadow-sm">
                                    <Wand2 size={10} />
                                    {isGenerating ? 'AI...' : 'Smart Funnel'}
                                </Button>
                            </div>
                        </div>

                        <textarea
                            value={config.welcomeText}
                            onChange={(e) => setConfig(p => ({ ...p, welcomeText: e.target.value }))}
                            rows={4}
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium leading-relaxed outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none"
                            placeholder="Напишите приветствие для новых пользователей..."
                        />

                        {config.botModules.length > 0 && (
                            <div className="grid grid-cols-2 gap-3">
                                {config.botModules.map((m: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-indigo-50/30 border border-indigo-100 rounded-xl space-y-1">
                                        <span className="text-[8px] font-black uppercase text-indigo-400">{m.type}</span>
                                        <p className="text-[10px] text-slate-600 line-clamp-2">{m.content}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <Button onClick={handleSaveConfig} disabled={isSaving} className="w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-200">
                            <Check size={18} /> Сохранить изменения бота
                        </Button>
                    </div>
                </AdminCard>
            </div>

            {/* RIGHT: LIVE PREVIEW (TELEGRAM MOCKUP) */}
            <div className="lg:col-span-4 sticky top-6">
                <div className="text-center mb-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 shadow-sm">
                        Live Preview (Mobile)
                    </span>
                </div>

                <div className="w-[300px] h-[600px] bg-[#E7EBF0] border-[10px] border-slate-900 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col mx-auto">
                    {/* TG Header */}
                    <div className="bg-white px-5 py-4 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-blue-500">
                                <Bot size={20} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-slate-800 leading-tight">{project.botUsername || 'MyBot'}</span>
                                <span className="text-[9px] text-slate-400 font-bold">bot is typing...</span>
                            </div>
                        </div>
                    </div>

                    {/* TG Messages */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        <div className="bg-white rounded-[1.2rem] rounded-tl-none p-4 shadow-sm max-w-[85%] text-[11px] text-slate-800 leading-relaxed font-medium">
                            {config.welcomeText && <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(config.welcomeText.replace(/\n/g, '<br/>')) }} />}
                            <div className="text-[8px] text-slate-400 mt-1 text-right">23:59</div>
                        </div>
                    </div>

                    {/* TG Keyboard */}
                    <div className="bg-[#F4f4f5]/95 backdrop-blur-md p-2.5 border-t border-slate-200/50">
                        <div className="space-y-1.5">
                            {config.menuLayout.map((row: any[], i: number) => (
                                <div key={i} className="flex gap-1.5 justify-center">
                                    {row.map((btn, j) => (
                                        <div key={j} className="flex-1 bg-white border-b-2 border-slate-300 active:border-b-0 active:translate-y-0.5 py-2.5 rounded-xl text-[10px] font-black text-slate-700 text-center shadow-sm transition-all uppercase tracking-tighter truncate px-1">
                                            {btn.label || '...'}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 flex justify-between items-center px-4">
                            <div className="w-6 h-6 rounded-full bg-slate-200/50" />
                            <div className="w-32 h-6 bg-white/50 rounded-full border border-slate-200/50" />
                            <div className="w-6 h-6 rounded-full bg-slate-200/50" />
                        </div>
                    </div>

                    {/* Dynamic Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 rounded-b-2xl flex items-center justify-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                        <div className="w-6 h-1.5 rounded-full bg-slate-800" />
                    </div>
                </div>
            </div>
        </div>
    );
}
