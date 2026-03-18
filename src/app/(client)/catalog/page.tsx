/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { getClientProjectId } from '@/utils/project-resolver';
import { CompactCatalog } from '@/components/stitch/catalog/CompactCatalog';
import { CatalogService } from '@/services/core/catalog.service';
import { Zap } from 'lucide-react';
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

    const result = await CatalogService.getGroupedCatalog(projectId);

    if (!result.success || Object.keys(result.data).length === 0) {
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
                    groupedServices={result.data}
                    isLoggedIn={isLoggedIn}
                />
            </div>
        </div>
    );
}


