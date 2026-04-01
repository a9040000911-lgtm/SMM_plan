/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { Newspaper, Trophy, Scale, Megaphone, Star, Layout } from 'lucide-react';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { cookies } from 'next/headers';
import { dictionaries, Locale } from '@/i18n/dictionaries';

import NewsPage from '../../news/page';
import LoyaltyPage from '../../loyalty/page';
import LegalPage from '../../legal/page';
import ReviewsPage from '../../reviews/page';
import AdminCmsPage from '../page';

export const dynamic = 'force-dynamic';

export default async function ContentRootPage(props: { searchParams: Promise<any> }) {
    const cookieStore = await cookies();
    const lang = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
    const t = dictionaries[lang].admin.content;
    const searchParams = await props.searchParams;
    const activeTab = searchParams.tab || 'site';

    const tabs = [
        { label: 'Сайт', icon: <Layout size={16} />, id: 'site' },
        { label: t.tabs.news, icon: <Newspaper size={16} />, id: 'news' },
        { label: t.tabs.loyalty, icon: <Trophy size={16} />, id: 'loyalty' },
        { label: t.tabs.legal, icon: <Scale size={16} />, id: 'legal' },
        { label: t.tabs.reviews, icon: <Star size={16} />, id: 'reviews' },
    ];

    return (
        <div className="space-y-8 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3 tracking-tight">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <Megaphone size={24} className="text-purple-600" />
                        </div>
                        {t.title}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">{t.subtitle}</p>
                </div>
            </div>

            <AdminTabs tabs={tabs}>
                {activeTab === 'site' ? <div><AdminCmsPage /></div> : <div />}
                {activeTab === 'news' ? <div><NewsPage /></div> : <div />}
                {activeTab === 'loyalty' ? <div><LoyaltyPage /></div> : <div />}
                {activeTab === 'legal' ? <div><LegalPage searchParams={props.searchParams} /></div> : <div />}
                {activeTab === 'reviews' ? <div><ReviewsPage searchParams={props.searchParams} /></div> : <div />}
            </AdminTabs>
        </div>
    );
}


