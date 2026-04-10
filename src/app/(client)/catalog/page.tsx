/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { auth } from "@/auth";
import { getClientProjectId } from '@/utils/project-resolver';
import { getTenantDomain } from '@/lib/tenant/server';
import { CompactCatalog } from '@/components/stitch/catalog/CompactCatalog';
import { CatalogService } from '@/services/core/catalog.service';
import { Zap, ArrowDown } from 'lucide-react';
import type { Metadata } from 'next';
import { PLATFORM_SEO, DEFAULT_SEO } from '@/configs/seo-platforms';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ platform?: string }> }): Promise<Metadata> {
    const platform = (await searchParams).platform?.toUpperCase();
    const seo = platform && PLATFORM_SEO[platform] ? PLATFORM_SEO[platform] : DEFAULT_SEO;
    const domain = await getTenantDomain();
    const scheme = domain === 'localhost' || domain.includes(':') ? 'http' : 'https';

    const canonicalUrl = platform 
        ? `${scheme}://${domain}/catalog?platform=${platform.toLowerCase()}` 
        : `${scheme}://${domain}/catalog`;

    return {
        title: seo.title,
        description: seo.description,
        openGraph: {
            title: seo.title,
            description: seo.description,
        },
        alternates: {
            canonical: canonicalUrl
        }
    };
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<{ platform?: string }> }) {
    const session = await auth();
    const { platform } = await searchParams;
    const isLoggedIn = !!session?.user;
    const projectId = await getClientProjectId();
    
    const platformParam = platform?.toUpperCase();
    const seo = platformParam && PLATFORM_SEO[platformParam] ? PLATFORM_SEO[platformParam] : DEFAULT_SEO;

    if (!projectId) return (
        <div className="w-full flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
            <h1 className="text-2xl font-black text-slate-800 mb-3">Проект не настроен</h1>
            <p className="text-slate-500 font-medium max-w-sm">Каталог недоступен — обратитесь в поддержку для настройки проекта.</p>
        </div>
    );

    const result = await CatalogService.getGroupedCatalog(projectId);

    if (!result.success || Object.keys(result.data).length === 0) {
        return (
            <div className="w-full pb-32 pt-20 mt-12 min-h-[60vh] flex items-center justify-center">
                <div className="max-w-xl mx-auto px-6 text-center">
                    <div className="mb-8 w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-blue-50/50">
                        <Zap className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-black text-slate-800 tracking-tight mb-4">Каталог обновляется</h2>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed mb-8">
                        В данный момент мы синхронизируем актуальные сервисы и цены с провайдерами. <br className="hidden md:block"/>Это займет пару минут, пожалуйста, загляните чуть позже.
                    </p>
                    <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto animate-pulse" />
                </div>
            </div>
        );
    }

    // JSON-LD Schema.org for AI & SGE
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: seo.h1,
        description: seo.description,
        brand: {
            '@type': 'Brand',
            name: 'Smmplan'
        },
        offers: {
            '@type': 'AggregateOffer',
            priceCurrency: 'RUB',
            lowPrice: '0.1',
            offerCount: String(Object.values(result.data).flat().length)
        }
    };

    // Smart logic to split H1 if it contains a colon or just wrap it
    const h1Parts = seo.h1.split(':');
    const mainH1 = h1Parts[0];
    const subH1 = h1Parts.length > 1 ? h1Parts[1] : '';

    return (
        <div className="w-full pb-32 pt-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-6xl mx-auto px-6">
                <div className="relative mb-20 bg-blue-50/50 rounded-[3rem] py-16 px-8 border border-blue-100/50 overflow-hidden">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-400/10 blur-[100px] rounded-full pointer-events-none" />

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">

                        <h1 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85]">
                            {mainH1} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 italic">
                                {subH1 || 'в один клик'}&nbsp;
                            </span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-500 max-w-5xl font-medium leading-relaxed">
                            <span className="inline-block">{seo.subtext}</span>
                            <br className="hidden md:block" />
                            <span className="inline-block">Лучшие цены и мгновенный результат для вашего продвижения.</span>
                        </p>

                        <div className="pt-8 flex justify-center w-full">
                            <div className="w-14 h-14 bg-white/60 backdrop-blur-xl border border-blue-100/50 shadow-sm rounded-full flex flex-col items-center justify-center text-blue-500 animate-bounce cursor-default">
                                <ArrowDown strokeWidth={2.5} size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <CompactCatalog
                    groupedServices={result.data}
                    isLoggedIn={isLoggedIn}
                />

                {/* SEO Content Section */}
                <div className="mt-32 border-t border-slate-100 pt-20 pb-20">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-slate-500 leading-relaxed font-medium space-y-4">
                            {seo.content}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


