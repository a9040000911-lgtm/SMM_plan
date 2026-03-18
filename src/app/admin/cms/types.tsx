import React from 'react';
import { z } from 'zod';
import { 
    Layout, 
    Globe, 
    Layers, 
    FileText,
    Laptop
} from 'lucide-react';

// Block Data Schemas
export const PromoCarouselSchema = z.object({
    slides: z.array(z.object({
        image: z.string().optional(),
        title: z.string(),
        subtitle: z.string().optional(),
        link: z.string().optional()
    })).default([])
});

export const PromoModalSchema = z.object({
    title: z.string(),
    content: z.string(),
    ctaText: z.string().optional(),
    ctaLink: z.string().optional(),
    image: z.string().optional()
});

export const BLOCK_SCHEMAS: Record<string, z.ZodSchema> = {
    'PROMO_CAROUSEL': PromoCarouselSchema,
    'PROMO_MODAL': PromoModalSchema
};

export type ViewportSize = 'desktop' | 'mobile' | 'tablet';

export interface CmsPageConfig {
    slug: string;
    label: string;
    icon: React.ReactNode;
}

export const PAGES: CmsPageConfig[] = [
    { slug: 'home', label: 'Главная страница', icon: <Globe size={18} /> },
    { slug: 'catalog', label: 'Каталог услуг', icon: <Layers size={18} /> },
    { slug: 'faq', label: 'Вопросы и ответы', icon: <FileText size={18} /> },
];

export interface CmsKeyConfig {
    key: string;
    label: string;
    fallback: string;
    group?: string;
    type?: 'string' | 'block';
}

export const CMS_GROUPS = [
    {
        id: 'home.hero',
        label: 'Hero секция',
        icon: <Laptop size={16} />,
        keys: [
            { key: 'home.hero.title', label: 'Заголовок', fallback: 'Продвижение' },
            { key: 'home.hero.subtitle', label: 'Подзаголовок', fallback: 'в один клик' },
            { key: 'home.hero.description', label: 'Описание', fallback: 'Вставьте ссылку и мгновенно выберите идеальный тариф...' },
            { key: 'home.hero.cta', label: 'Текст кнопки (CTA)', fallback: 'Открыть полный каталог услуг' },
        ]
    },
    {
        id: 'home.stats',
        label: 'Статистика',
        icon: <Layout size={16} />,
        keys: [
            { key: 'home.stats.orders', label: 'Заказы (Заголовок)', fallback: 'Выполненных заказов' },
            { key: 'home.stats.clients', label: 'Клиенты (Заголовок)', fallback: 'Активных клиентов' },
            { key: 'home.stats.services', label: 'Сервисы (Заголовок)', fallback: 'Сервисов в базе' },
            { key: 'home.stats.start', label: 'Старт (Заголовок)', fallback: 'Среднее время старта' },
        ]
    }
];

export const SLOTS = [
    { id: 'DEFAULT', label: 'Основная зона' },
    { id: 'HERO_ZONE', label: 'Hero зона' },
    { id: 'BOTTOM_ZONE', label: 'Нижняя зона' },
    { id: 'SIDEBAR', label: 'Боковая панель' },
];


