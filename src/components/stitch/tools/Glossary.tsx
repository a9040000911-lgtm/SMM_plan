'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, 
    BookOpen, 
    ShieldCheck, 
    Zap, 
    Users, 
    ChevronDown, 
    Target, 
    RotateCcw, 
    Cpu,
    HelpCircle,
    Clock, 
    Heart
} from 'lucide-react';
import { cn } from '@/utils/ui';

interface Term {
    id: string;
    term: string;
    shortDesc: string;
    details: string;
    category: 'basics' | 'accounts' | 'mechanics' | 'safety';
    icon: any;
    color: string;
}

const CATEGORIES = [
    { id: 'all', label: 'Все термины', icon: BookOpen },
    { id: 'basics', label: 'База SMM', icon: Target },
    { id: 'accounts', label: 'Типы услуг', icon: Users },
    { id: 'mechanics', label: 'Механики', icon: Cpu },
    { id: 'safety', label: 'Безопасность', icon: ShieldCheck },
];

const GLOSSARY_DATA: Term[] = [
    {
        id: 'boosting',
        term: 'Накрутка (Boosting)',
        shortDesc: 'Искусственное увеличение цифр (подписчиков, лайков) в профиле.',
        details: 'Процесс использования автоматизированных систем или бирж для роста показателей. В Smmplan мы называем это «умным продвижением», так как используем алгоритмы распределения нагрузки для безопасности.',
        category: 'basics',
        icon: Zap,
        color: 'amber'
    },
    {
        id: 'bots',
        term: 'Боты (Bots)',
        shortDesc: 'Профили, созданные программами для массовых действий.',
        details: 'Самый дешевый вид услуг. Боты не имеют реальной активности. Подходят для создания первоначальной «массы» или имитации популярности на старте.',
        category: 'accounts',
        icon: Cpu,
        color: 'slate'
    },
    {
        id: 'offers',
        term: 'Офферы (Offers)',
        shortDesc: 'Реальные люди, выполняющие действия за награду.',
        details: 'Это живые пользователи бирж, которые ставят лайки или подписываются ради бонусов. Они качественнее ботов, так как имеют аватарки и историю, но могут со временем отписываться.',
        category: 'accounts',
        icon: Users,
        color: 'blue'
    },
    {
        id: 'refill',
        term: 'Refill (Гарантия/Докрутка)',
        shortDesc: 'Автоматическое восстановление списанных показателей.',
        details: 'Если социальная сеть списывает часть накрученных подписчиков в течение гарантийного срока (напр. 30 дней), система Smmplan автоматически или по запросу бесплатно добавляет недостающее количество.',
        category: 'mechanics',
        icon: RotateCcw,
        color: 'emerald'
    },
    {
        id: 'drip-feed',
        term: 'Drip-feed (Постепенно)',
        shortDesc: 'Функция разбивки одного заказа на части с интервалами.',
        details: 'Позволяет заказать 1000 подписчиков, но получать их по 100 каждые 2 часа. Это имитирует естественный рост и значительно снижает риск блокировки профиля.',
        category: 'mechanics',
        icon: Clock,
        color: 'purple'
    },
    {
        id: 'drops',
        term: 'Drops (Списания)',
        shortDesc: 'Процесс удаления социальной сетью фейковых показателей.',
        details: 'Алгоритмы Instagram или VK периодически чистят базу от подозрительных аккаунтов. Это нормальный процесс. Именно поэтому мы рекомендуем услуги с пометкой «Гарантия».',
        category: 'safety',
        icon: ShieldCheck,
        color: 'rose'
    },
    {
        id: 'geo',
        term: 'Targeting / GEO',
        shortDesc: 'Возможность выбора страны происхождения аккаунтов.',
        details: 'Для локального бизнеса важно, чтобы лайки и подписчики были из нужного региона (напр. РФ или СНГ). Это повышает доверие алгоритмов и будущих реальных клиентов.',
        category: 'mechanics',
        icon: Target,
        color: 'blue'
    },
    {
        id: 'engagement',
        term: 'ER (Engagement Rate)',
        shortDesc: 'Коэффициент вовлеченности аудитории.',
        details: 'Рассчитывается как отношение реакций к количеству подписчиков. Если у вас 10к подписчиков, но 0 лайков — ваш ER равен нулю, и соцсетка перестанет вас показывать.',
        category: 'basics',
        icon: Heart,
        color: 'rose'
    }
];

export function Glossary() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCategory, setActiveCategory] = useState('all');
    const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

    const filteredTerms = useMemo(() => {
        return GLOSSARY_DATA.filter(term => {
            const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                 term.shortDesc.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = activeCategory === 'all' || term.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, activeCategory]);

    return (
        <div className="w-full">
            {/* Search and Filters */}
            <div className="mb-12 space-y-8">
                <div className="relative max-w-2xl mx-auto">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Найти термин (напр. бот, гарантия)..."
                        className="w-full bg-white/50 border border-slate-200 rounded-[2rem] pl-14 pr-8 py-5 text-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                activeCategory === cat.id 
                                    ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-105" 
                                    : "bg-white border border-slate-200 text-slate-400 hover:border-blue-500/30 hover:text-blue-600"
                            )}
                        >
                            <cat.icon size={14} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Terms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence mode="popLayout">
                    {filteredTerms.map((item) => (
                        <motion.div
                            layout
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn(
                                "group bg-white border rounded-[2rem] p-8 transition-all relative overflow-hidden",
                                expandedTerm === item.id ? "border-blue-500 shadow-2xl" : "border-slate-100 hover:border-blue-500/20 hover:shadow-xl cursor-help"
                            )}
                            onClick={() => setExpandedTerm(expandedTerm === item.id ? null : item.id)}
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0",
                                    item.color === 'amber' ? "bg-amber-500/10 text-amber-600" :
                                    item.color === 'blue' ? "bg-blue-500/10 text-blue-600" :
                                    item.color === 'emerald' ? "bg-emerald-500/10 text-emerald-600" :
                                    item.color === 'rose' ? "bg-rose-500/10 text-rose-600" :
                                    item.color === 'purple' ? "bg-purple-500/10 text-purple-600" :
                                    "bg-slate-500/10 text-slate-600"
                                )}>
                                    <item.icon size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase italic">{item.term}</h3>
                                    <p className="text-sm font-medium text-slate-500 leading-relaxed">
                                        {item.shortDesc}
                                    </p>
                                </div>
                            </div>
                            
                            <motion.div
                                initial={false}
                                animate={{ height: expandedTerm === item.id ? 'auto' : 0, opacity: expandedTerm === item.id ? 1 : 0 }}
                                className="overflow-hidden"
                            >
                                <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
                                    <div className="flex gap-3">
                                        <div className="w-1 bg-blue-500 rounded-full shrink-0" />
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            {item.details}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-500">
                                        <HelpCircle size={12} />
                                        Узнать больше о {item.term.split(' ')[0]}
                                    </div>
                                </div>
                            </motion.div>

                            <div className={cn(
                                "absolute bottom-6 right-8 text-slate-300 transition-transform duration-500",
                                expandedTerm === item.id ? "rotate-180 text-blue-500" : "group-hover:translate-y-1"
                            )}>
                                <ChevronDown size={20} />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {filteredTerms.length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Search className="text-slate-300" size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ничего не нашли?</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                        Попробуйте изменить запрос или выберите другую категорию. Мы постоянно пополняем наш словарь актуальными терминами.
                    </p>
                </div>
            )}
        </div>
    );
}
