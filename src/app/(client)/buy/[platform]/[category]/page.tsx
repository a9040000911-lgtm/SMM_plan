import React from 'react';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { RelatedServices } from '@/components/seo/RelatedServices';
import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { getClientProjectId } from '@/utils/project-resolver';
import { getTenantDomain } from '@/lib/tenant/server';
import { CmsService } from '@/services/cms/cms.service';
import { ReviewBadge } from '@/components/seo/ReviewBadge';
import { AiFaqBlock } from '@/components/seo/AiFaqBlock';
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';

interface Props {
    params: Promise<{ platform: string, category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { platform, category } = await params;
    const projectId = await getClientProjectId();
    if (!projectId) return { title: 'Продвижение' };

    const decodedCategory = decodeURIComponent(category);
    
    // Fetch specifically to construct a highly relevant title
    const categoryDoc = await prisma.serviceCategory.findFirst({
        where: {
            projectId,
            socialPlatform: { slug: platform.toLowerCase() },
            OR: [
                { slug: decodedCategory },
                { name: { contains: decodedCategory, mode: 'insensitive' } }
            ]
        },
        include: { socialPlatform: true }
    });

    if (!categoryDoc) {
         return {
            title: `Накрутка ${decodedCategory} | ${platform.toUpperCase()}`,
        };
    }

    const platformName = categoryDoc.socialPlatform?.name || platform.toUpperCase();
    const domain = await getTenantDomain();
    const scheme = domain === 'localhost' || domain.includes(':') ? 'http' : 'https';

    return {
        title: `Купить ${categoryDoc.name} ${platformName} дешево и быстро | Smmplan`,
        description: categoryDoc.description || `Автоматизированная накрутка ${categoryDoc.name} для платформы ${platformName}. Безопасный рост, высокое качество и гарантия от списаний.`,
        alternates: {
            canonical: `${scheme}://${domain}/buy/${platform.toLowerCase()}/${encodeURIComponent(categoryDoc.slug || categoryDoc.name.toLowerCase())}`,
        }
    };
}

export default async function CategoryBuyPage({ params }: Props) {
    const { platform, category } = await params;
    const projectId = await getClientProjectId();
    if (!projectId) return notFound();

    const decodedCategory = decodeURIComponent(category);

    const categoryDoc = await prisma.serviceCategory.findFirst({
        where: {
            projectId,
            isActive: true,
            socialPlatform: { slug: platform.toLowerCase() },
            OR: [
                { slug: decodedCategory },
                { name: { contains: decodedCategory, mode: 'insensitive' } }
            ]
        },
        include: { 
            socialPlatform: true,
            internalServices: {
                where: { isActive: true, isPrivate: false },
                orderBy: { pricePer1000: 'asc' },
                take: 6
            }
        }
    });

    if (!categoryDoc) {
        redirect(`/buy/${platform}`);
    }

    const pName = categoryDoc.socialPlatform?.name || platform.toUpperCase();
    const aggRating = await CmsService.getAggregateRating(projectId);
    const tDomain = await getTenantDomain();
    const tScheme = tDomain === 'localhost' || tDomain.includes(':') ? 'http' : 'https';

    // 1. Dynamic FAQ Generation for AI Overviews
    const generatedFaqs = [
        {
            question: `Безопасно ли покупать ${categoryDoc.name} в ${pName}?`,
            answer: `Да, для Smmplan безопасность вашего профиля находится на первом месте. Мы используем умные алгоритмы накрутки, включая Drip-feed, которые распределяют выполнение заказа так, чтобы имитировать естественный рост аудитории в ${pName}. Это защищает вас от теневых банов и списаний.`
        },
        {
            question: `Как быстро начнется выполнение заказа для ${categoryDoc.name}?`,
            answer: `В большинстве тарифов автоматический старт происходит в течение 5-15 минут после оплаты. Вы можете отслеживать статус выполнения в личном кабинете Smmplan в режиме реального времени.`
        },
        {
            question: `Даете ли вы гарантию на случай списаний в ${pName}?`,
            answer: `Конечно. Мы предоставляем гарантию по кнопке 'Refill' (Докрутка) на большинство наших услуг. Если у вас спишут ${categoryDoc.name}, наша система автоматически восполнит недостаток до изначального уровня абсолютно бесплатно.`
        }
    ];

    // 2. Pricing Extraction for Product Schema (Offers)
    const minPrice = categoryDoc.internalServices.length > 0 
        ? Math.min(...categoryDoc.internalServices.map(s => Number(s.pricePer1000))) 
        : 10; // Fallback

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": `Накрутка ${categoryDoc.name} ${pName}`,
        "description": categoryDoc.description || `Качественная накрутка ${categoryDoc.name} в ${pName} от Smmplan.`,
        "url": `${tScheme}://${tDomain}/buy/${platform.toLowerCase()}/${encodeURIComponent(categoryDoc.slug || categoryDoc.name.toLowerCase())}`,
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": aggRating.ratingValue.toString(),
            "reviewCount": aggRating.reviewCount.toString()
        },
        "offers": {
            "@type": "AggregateOffer",
            "offerCount": categoryDoc.internalServices.length.toString(),
            "lowPrice": (minPrice / 1000).toFixed(4), // price per unit
            "highPrice": (minPrice / 10).toFixed(4),
            "priceCurrency": "RUB"
        }
    };

    return (
        <div className="w-full pb-32 pt-6">
             <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
             <div className="max-w-6xl mx-auto px-6">
                 <Breadcrumbs items={[
                    { label: 'Услуги', href: '/buy' },
                    { label: pName, href: `/buy/${platform.toLowerCase()}` },
                    { label: categoryDoc.name, href: `/buy/${platform.toLowerCase()}/${encodeURIComponent(categoryDoc.slug || categoryDoc.name.toLowerCase())}` }
                ]} />
                 {/* Hero Section */}
                 <header className="mb-20 flex flex-col md:items-start text-left">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
                        <ReviewBadge rating={aggRating.ratingValue} count={aggRating.reviewCount} />
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            <Zap size={14} className="text-emerald-500" /> Автоматический Старт 24/7
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter mb-8 leading-[1.1]">
                        Купить <span className="text-blue-600 italic uppercase"> {categoryDoc.name} </span> <br /> 
                        в <span className="underline decoration-blue-200 decoration-8 underline-offset-4">{pName}</span>
                    </h1>
                    <p className="text-xl text-slate-500 max-w-2xl font-medium leading-relaxed mb-10">
                        Увеличьте охваты и повысьте доверие к вашему профилю. Выбирайте надежное продвижение {pName} с автоматическим запуском и гарантией качества от Smmplan.
                    </p>
                    <div className="flex flex-wrap items-center gap-6 text-sm font-bold text-slate-700">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={20} className="text-blue-500" /> Без передачи паролей
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={20} className="text-emerald-500" /> Алгоритмы Drip-feed
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Main Packages Feed */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-slate-900 mb-8 border-b pb-4">
                            Популярные Тарифы
                        </h2>
                        
                        {categoryDoc.internalServices.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 font-medium">К сожалению, в данный момент услуг в этой категории нет.</div>
                        ) : (
                            <div className="space-y-4">
                                {categoryDoc.internalServices.map(service => (
                                    <div key={service.id} className="relative bg-white border border-slate-200 rounded-3xl p-6 group hover:border-blue-400 hover:shadow-xl transition-all flex flex-col sm:flex-row sm:items-center gap-6 justify-between overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-100 transition-colors" />
                                        
                                        <div className="relative z-10 flex-1">
                                            <h3 className="font-bold text-slate-900 text-lg mb-1">{service.name}</h3>
                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">ID: {service.id}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2.5 py-1 rounded-md">Мин. заказ: {service.minQty}</span>
                                            </div>
                                        </div>

                                        <div className="relative z-10 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-4 border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-6 min-w-[140px]">
                                            <div className="text-left sm:text-right">
                                                <div className="text-2xl font-black text-slate-900">
                                                    {Number(service.pricePer1000).toFixed(2)} ₽
                                                </div>
                                                <div className="text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                                                    за {service.priceUnit} {service.unitName}
                                                </div>
                                            </div>
                                            
                                            <Link 
                                                href={`/catalog?platform=${platform.toLowerCase()}&category=${encodeURIComponent(categoryDoc.slug || categoryDoc.name)}&serviceId=${service.id}`}
                                                className="h-10 px-6 bg-slate-900 text-white rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-colors"
                                            >
                                                Заказать
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {categoryDoc.internalServices.length > 0 && (
                            <div className="mt-8 text-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
                                <p className="text-sm font-medium text-slate-600 mb-4">
                                    Это лишь часть доступных услуг. С полным списком и дополнительными опциями вы можете ознакомиться в нашем основном каталоге.
                                </p>
                                <Link 
                                    href={`/catalog?platform=${platform.toLowerCase()}`}
                                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-blue-600 tracking-widest hover:text-blue-800"
                                >
                                    Смотреть весь каталог <ArrowRight size={14} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Informational Pane (pSEO padding) */}
                    <div className="space-y-6">
                        <div className="bg-slate-50 rounded-[2.5rem] border border-slate-200 p-8 sticky top-24">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                                <ShieldCheck size={14} /> Преимущества
                            </h3>
                            <ul className="space-y-5">
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">1</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Глобальный Охват</h4>
                                        <p className="text-xs text-slate-500 mt-1">Офферы со всего мира или таргетированные по странам.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">2</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Естественный рост</h4>
                                        <p className="text-xs text-slate-500 mt-1">Инструмент Drip-feed для распределения заказа на несколько дней.</p>
                                    </div>
                                </li>
                                <li className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">3</div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 text-sm">Гарантия (Refill)</h4>
                                        <p className="text-xs text-slate-500 mt-1">Автоматическое восстановление списаний (ищите иконку щита).</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* AI Overviews FAQ Integration */}
                <AiFaqBlock faqs={generatedFaqs} title={`FAQ: ${categoryDoc.name} в ${pName}`} />

                <RelatedServices currentPlatform={platform.toLowerCase()} currentCategory={encodeURIComponent(categoryDoc.slug || categoryDoc.name.toLowerCase())} />
            </div>
        </div>
    );
}
