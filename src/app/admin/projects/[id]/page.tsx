/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { ProjectService } from '@/services/core';
import Link from 'next/link';
import {
    ArrowLeft,
    Settings,
    ExternalLink,
    ShieldAlert,
    Zap,
    LayoutDashboard,
    Trophy,
    DollarSign,
    Layers,
    Landmark,
    Database,
    Bot
} from 'lucide-react';
import { ProjectPricingEditor } from '@/components/admin/projects/project-pricing-editor';
import { ProjectSafetyEditor } from '@/components/admin/projects/project-safety-editor';
import { ProjectPaymentEditor } from '@/components/admin/projects/project-payment-editor';
import { ProjectAppearanceEditor } from '@/components/admin/projects/project-appearance-editor';
import { ProjectEditorModal } from '@/components/admin/projects/project-editor-modal';
import { cookies } from 'next/headers';
import { ProjectLoyaltyEditor } from '@/components/admin/projects/project-loyalty-editor';
import { ProjectMarketerEditor } from '@/components/admin/projects/project-marketer-editor';
import { ProjectFinancesTab } from '@/components/admin/projects/project-finances-tab';
import { ProjectProvidersTab } from '@/components/admin/projects/project-providers-tab';
import { ProjectTelegramTab } from '@/components/admin/projects/project-telegram-tab';
import { CryptoService } from '@/services/core';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ tab?: string }>;
}

import { ProjectServiceCatalog } from '@/components/admin/projects/project-service-catalog';
import { PriceDisplayProvider } from '@/components/admin/services/price-display-context';
import { CurrencyService } from '@/services/finance/currency.service';

export default async function ProjectIdentityPage({ params, searchParams }: PageProps) {
    const { id } = await params;
    const { tab } = await searchParams;
    const activeTab = tab || 'overview';
    const cookieStore = await cookies();
    const sessionData = cookieStore.get('admin_session');
    const { verifyAdminSession } = await import('@/services/core/jwt');
    const session = sessionData ? await verifyAdminSession(sessionData.value) : null;

    if (!session) return null;

    // ПРОВЕРКА ДОСТУПА: Если не глобальный админ и проект не в списке разрешенных
    if (!session.isGlobalAdmin && !session.allowedProjects?.includes(id)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-xs">Доступ запрещен</div>
                <p className="text-slate-500 text-sm">У вас нет прав на управление этим проектом.</p>
                <Link href="/admin/settings?tab=projects" className="text-blue-600 font-bold text-sm underline">Вернуться к списку</Link>
            </div>
        );
    }

    const projectRaw = await ProjectService.getById(id);

    if (!projectRaw) {
        notFound();
    }

    const project = {
        ...projectRaw,
        markup: projectRaw.markup ? projectRaw.markup.toNumber() : null
    };

    const rates = await CurrencyService.getRates();

    // Fetch Financial Data for this project
    const [transactionsRaw, expensesRaw] = await Promise.all([
        prisma.transaction.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' },
            take: 20
        }),
        prisma.businessExpense.findMany({
            where: { projectId: id },
            orderBy: { date: 'desc' },
            take: 20
        })
    ]);

    const transactions = transactionsRaw.map(tx => ({
        ...tx,
        amount: tx.amount.toNumber(),
        createdAt: tx.createdAt.toISOString(),
        updatedAt: tx.updatedAt.toISOString()
    }));

    const expenses = expensesRaw.map(ex => ({
        ...ex,
        amount: ex.amount.toNumber(),
        date: ex.date.toISOString(),
        createdAt: ex.createdAt.toISOString(),
        updatedAt: ex.updatedAt.toISOString()
    }));

    const totalIncome = transactions
        .filter(tx => tx.type === 'DEPOSIT' || tx.type === 'REFUND')
        .reduce((acc, tx) => acc + (tx.type === 'REFUND' ? -tx.amount : tx.amount), 0);

    const totalExpenses = expenses.reduce((acc, ex) => acc + ex.amount, 0);

    const financeStats = {
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses
    };

    const tabs = [
        { id: 'overview', name: 'Обзор', icon: LayoutDashboard, color: 'text-slate-900' },
        { id: 'services', name: 'Услуги', icon: Layers, color: 'text-blue-600' },
        { id: 'commerce', name: 'Коммерция', icon: Landmark, color: 'text-amber-600' },
        { id: 'telegram', name: 'Telegram', icon: Bot, color: 'text-blue-500' },
        { id: 'loyalty', name: 'Лояльность', icon: Trophy, color: 'text-emerald-600' },
        { id: 'marketer', name: 'Маркетолог', icon: Zap, color: 'text-blue-600' },
        { id: 'providers', name: 'API Провайдеры', icon: Database, color: 'text-cyan-600' },
        { id: 'finance', name: 'Финансы', icon: DollarSign, color: 'text-rose-600' },
    ];

    // Optional data fetching based on tab
    let services: any[] = [];
    let serviceOverrides: any[] = [];
    let categories: any[] = [];

    if (activeTab === 'services') {
        const [allInternalServices, overrides, categoriesRaw] = await Promise.all([
            prisma.internalService.findMany({
                orderBy: { name: 'asc' },
                include: {
                    providerMappings: {
                        include: { provider: true },
                        take: 1
                    }
                }
            }),
            prisma.projectServiceOverride.findMany({
                where: { projectId: id }
            }),
            prisma.serviceCategory.findMany({
                where: {
                    OR: [
                        { projectId: null },
                        { projectId: id }
                    ],
                    isActive: true
                },
                orderBy: { name: 'asc' }
            })
        ]);

        categories = categoriesRaw.map(c => ({
            id: c.id,
            name: c.name,
            platform: c.platform,
            categoryType: c.categoryType
        }));

        services = allInternalServices.map(s => ({
            ...s,
            pricePer1000: s.pricePer1000.toNumber(),
            lastProviderPrice: s.lastProviderPrice ? s.lastProviderPrice.toNumber() : 0,
            marketPrice: s.marketPrice ? s.marketPrice.toNumber() : null,
            markup: s.markup ? s.markup.toNumber() : null,
            providerPriceOriginal: s.providerPriceOriginal ? s.providerPriceOriginal.toNumber() : null,
            providerMappings: s.providerMappings.map(pm => ({
                ...pm,
                provider: { name: pm.provider.name }
            }))
        }));

        serviceOverrides = overrides.map(o => ({
            ...o,
            customPrice: o.customPrice ? o.customPrice.toNumber() : null,
            markup: o.markup ? o.markup.toNumber() : null
        }));
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header & Back Button */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/settings?tab=projects"
                        className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all shadow-sm group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{project.name}</h1>
                            <div className="p-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest px-2" style={{ backgroundColor: `${project.brandColor}20`, color: project.brandColor }}>
                                {project.slug}
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                            <Settings size={14} className="text-slate-400" /> Настройка параметров и внешнего вида платформы
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href={`/admin/projects/${id}/services`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 rounded-xl text-xs font-bold text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                    >
                        <Layers size={14} />
                        Услуги проекта
                    </Link>
                    <ProjectEditorModal project={project as any} />
                    {project.domain && (
                        <a
                            href={`https://${project.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-200 hover:text-blue-600 transition-all shadow-sm"
                        >
                            <ExternalLink size={14} />
                            Перейти на сайт
                        </a>
                    )}
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-lg w-fit border border-slate-200/50">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = activeTab === t.id;
                    return (
                        <Link key={t.id} href={`/admin/projects/${id}?tab=${t.id}`}>
                            <button className={`px-4 py-2 rounded-md text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${isActive ? `bg-white ${t.color} shadow-sm ring-1 ring-slate-200` : 'text-slate-400 hover:text-slate-600'}`}>
                                <Icon size={14} />
                                {t.name}
                            </button>
                        </Link>
                    );
                })}
            </div>

            {/* TABS CONTENT */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* 1. OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        {/* Status Strip */}
                        <div className={`px-4 py-3 rounded-lg border flex items-center justify-between ${project.maintenanceMode ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-md ${project.maintenanceMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    <ShieldAlert size={14} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-700 text-xs uppercase tracking-tight">Статус системы:</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${project.maintenanceMode ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {project.maintenanceMode ? 'Технические работы' : 'Активен'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full">
                            <ProjectAppearanceEditor
                                projectId={project.id}
                                initialConfig={(project.config as any)}
                            />
                        </div>
                    </div>
                )}

                {/* 1.5 SERVICES */}
                {activeTab === 'services' && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Каталог услуг проекта</h3>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Включайте нужные услуги и задавайте индивидуальные цены</p>
                            </div>
                            <Link
                                href={`/admin/projects/${id}/services`}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 shadow-lg shadow-slate-200 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all"
                            >
                                <ExternalLink size={14} /> Расширенное управление
                            </Link>
                        </div>
                        <PriceDisplayProvider usdRate={rates.USD || 90}>
                            <ProjectServiceCatalog
                                projectId={id}
                                services={services}
                                overrides={serviceOverrides}
                                categories={categories}
                            />
                        </PriceDisplayProvider>
                    </div>
                )}

                {/* 2. COMMERCE */}
                {activeTab === 'commerce' && (
                    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-black text-slate-800 text-lg flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                                        <Landmark size={18} />
                                    </div>
                                    Коммерческие настройки
                                </h3>
                            </div>
                            <div className="p-8 space-y-8">
                                <ProjectPricingEditor
                                    projectId={project.id}
                                    initialRules={(project.pricingRules as any) || []}
                                />
                                <div className="h-px bg-slate-100" />
                                <ProjectSafetyEditor
                                    projectId={project.id}
                                    initialSettings={(project.safetySettings as any)}
                                />
                                <div className="h-px bg-slate-100" />
                                <ProjectPaymentEditor
                                    projectId={project.id}
                                    initialSettings={(project.paymentSettings as any)}
                                />
                            </div>
                        </div>
                    </div>
                )}


                {/* 3. LOYALTY */}
                {activeTab === 'loyalty' && (
                    <div className="max-w-4xl">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-3">
                                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-md">
                                        <Trophy size={16} />
                                    </div>
                                    Система лояльности
                                </h3>
                            </div>
                            <div className="p-6">
                                <ProjectLoyaltyEditor
                                    projectId={project.id}
                                    initialScheme={(project.config as any)?.loyaltyScheme}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. MARKETER */}
                {activeTab === 'marketer' && (
                    <div className="max-w-4xl">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-3">
                                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md">
                                        <Zap size={16} />
                                    </div>
                                    Персональный маркетолог
                                </h3>
                            </div>
                            <div className="p-6">
                                <ProjectMarketerEditor
                                    projectId={project.id}
                                    initialSettings={(project as any).marketerSettings}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4.5 PROVIDERS */}
                {activeTab === 'providers' && (
                    <div className="max-w-4xl">
                        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                            <div className="p-8">
                                <ProjectProvidersTab projectId={project.id} />
                            </div>
                        </div>
                    </div>
                )}

                {/* 4.6 TELEGRAM */}
                {activeTab === 'telegram' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <ProjectTelegramTab
                            projectId={id}
                            project={{
                                ...project,
                                botToken: project.botToken ? CryptoService.decrypt(project.botToken) : null,
                                botUsername: project.botUsername,
                                config: project.config as any
                            }}
                        />
                    </div>
                )}

                {/* 5. FINANCE */}
                {activeTab === 'finance' && (
                    <ProjectFinancesTab
                        stats={financeStats}
                        recentTransactions={transactions as any}
                        recentExpenses={expenses as any}
                    />
                )}
            </div>
        </div>
    );
}
