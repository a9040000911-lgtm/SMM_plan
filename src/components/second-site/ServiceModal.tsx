'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, ShieldCheck, Zap, Layers, Cpu } from 'lucide-react';

// Content definitions for our Modals
const modalContent: Record<string, { title: string; description: string; icon: React.ReactNode; features: string[] }> = {
    'ai-engine': {
        title: 'AI Promotion Engine',
        description: 'Наш алгоритм использует нейросети для анализа вашей аудитории и подбора оптимального времени для продвижения.',
        icon: <Cpu className="w-12 h-12 text-purple-500" />,
        features: [
            'Анализ поведенческих факторов',
            'Автоматическая корректировка скорости',
            'Защита от списаний алгоритмами соцсетей',
            'Предиктивная аналитика роста'
        ]
    },
    'stats': {
        title: 'Активность в реальном времени',
        description: 'Мы обрабатываем тысячи заказов ежеминутно. Наша инфраструктура построена на микросервисах для максимальной отказоустойчивости.',
        icon: <Zap className="w-12 h-12 text-yellow-500" />,
        features: [
            'Load Balancer для распределения нагрузки',
            'Redis кластер для кэширования',
            'Мониторинг 24/7',
            'Прозрачная отчетность'
        ]
    },
    'popular': {
        title: 'Популярные категории',
        description: 'Самые востребованные услуги этого месяца. Мы постоянно обновляем базу провайдеров для лучшего качества.',
        icon: <Layers className="w-12 h-12 text-blue-500" />,
        features: [
            'Telegram Views & Subs',
            'Instagram Likes & Followers',
            'YouTube Retention Views',
            'TikTok Viral Boost'
        ]
    },
    'protection': {
        title: 'Гарантия и Защита',
        description: 'Если услуга не будет выполнена или произойдет списание, мы вернем средства или выполним докрутку бесплатно.',
        icon: <ShieldCheck className="w-12 h-12 text-emerald-500" />,
        features: [
            '30 дней гарантии на большинство услуг',
            'Автоматический мониторинг списаний',
            'Мгновенный возврат средств',
            'Безопасная оплата'
        ]
    },
    'scaling': {
        title: 'Масштабирование',
        description: 'Готовы к большим объемам? Наша система спроектирована так, чтобы расти вместе с вами без задержек.',
        icon: <CheckCircle className="w-12 h-12 text-pink-500" />,
        features: [
            'API для реселлеров',
            'Скидки за объем',
            'Персональный менеджер',
            'Приоритетная очередь обработки'
        ]
    }
};

export function ServiceModal() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const modalId = searchParams.get('modal');
    // const [isOpen, setIsOpen] = useState(false); // Not needed if relying on modalId directly or managed via AnimatePresence

    /*
    useEffect(() => {
        setIsOpen(!!modalId);
    }, [modalId]);
    */

    const handleClose = () => {
        // setIsOpen(false);
        // Small delay to allow exit animation to start (handled by AnimatePresence, but router push is instant)
        // Actually, strictly controlled by modalId in URL is better.
        // We push URL, Effect sets open=false instantly -> Animation might be cut if we depend on isOpen state derived from URL directly in render.
        // AnimatePresence works best when key changes or component unmounts.
        // Let's use router.push to clear param.
        const params = new URLSearchParams(searchParams.toString());
        params.delete('modal');
        router.push(params.toString() ? `?${params.toString()}` : '?', { scroll: false });
    };

    // If we rely strictly on URL, AnimatePresence needs to wrap the content conditionally rendered based on modalId.
    const content = modalId ? modalContent[modalId] : null;

    return (
        <AnimatePresence>
            {modalId && content && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Modal */}
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#0a0a0a] border border-white/10 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative"
                        >
                            {/* Header Image/Icon Area */}
                            <div className="h-32 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative">
                                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none"></div>
                                {content.icon}
                                <button
                                    onClick={handleClose}
                                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors text-white/70 hover:text-white"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-2">{content.title}</h2>
                                <p className="text-gray-400 mb-6 leading-relaxed">
                                    {content.description}
                                </p>

                                <div className="space-y-3">
                                    {content.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-3">
                                            <div className="mt-1 min-w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <CheckCircle className="w-3 h-3 text-green-500" />
                                            </div>
                                            <span className="text-gray-300 text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="mt-8 w-full py-3 rounded-xl bg-white text-black font-semibold hover:bg-gray-200 transition-colors"
                                >
                                    Понятно
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
