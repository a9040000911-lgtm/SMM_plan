"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { useLanguage } from "@/providers/language-provider";

import React, { useState } from "react";
import { ChevronDown, HelpCircle, MessageCircle, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/ui";
import Link from "next/link";

interface HelpSectionProps {
    className?: string;
}

interface FAQItem {
    category: string;
    icon: string;
    services: {
        name: string;
        linkType: string;
        example: string;
        description: string;
    }[];
}

const FAQ_DATA: FAQItem[] = [
    {
        category: "Telegram",
        icon: "🔷",
        services: [
            {
                name: "Подписчики на канал",
                linkType: "Ссылка на канал",
                example: "https://t.me/yourchannel",
                description: "Публичная ссылка на ваш Telegram канал (начинается с t.me/)"
            },
            {
                name: "Просмотры постов",
                linkType: "Ссылка на конкретный пост",
                example: "https://t.me/yourchannel/123",
                description: "Ссылка на конкретный пост в канале (с номером поста в конце)"
            },
            {
                name: "Реакции на пост",
                linkType: "Ссылка на пост",
                example: "https://t.me/yourchannel/123",
                description: "Ссылка на пост, к которому нужно добавить реакции"
            },
            {
                name: "Участники группы",
                linkType: "Ссылка-приглашение",
                example: "https://t.me/+AbCdEfGhIjK",
                description: "Создайте invite link в настройках группы (начинается с t.me/+)"
            }
        ]
    },
    {
        category: "Instagram",
        icon: "📸",
        services: [
            {
                name: "Подписчики",
                linkType: "Ссылка на профиль",
                example: "https://instagram.com/username",
                description: "Прямая ссылка на ваш профиль Instagram"
            },
            {
                name: "Лайки на пост",
                linkType: "Ссылка на пост",
                example: "https://instagram.com/p/AbCdEfG/",
                description: "Откройте пост, скопируйте URL из адресной строки"
            },
            {
                name: "Просмотры Stories/Reels",
                linkType: "Ссылка на Stories/Reels",
                example: "https://instagram.com/stories/username/...",
                description: "Ссылка на конкретную Stories или Reels"
            }
        ]
    },
    {
        category: "YouTube",
        icon: "▶️",
        services: [
            {
                name: "Подписчики",
                linkType: "Ссылка на канал",
                example: "https://youtube.com/@channelname",
                description: "Ссылка на ваш YouTube канал (или youtube.com/c/channelname)"
            },
            {
                name: "Просмотры видео",
                linkType: "Ссылка на видео",
                example: "https://youtube.com/watch?v=AbCdEfG",
                description: "Откройте видео, скопируйте URL из адресной строки"
            },
            {
                name: "Лайки на видео",
                linkType: "Ссылка на видео",
                example: "https://youtube.com/watch?v=AbCdEfG",
                description: "Та же ссылка, что и для просмотров"
            }
        ]
    },
    {
        category: "VK (ВКонтакте)",
        icon: "🔵",
        services: [
            {
                name: "Подписчики на группу/страницу",
                linkType: "Ссылка на группу/профиль",
                example: "https://vk.com/yourgroup",
                description: "Короткая ссылка (screen name) или полный URL"
            },
            {
                name: "Лайки на пост",
                linkType: "Ссылка на пост",
                example: "https://vk.com/wall-123456_789",
                description: "Кликните на время публикации поста, скопируйте URL"
            }
        ]
    }
];

export const HelpSection: React.FC<HelpSectionProps> = ({ className }) => {
    const { t } = useLanguage();
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

    const toggleCategory = (category: string) => {
        setExpandedCategory(expandedCategory === category ? null : category);
    };

    return (
        <div className={cn("cyber-box bg-orange-500/5 border-orange-500/30 p-6 space-y-4", className)}>
            {/* Header */}
            <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <HelpCircle size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-black tracking-tight text-white uppercase">
                        {t.help.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                        {t.help.subtitle}
                    </p>
                </div>
            </div>

            {/* FAQ Accordion */}
            <div className="space-y-2">
                {FAQ_DATA.map((item) => (
                    <div key={item.category} className="border border-white/10 rounded-xl overflow-hidden bg-[#0a0c12]/40">
                        {/* Category Header */}
                        <button
                            onClick={() => toggleCategory(item.category)}
                            className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="font-black text-sm uppercase tracking-widest text-white">
                                    {item.category}
                                </span>
                            </div>
                            <ChevronDown
                                size={20}
                                className={cn(
                                    "text-slate-500 transition-transform",
                                    expandedCategory === item.category && "rotate-180"
                                )}
                            />
                        </button>

                        {/* Services List */}
                        <AnimatePresence>
                            {expandedCategory === item.category && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-4 pt-0 space-y-3">
                                        {item.services.map((service, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2"
                                            >
                                                <div className="font-black text-xs uppercase text-primary">
                                                    {service.name}
                                                </div>
                                                <div className="text-[10px] text-slate-400">
                                                    {service.description}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                                        {t.help.needed}
                                                    </span>
                                                    <span className="text-[10px] text-white font-mono bg-primary/10 px-2 py-1 rounded">
                                                        {service.linkType}
                                                    </span>
                                                </div>
                                                <div className="text-[9px] font-mono text-emerald-400 break-all bg-emerald-500/10 px-2 py-1.5 rounded border border-emerald-500/30">
                                                    ✓ {t.help.example} {service.example}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>

            {/* Support CTA */}
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <MessageCircle size={20} className="text-blue-400" />
                    <div>
                        <div className="text-xs font-black uppercase tracking-widest text-blue-300">
                            {t.help.still_need_help}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                            {t.help.support_time}
                        </div>
                    </div>
                </div>
                <Link href="/support">
                    <button className="px-4 py-2 bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-600 transition-all flex items-center gap-2 whitespace-nowrap">
                        {t.help.write_btn}
                        <ExternalLink size={12} />
                    </button>
                </Link>
            </div>
        </div>
    );
};


