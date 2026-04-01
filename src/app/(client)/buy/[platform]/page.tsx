import React from 'react';
import { Metadata } from 'next';
import { PLATFORM_SEO } from '@/configs/seo-platforms';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedServices } from '@/components/seo/RelatedServices';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getClientProjectId } from '@/utils/project-resolver';
import { getTenantDomain, getTenantConfig } from '@/lib/tenant/server';
import { CmsService } from '@/services/cms/cms.service';
import { ReviewBadge } from '@/components/seo/ReviewBadge';

interface Props {
    params: Promise<{ platform: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { platform } = await params;
    const key = platform.toUpperCase();
    const seoData = PLATFORM_SEO[key];

    const domain = await getTenantDomain();
    const scheme = domain === 'localhost' || domain.includes(':') ? 'http' : 'https';

    if (!seoData) {
        return {
            title: `Продвижение ${platform}`,
        };
    }

    return {
        title: seoData.title,
        description: seoData.description,
        alternates: {
            canonical: `${scheme}://${domain}/buy/${platform.toLowerCase()}`,
        }
    };
}


export default async function PlatformBuyPage({ params }: Props) {
    const { platform } = await params;
    const key = platform.toUpperCase();
    const seoData = PLATFORM_SEO[key];

    if (!seoData) {
        // If unknown platform, simply fallback to catalog search
        redirect(`/catalog?search=${platform}`);
    }

    const projectId = await getClientProjectId();
    if (!projectId) return notFound();

    // Fetch categories available for this platform to create internal links (pSEO step 2)
    const availableCategories = await prisma.serviceCategory.findMany({
        where: {
            projectId,
            isActive: true,
            socialPlatform: { 
                slug: { equals: platform, mode: 'insensitive' } 
            }
        },
        select: {
            name: true,
            slug: true,
            description: true,
        }
    });

    const aggRating = await CmsService.getAggregateRating(projectId);
    const configContext = await getTenantConfig();
    const tDomain = await getTenantDomain();
    const tScheme = tDomain === 'localhost' || tDomain.includes(':') ? 'http' : 'https';
    
    // JSON-LD Product Schema for the entire platform offering
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": seoData.h1,
        "description": seoData.subtext,
        "image": `${tScheme}://${tDomain}/images/og-${platform.toLowerCase()}.png`,
        "brand": {
            "@type": "Brand",
            "name": configContext.name || "Smmplan"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": aggRating.ratingValue.toString(),
            "reviewCount": aggRating.reviewCount.toString()
        }
    };

    return (
        <div className="w-full pb-32 pt-6">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="max-w-6xl mx-auto px-6">
                <Breadcrumbs items={[
                    { label: 'Услуги', href: '/buy' },
                    { label: seoData.h1, href: `/buy/${platform.toLowerCase()}` }
                ]} />

                <header className="mb-16 mt-8 text-center flex flex-col items-center">
                    <ReviewBadge rating={aggRating.ratingValue} count={aggRating.reviewCount} className="mb-6 transform -rotate-1 skew-x-[-2deg]" />
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic mb-6">
                        {seoData.h1}
                    </h1>
                    <p className="text-lg text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
                        {seoData.subtext}
                    </p>
                </header>

                {availableCategories.length > 0 && (
                    <div className="mb-16">
                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 mb-8 flex items-center gap-4">
                            Доступные услуги 
                            <span className="h-px bg-slate-200 flex-1 relative top-[1px]"></span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availableCategories.map(cat => (
                                <Link
                                    href={`/buy/${platform.toLowerCase()}/${cat.slug || encodeURIComponent(cat.name.toLowerCase())}`}
                                    key={cat.name}
                                    className="group block p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:border-blue-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all"
                                >
                                    <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                        Всё для {cat.name}
                                    </h4>
                                    <p className="text-sm text-slate-500 mt-2 line-clamp-2">
                                        {cat.description || `Перейти к заказу ${cat.name} для платформы ${seoData.h1}`}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <article className="prose prose-slate max-w-none bg-blue-50/50 p-8 md:p-12 rounded-[3rem] border border-blue-100 text-slate-700">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic mb-6 text-slate-900">
                        О продвижении
                    </h2>
                    {seoData.content}
                </article>

                <div className="mt-16 text-center">
                    <Link 
                        href={`/catalog?platform=${platform.toLowerCase()}`}
                        className="inline-flex items-center justify-center px-8 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.2em] text-[10px] rounded-full hover:bg-blue-600 transition-colors shadow-xl"
                    >
                        Показать цены в каталоге
                    </Link>
                </div>

                {/* Linking Grid for Search Engines to crawl nested services */}
                <RelatedServices currentPlatform={platform.toLowerCase()} />
            </div>
        </div>
    );
}
