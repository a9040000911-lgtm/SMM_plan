'use client';

import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { 
    TrendingUp, 
    ShoppingCart, 
    Send, 
    Instagram, 
    Youtube, 
    Video,
    Sparkles,
    CheckCircle2,
    Zap,
    Users,
    Eye,
    Heart,
    Share2,
    Plus,
    Minus
} from 'lucide-react';
import { cn } from '@/utils/ui';

const METRICS = [
    { id: 'followers', label: 'Подписчики', icon: Users, basePrice: 0.45, multipliers: { views: 2, reactions: 0.2 } },
    { id: 'views', label: 'Просмотры', icon: Eye, basePrice: 0.05, multipliers: { views: 1, reactions: 0.05 } },
    { id: 'likes', label: 'Лайки/Реакции', icon: Heart, basePrice: 0.15, multipliers: { views: 1.5, reactions: 1 } },
    { id: 'reposts', label: 'Репосты', icon: Share2, basePrice: 0.85, multipliers: { views: 5, reactions: 0.5 } },
];

const PLATFORMS = [
    { id: 'telegram', label: 'Telegram', icon: Send, color: '#0088CC' },
    { id: 'instagram', label: 'Instagram', icon: Instagram, color: '#E1306C' },
    { id: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
    { id: 'tiktok', label: 'TikTok', icon: Video, color: '#000000' }
];

const STRATEGIES = [
    { 
        id: 'LITE', 
        label: 'Органический старт', 
        badge: 'Бюджетно',
        description: 'Плавный запуск. Минимальные риски, естественная скорость.',
        priceMod: 1,
        features: ['Безопасная скорость', 'Гарантия 30 дней']
    },
    { 
        id: 'PRO', 
        label: 'Умный рост 2026', 
        badge: 'Smart Choice',
        description: 'Оптимальный микс. ИИ-фильтрация и умное распределение.',
        priceMod: 1.8,
        features: ['AI-Таргетинг', 'Приоритет 24/7']
    },
    { 
        id: 'ELITE', 
        label: 'Бизнес-максимум', 
        badge: 'Премиум',
        description: 'Максимальный охват. VIP-аккаунты и виральный эффект.',
        priceMod: 3.5,
        features: ['VIP-Аккаунты', 'Anti-Drop Pro']
    }
];

export default function GrowthSimulator() {
    const [platform, setPlatform] = useState('telegram');
    const [metric, setMetric] = useState('followers');
    const [strategy, setStrategy] = useState('PRO');
    const [current, setCurrent] = useState(150);
    const [target, setTarget] = useState(5000);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    const [isAdding, setIsAdding] = useState(false);

    const activeMetric = useMemo(() => METRICS.find(m => m.id === metric)!, [metric]);
    const activeStrategy = useMemo(() => STRATEGIES.find(s => s.id === strategy)!, [strategy]);

    const result = useMemo(() => {
        const diff = Math.max(0, target - current);
        if (diff <= 0) return null;

        const price = (diff * activeMetric.basePrice * activeStrategy.priceMod).toFixed(0);
        const views = Math.ceil(diff * activeMetric.multipliers.views);
        const reactions = Math.ceil(diff * activeMetric.multipliers.reactions);

        return {
            diff,
            price,
            views,
            reactions,
            days: Math.ceil(diff / (strategy === 'ELITE' ? 3000 : 800)) + 1
        };
    }, [current, target, activeMetric, activeStrategy, strategy]);

    const handlePreset = (val: number) => {
        setTarget(prev => prev + val);
    };

    const handleAddToCart = () => {
        if (!result) return;
        setIsAdding(true);
        
        try {
            const newItem = {
                id: `growth-${Date.now()}`,
                type: 'GROWTH_PACKAGE',
                platform,
                platformLabel: PLATFORMS.find(p => p.id === platform)?.label,
                metric,
                metricLabel: activeMetric.label,
                strategy,
                strategyLabel: activeStrategy.label,
                name: `${activeMetric.label}: ${result.diff.toLocaleString()} (${activeStrategy.label})`,
                target,
                diff: result.diff,
                subs: metric === 'followers' ? result.diff : 0,
                views: result.views,
                reactions: result.reactions,
                price: parseFloat(result.price),
                estimatedDays: result.days,
                addedAt: new Date().toISOString()
            };
            
            const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
            localStorage.setItem('cart', JSON.stringify([...currentCart, newItem]));
            window.dispatchEvent(new Event('cart-updated'));
            
            toast.success(`Пакет «${activeStrategy.label}» добавлен!`, {
                description: `${activeMetric.label}: +${result.diff.toLocaleString()} для ${platform.toUpperCase()}`,
                position: 'bottom-right'
            });
        } catch (e) {
            console.error('Failed to save to cart:', e);
            toast.error('Ошибка при добавлении в корзину');
        } finally {
            setTimeout(() => setIsAdding(false), 500);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-8 bg-[#0c1324] rounded-[2.5rem] md:rounded-[4rem] border border-white/5 shadow-2xl overflow-hidden relative group/simulator">
            <div className="relative z-10">
                {/* Instant Clarity Header */}
                <div className="flex flex-col md:flex-row items-start justify-between mb-8 gap-6 border-b border-white/5 pb-8">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-[9px] font-black text-blue-400 uppercase tracking-widest italic">Расчет бюджета и сроков</span>
                            <Sparkles size={12} className="text-blue-400" />
                        </div>
                        <h3 className="text-2xl md:text-3xl font-black text-white italic uppercase tracking-tighter mb-2">
                            Калькулятор <span className="text-blue-500 not-italic">SMM</span>-продвижения
                        </h3>
                        <p className="text-[11px] md:text-xs text-slate-400 font-medium leading-relaxed">
                            Инструмент для мгновенного расчета стоимости, охватов и сроков выполнения вашего проекта. Выберите параметры ниже, чтобы получить точную смету.
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
                    {/* Left Column: Configuration */}
                    <div className="space-y-10">
                        {/* Platform & Metric */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">1. Выберите соцсеть</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PLATFORMS.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => setPlatform(p.id)}
                                            className={cn(
                                                "p-3 rounded-2xl border transition-all flex items-center gap-3",
                                                platform === p.id ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" : "bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10"
                                            )}
                                        >
                                            <p.icon size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">2. Выберите услугу</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {METRICS.map(m => (
                                        <button 
                                            key={m.id}
                                            onClick={() => setMetric(m.id)}
                                            className={cn(
                                                "p-3 rounded-2xl border transition-all flex items-center gap-3",
                                                metric === m.id ? "bg-white border-white text-slate-950 shadow-xl" : "bg-slate-900/50 border-white/5 text-slate-400 hover:border-white/10"
                                            )}
                                        >
                                            <m.icon size={16} />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{m.label.split('/')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Goal Input */}
                        <div className="space-y-6">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic block">3. Укажите количество</label>
                            
                            <div className="bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 space-y-8">
                                <div className="space-y-4 text-center md:text-left">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Объём заказа ({activeMetric.label.toLowerCase()})</p>
                                        <div className="flex gap-2">
                                            {[1000, 5000].map(val => (
                                                <button 
                                                    key={val}
                                                    onClick={() => handlePreset(val)}
                                                    className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded text-[8px] font-black text-blue-400"
                                                >
                                                    +{val / 1000}к
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center md:justify-start gap-4">
                                        <input 
                                            type="number"
                                            value={target}
                                            onChange={(e) => setTarget(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-40 bg-transparent text-5xl font-black text-white italic outline-none border-b-2 border-blue-500/30 focus:border-blue-500 transition-colors py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        />
                                        <TrendingUp className="text-blue-500 opacity-50" size={32} />
                                    </div>
                                    <input 
                                        type="range"
                                        min="10"
                                        max="100000"
                                        step="100"
                                        value={target}
                                        onChange={(e) => setTarget(parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Strategy & Summary */}
                    <div className="space-y-8">
                        {/* Strategy Selector */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block italic">4. Выберите скорость выполнения</label>
                            <div className="space-y-3">
                                {STRATEGIES.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setStrategy(s.id)}
                                        className={cn(
                                            "w-full p-4 rounded-2xl border-2 transition-all flex items-center justify-between text-left group",
                                            strategy === s.id ? "bg-white border-white text-slate-950 scale-[1.02]" : "bg-slate-900/50 border-white/5 text-white hover:bg-slate-900"
                                        )}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                                strategy === s.id ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400 group-hover:text-white"
                                            )}>
                                                {s.id === 'LITE' && <Minus size={20} />}
                                                {s.id === 'PRO' && <Zap size={20} />}
                                                {s.id === 'ELITE' && <Plus size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-black uppercase text-xs tracking-tight">
                                                    {s.id === 'LITE' && 'Базовая (Надежно)'}
                                                    {s.id === 'PRO' && 'Стандартная (Оптимально)'}
                                                    {s.id === 'ELITE' && 'Максимальная (Быстро)'}
                                                </p>
                                                <p className={cn("text-[9px] font-medium opacity-60", strategy === s.id ? "text-slate-600" : "text-slate-400")}>
                                                    {s.id === 'LITE' && 'Плавное выполнение, без рисков'}
                                                    {s.id === 'PRO' && 'Сбалансированная нагрузка и охваты'}
                                                    {s.id === 'ELITE' && 'Мгновенный старт и высокий приоритет'}
                                                </p>
                                            </div>
                                        </div>
                                        {strategy === s.id && <CheckCircle2 size={18} className="text-blue-600 shrink-0" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-0.5 rounded-[2.5rem] shadow-2xl shadow-blue-900/20">
                            <div className="bg-slate-950 rounded-[2.4rem] p-8 space-y-8 relative overflow-hidden">
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Итоговый план</p>
                                        <p className="text-3xl font-black text-white italic">+{result?.diff.toLocaleString() || 0}</p>
                                        <div className="flex items-center gap-2 text-[9px] font-black text-emerald-400 uppercase tracking-tighter">
                                            <TrendingUp size={10} /> Стабильный рост
                                        </div>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Срок готовности</p>
                                        <p className="text-2xl font-black text-white italic">~{result?.days || 0} дней</p>
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-tighter">⚡ Мгновенный старт</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-white">
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-40 italic">Стоимость решения</span>
                                        <span className="text-5xl font-black italic tracking-tighter">{result?.price || 0} <span className="text-xl not-italic opacity-30 tracking-normal">₽</span></span>
                                    </div>
                                    <button 
                                        onClick={handleAddToCart}
                                        disabled={isAdding || !result}
                                        className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-blue-500 hover:text-white transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {isAdding ? 'Добавление...' : 'В корзину'} <ShoppingCart size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Decor */}
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/5 blur-[120px] rounded-full pointer-events-none" />
        </div>
    );
}
