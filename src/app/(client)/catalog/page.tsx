/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';
import { auth } from "@/auth";

import { Zap } from 'lucide-react';
import { CompactCatalog } from '@/components/stitch/catalog/CompactCatalog';
import { getClientProjectId } from '@/utils/project-resolver';
import { SerializedServiceV2 } from '@/types/catalog';
import { translateCategory } from "@/utils/translations";
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Каталог SMM услуг: Подписчики, Лайки, Просмотры и Реакции",
    description: "Полный список услуг по продвижению в социальных сетях. Сравните цены на накрутку в Telegram, Instagram, VK, YouTube и TikTok. Оптовые цены, высокое качество и гарантия от Smmplan.",
    openGraph: {
        title: "Каталог услуг Smmplan — Все для продвижения ваших соцсетей",
        description: "Выберите лучшие тарифы для вашего аккаунта: от дешевых просмотров до премиальных живых подписчиков.",
    }
};

export default async function CatalogPage() {
    const session = await auth();
    const isLoggedIn = !!session?.user;
    const projectId = await getClientProjectId();

    if (!projectId) return null;

    // Fetch services mapped to this project via ProjectServiceOverride
    const servicesWithOverrides = await prisma.internalService.findMany({
        where: {
            isActive: true,
            projectOverrides: {
                some: {
                    projectId: projectId,
                    isActive: true
                }
            }
        },
        include: {
            serviceCategory: true,
            projectOverrides: {
                where: {
                    projectId: projectId,
                    isActive: true
                },
                include: {
                    serviceCategory: true
                }
            }
        },
        orderBy: [{ platform: 'asc' }, { category: 'asc' }, { pricePer1000: 'asc' }]
    });

    if (servicesWithOverrides.length === 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
                <div className="w-24 h-24 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-8 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Zap className="w-10 h-10 text-slate-300 group-hover:text-blue-500 transition-colors relative z-10" />
                </div>
                <h1 className="text-3xl font-black mb-4 text-slate-900 uppercase tracking-tight">Каталог пополняется</h1>
                <p className="text-slate-500 max-w-md font-medium italic">Мы настраиваем самые выгодные тарифы для вашего проекта. Пожалуйста, загляните через несколько минут.</p>
                <p className="text-[10px] text-slate-300 mt-4 uppercase tracking-widest">Project ID: {projectId.slice(0, 8)}</p>
            </div>
        );
    }

    // Двухуровневая группировка: Платформа -> Категория (Имя) -> Услуги
    const grouped: Record<string, Record<string, SerializedServiceV2[]>> = {};

    const toNum = (val: any): number => {
        if (val == null) return 0;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') return Number(val);
        if (typeof val.toNumber === 'function') return val.toNumber();
        return Number(val) || 0;
    };

    servicesWithOverrides.forEach((s: any) => {
        if (!grouped[s.platform]) grouped[s.platform] = {};

        const override = s.projectOverrides[0];
        const categoryOverride = override?.serviceCategory;

        // Prioritize: Project-specific category name -> Global category name -> Default translation
        const categoryDisplayName = categoryOverride?.name || s.serviceCategory?.name || translateCategory(s.category);

        if (!grouped[s.platform][categoryDisplayName]) grouped[s.platform][categoryDisplayName] = [];

        // Apply project-specific pricing
        let finalPricePer1000 = toNum(s.pricePer1000);
        let markupValue = toNum(s.markup);

        if (override) {
            if (override.customPrice) {
                finalPricePer1000 = toNum(override.customPrice);
            } else if (override.markup) {
                const cost = toNum(s.lastProviderPrice) || finalPricePer1000 / 2; // Fallback
                markupValue = toNum(override.markup);
                finalPricePer1000 = cost * (1 + markupValue / 100);
            }
        }

        const nameLower = s.name.toLowerCase();

        const serialized: SerializedServiceV2 = {
            id: s.id,
            numericId: s.numericId,
            name: s.name,
            description: s.description || "",
            platform: s.platform,
            category: categoryDisplayName, // Store the translated/custom name here for the UI
            pricePer1000: finalPricePer1000,
            lastProviderPrice: toNum(s.lastProviderPrice),
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
            providerPriceOriginal: toNum(s.providerPriceOriginal),
            markup: markupValue,
            marketPrice: toNum(s.marketPrice),
            isHot: nameLower.includes("premium") || nameLower.includes("fast") || nameLower.includes("быстрые") || nameLower.includes("живые"),
            isCheap: finalPricePer1000 < 50,
            isBest: nameLower.includes("garant") || nameLower.includes("гарант"),
            quality: nameLower.includes("hq") ? "HIGH" : "STD",
            minQty: s.minQty,
            maxQty: s.maxQty,
            isActive: s.isActive,
            isCurated: s.isCurated || false,
            targetType: s.targetType
        };

        grouped[s.platform][categoryDisplayName].push(serialized);
    });

    return (
        <div className="w-full pb-32 pt-12">
            <div className="max-w-7xl mx-auto px-6">
                <div className="relative mb-20 bg-blue-50/50 rounded-[3rem] py-16 px-8 border border-blue-100/50 overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-100 rounded-full shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest">Live Catalog v4.0</span>
                        </div>

                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85]">
                            Ваш успех <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">в цифрах&nbsp;</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-500 max-w-5xl font-medium leading-relaxed">
                            <span className="inline-block">Премиальные инструменты продвижения, отобранные экспертами.</span>
                            <br className="hidden md:block" />
                            <span className="inline-block">Прозрачные цены, мгновенный запуск и гарантия результата.</span>
                        </p>
                    </div>
                </div>

                <CompactCatalog
                    groupedServices={grouped}
                    isLoggedIn={isLoggedIn}
                />
            </div>
        </div>
    );
}
