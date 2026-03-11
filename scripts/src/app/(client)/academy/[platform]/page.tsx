"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React, { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Lightbulb, ShieldAlert, Cpu, BarChart3, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cn } from "@/lib/utils";

export const dynamic = 'force-dynamic';

const platformData: Record<string, any> = {
    telegram: {
        name: "Telegram",
        color: "text-[#0088cc]",
        bg: "bg-[#0088cc]",
        gradient: "from-[#0088cc] to-blue-600",
        hero: "Инсайды алгоритмов, глобальный поиск и влияние Premium",
        intro: "В отличие от классических соцсетей с 'умной лентой', Telegram всё ещё остается хронологическим мессенджером. Однако, алгоритмы здесь работают в поиске, рекомендациях каналов и защите от спама.",
        sections: [
            {
                title: "1. Как работает Глобальный Поиск",
                icon: <BarChart3 className="text-blue-500" />,
                content: "Место канала в результатах поиска по ключевым словам зависит от двух главных факторов:\n\n1. Точное вхождение ключа в название (Title) канала.\n2. Количество **Premium-подписчиков**. В 2024 году Telegram полностью изменил алгоритм. Теперь обычные (ботовые или дешевые) подписчики практически не влияют на ранжирование. Канал с 1000 Premium-подписчиков будет выше канала с 100,000 обычных."
            },
            {
                title: "2. Умные рекомендации (Похожие каналы)",
                icon: <TrendingUp className="text-orange-500" />,
                content: "Когда пользователь подписывается на канал, ему предлагают 'Похожие каналы'. Алгоритм подбирает их на основе пересечения аудиторий. Если вы крутите низкокачественных ботов (миксы с тысячами подписок), алгоритм может начать рекомендовать ваш канал рядом со спам-каналами."
            },
            {
                title: "3. Лимиты и Безопасность",
                icon: <ShieldAlert className="text-rose-500" />,
                content: "Telegram агрессивно борется с инвайтами (добавлением людей без их воли). Лимит безопасного инвайта — не более **50-200 человек в сутки** для старого канала, и 0 для свежего (до 1 месяца).\n\nНакрутка просмотров и реакций не влечет за собой риск блокировки (так как это делают в том числе для атаки конкурентов)."
            },
            {
                title: "Expert Tip от Smmplan",
                icon: <Lightbulb className="text-yellow-500" />,
                isTip: true,
                content: "Для вывода в ТОП поиска всегда используйте услугу 'Telegram Subscribers [PREMIUM]'. Обычных подписчиков берите исключительно для солидности цифры (визуальный вес) в глазах рекламодателей и новых пользователей."
            }
        ]
    },
    instagram: {
        name: "Instagram",
        color: "text-[#e1306c]",
        bg: "bg-[#e1306c]",
        gradient: "from-[#f09433] to-[#bc1888]",
        hero: "Теневые баны, алгоритм Reels и секреты умной ленты",
        intro: "Instagram использует сложные системы машинного обучения. Алгоритм для Ленты, Stories, Reels и Explore (Интересное) абсолютно разные и учитывают разные метрики.",
        sections: [
            {
                title: "1. Алгоритм Reels (Как стать виральным)",
                icon: <Cpu className="text-purple-500" />,
                content: "Главные метрики для Reels:\n1. **Retention Rate (Удержание)**: процент людей, досмотревших ролик до конца.\n2. **Replays (Повторные просмотры)**.\n3. **Shares (Репосты в Direct)** — сейчас это ценится алгоритмами намного выше лайков.\n4. Лайки и Комментарии — базовый сигнал, но имеющий наименьший вес."
            },
            {
                title: "2. Shadowban (Теневой бан)",
                icon: <AlertTriangle className="text-amber-500" />,
                content: "Теневой бан — это пессимизация вашего контента в алгоритмах рекомендаций и поиска по хэштегам. Причины:\n- Резкий спам лайками от некачественных ботов с одного IP.\n- Использование запрещенных хэштегов.\n- Превышение лимитов массфолловинга (безопасно ~150 подписок/отписок в сутки для прогретого аккаунта)."
            },
            {
                title: "3. Влияние сохранений (Saves)",
                icon: <BarChart3 className="text-blue-500" />,
                content: "Сохранения поста (Saves) отправляют алгоритму сильнейший сигнал о том, что контент является ценным (Educational / Inspirational). Если пост собирает много сохранений, он с вероятностью 80% попадет в Explore."
            },
            {
                title: "Expert Tip от Smmplan",
                icon: <Lightbulb className="text-yellow-500" />,
                isTip: true,
                content: "Если хотите вывести пост в ТОП или Рекомендации, не покупайте обычные дешевые лайки. Используйте комплексные услуги (Лайки + Сохранения + Охват) с использованием функции Drip-feed (Постепенно). Резкий прилив 10,000 лайков в секунду алгоритм посчитает аномалией."
            }
        ]
    },
    tiktok: {
        name: "TikTok",
        color: "text-slate-900",
        bg: "bg-slate-900",
        gradient: "from-slate-700 to-slate-900",
        hero: "For You Page (Рекомендации) и глубина просмотра",
        intro: "TikTok — это полностью content-driven платформа. В отличие от других сетей, количество ваших подписчиков практически не влияет на то, зайдет ли ваше новое видео.",
        sections: [
            {
                title: "1. Тестовые окна (Batch Testing)",
                icon: <BarChart3 className="text-blue-500" />,
                content: "Когда вы загружаете видео, TikTok показывает его небольшой тестовой группе (300-500 человек). Если эти люди показывают высокий Completion Rate (просматривают до конца), видео перекидывается в следующий пул (1000+), затем в 10,000+ и так далее."
            },
            {
                title: "2. Роль Drip-Feed (Постепенных активаций)",
                icon: <Clock className="text-teal-500" />,
                content: "Покупка моментальных 100,000 просмотров в TikTok может навредить. Алгоритм заметит, что просмотры пришли в одну секунду, и пометит их как неорганические. Сработает 'Теневой бан'."
            },
            {
                title: "Expert Tip от Smmplan",
                icon: <Lightbulb className="text-yellow-500" />,
                isTip: true,
                content: "Для TikTok идеальная стратегия – Drip-Feed на лайки и репосты. Всегда выбирайте высокое качество (HQ), так как дешевые лайки с аккаунтов без аватарок мгновенно вычисляются ИИ-сетью TikTok."
            }
        ]
    },
    vk: {
        name: "ВКонтакте",
        color: "text-[#0077FF]",
        bg: "bg-[#0077FF]",
        gradient: "from-[#0077FF] to-blue-700",
        hero: "Умная лента VK и виральность контента",
        intro: "Алгоритмы ВК отдают приоритет уникальному контенту и долгим обсуждениям. Огромный вес имеет показатель 'Интереса' аудитории сразу после публикации.",
        sections: [
            {
                title: "1. Алгоритм Умной Ленты",
                icon: <Cpu className="text-purple-500" />,
                content: "Ранжирование постов зависит от:\n- **Время реакции**: Если в первый час пост собрал много живых комментариев и лайков, его увидят 80%+ ваших подписчиков.\n- **Длина комментариев**: Комментарии короче 3 слов (смайлы, 'круто') имеют почти нулевой вес."
            },
            {
                title: "2. Нейросеть (Прометей)",
                icon: <TrendingUp className="text-orange-500" />,
                content: "Уникальный авторский контент, получающий высокий отклик, может получить 'Огонек Прометея'. Это дает бесплатные сотни тысяч показов в рекомендациях. Копипаст никогда не попадет в рекомендации."
            },
            {
                title: "Expert Tip от Smmplan",
                icon: <Lightbulb className="text-yellow-500" />,
                isTip: true,
                content: "При накрутке ВК категорически нельзя использовать ботов без аватарок ('собачек'). Алгоритм ВК регулярно списывает их (Drop). Заказывайте 'Живые' (Real) комментарии с заданным текстом для создания дискуссий — это лучший толчок к виральности."
            }
        ]
    },
    youtube: {
        name: "YouTube",
        color: "text-[#FF0000]",
        bg: "bg-[#FF0000]",
        gradient: "from-[#FF0000] to-red-700",
        hero: "Главная страница (Home), Suggested и Shorts",
        intro: "YouTube принадлежит Google, поэтому его алгоритмы — одни из самых совершенных в мире. Здесь царствует удержание и CTR (кликабельность).",
        sections: [
            {
                title: "1. Связка CTR + AVD",
                icon: <BarChart3 className="text-blue-500" />,
                content: "Для Long-form видео (горизонтальных) важны:\n- **CTR (Click-Through Rate)**: Процент людей, кликнувших на обложку (Thumbnail).\n- **AVD (Average View Duration / Удержание)**: Из 10 минут видео зритель посмотрел 1 минуту или 7 минут?"
            },
            {
                title: "2. Алгоритмы Shorts",
                icon: <TrendingUp className="text-orange-500" />,
                content: "Для Shorts важнейшая метрика — **Viewed vs Swiped Away** (Посмотрели vs Пролистнули). Если более 65% людей останавливаются и смотрят ваш Шорт, YouTube даст ему широкий охват в ленте."
            },
            {
                title: "3. Лимиты Списаний (YouTube Drop)",
                icon: <ShieldAlert className="text-rose-500" />,
                content: "YouTube регулярно производит масштабные чистки (Updates). Если купить дешевых подписчиков, в течение 48 часов YouTube спишет до 90% из них, определив паттерн поведения 'бота' (отсутствие истории просмотров в Google-аккаунте)."
            },
            {
                title: "Expert Tip от Smmplan",
                icon: <Lightbulb className="text-yellow-500" />,
                isTip: true,
                content: "Для YouTube всегда выбирайте просмотры типа 'High Retention' (С высоким удержанием). Они дорогие, но они дадут видео импульс для попадания в 'Рекомендованные'. Если вам нужны часы просмотра для монетизации, используйте услуги 'Watch Time'."
            }
        ]
    }
};

export default function PlatformGuidePage({ params }: { params: Promise<{ platform: string }> }) {
    const resolvedParams = use(params);
    const data = platformData[resolvedParams.platform];

    if (!data) {
        return notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Hero */}
            <div className={cn("relative pt-32 pb-24 px-6 text-white overflow-hidden")}>
                <div className={cn("absolute inset-0 bg-gradient-to-br opacity-90", data.gradient)} />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />

                <div className="max-w-4xl mx-auto relative z-10">
                    <Link href="/academy" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 text-sm font-bold uppercase tracking-widest">
                        <ArrowLeft size={16} /> К списку платформ
                    </Link>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 drop-shadow-lg">
                        {data.name}
                    </h1>
                    <p className="text-xl md:text-2xl font-medium text-white/90 leading-relaxed max-w-2xl drop-shadow">
                        {data.hero}
                    </p>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-4xl mx-auto px-6 py-16 -mt-12 relative z-20">
                <div className="bg-white rounded-[3rem] p-8 md:p-12 shadow-2xl border border-slate-100">
                    <p className="text-lg text-slate-600 font-medium leading-relaxed mb-12">
                        {data.intro}
                    </p>

                    <div className="space-y-8">
                        {data.sections.map((section: any, i: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                key={i}
                                className={cn(
                                    "p-6 md:p-8 border rounded-[2rem]",
                                    section.isTip
                                        ? "bg-yellow-50/50 border-yellow-200"
                                        : "bg-slate-50/50 border-slate-100"
                                )}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={cn(
                                        "p-3 rounded-2xl shadow-sm bg-white",
                                        section.isTip ? "border border-yellow-200" : "border border-slate-100"
                                    )}>
                                        {section.icon}
                                    </div>
                                    <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                        {section.title}
                                    </h2>
                                </div>
                                <div className="text-slate-600 font-medium leading-relaxed space-y-4 whitespace-pre-line">
                                    {section.content}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Back Link Bottom */}
                <div className="mt-16 text-center">
                    <Link href={`/catalog?platform=${resolvedParams.platform}`} className="inline-block">
                        <button className={cn(
                            "px-8 py-4 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:-translate-y-1 transition-transform",
                            data.bg
                        )}>
                            Заказать услуги для {data.name}
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
