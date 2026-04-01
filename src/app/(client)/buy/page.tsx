import React from 'react';
import { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/seo/JsonLd';
import { PLATFORM_SEO } from '@/configs/seo-platforms';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'Каталог услуг продвижения | Купить подписчиков и лайки - Smmplan',
    description: 'Полный каталог SMM услуг для всех социальных сетей. Быстрое продвижение от экспертов Smmplan. Выбирайте нужную платформу и начинайте рост.',
    alternates: {
        canonical: 'https://smmplan.pro/buy'
    }
};

export default function BuyIndexPage() {
    return (
        <div className="w-full pb-32 pt-12">
            <BreadcrumbJsonLd items={[
                { name: "Главная", item: "https://smmplan.pro" },
                { name: "Все услуги", item: "https://smmplan.pro/buy" }
            ]} />
            
            <div className="max-w-6xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic mb-6">
                        Что будем продвигать?
                    </h1>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto font-medium">
                        Выберите социальную сеть из списка ниже, чтобы перейти к услугам продвижения по оптовым ценам.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(PLATFORM_SEO).map(([key, data]) => {
                        const platformSlug = key.toLowerCase();
                        return (
                            <Link 
                                href={`/buy/${platformSlug}`} 
                                key={key}
                                className="group bg-white border border-slate-200 rounded-[2rem] p-8 hover:shadow-xl hover:shadow-blue-500/10 hover:border-blue-500/30 transition-all block"
                            >
                                <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                                    {data.h1}
                                </h2>
                                <p className="text-sm text-slate-500 line-clamp-2">
                                    {data.subtext}
                                </p>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
