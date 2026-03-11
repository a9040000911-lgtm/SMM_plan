/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Layers, List, PackagePlus } from 'lucide-react';
import { ProjectServiceCatalog } from '@/components/admin/projects/project-service-catalog';
import { ProjectQuickImport } from '@/components/admin/projects/project-quick-import';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { CurrencyService } from '@/services/finance/currency.service';
import { PriceDisplayProvider } from '@/components/admin/services/price-display-context';

export const dynamic = 'force-dynamic';

export default async function ProjectServicesPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const project = await prisma.project.findUnique({
        where: { id },
        include: {
        }
    });

     
    const categories = await prisma.serviceCategory.findMany({
        orderBy: { name: 'asc' },
        include: {
            internalServices: {
                where: { type: 'REGULAR' },
                include: {
                    providerMappings: {
                        include: { provider: true, providerService: true }
                    }
                }
            }
        }
    });

    if (!project) notFound();

    const [providers, allInternalServices, overrides] = await Promise.all([
        prisma.provider.findMany({ where: { isEnabled: true } }),
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
        })
    ]);

    const rates = await CurrencyService.getRates();

    // Serialize Data for Client Components
    const serializedServices = allInternalServices.map(s => ({
        ...s,
        pricePer1000: s.pricePer1000.toNumber(),
        lastProviderPrice: s.lastProviderPrice ? s.lastProviderPrice.toNumber() : 0,
        providerMappings: s.providerMappings.map(pm => ({
            ...pm,
            provider: { name: pm.provider.name }
        }))
    }));

    const serializedOverrides = overrides.map(o => ({
        ...o,
        customPrice: o.customPrice ? o.customPrice.toNumber() : null,
        markup: o.markup ? o.markup.toNumber() : null
    }));

    const tabs = [
        { id: 'catalog', label: 'Мои услуги', icon: <List size={16} /> },
        { id: 'import', label: 'Добавить услуги', icon: <PackagePlus size={16} /> },
    ];

    return (
        <PriceDisplayProvider usdRate={rates.USD || 95}>
            <div className="space-y-8 pb-20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href={`/admin/projects/${id}`}
                            className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-900 transition-all shadow-sm group"
                        >
                            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                                <Layers className="text-blue-500" />
                                Услуги проекта: {project.name}
                            </h1>
                            <p className="text-sm text-slate-500 mt-0.5">
                                Управление доступными услугами, ценами и импортом.
                            </p>
                        </div>
                    </div>
                </div>

                <AdminTabs tabs={tabs}>
                    {/* 1. CATALOG MANAGER */}
                    <div>
                        <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-2xl text-sm border border-blue-100 flex items-start gap-3">
                            <List className="shrink-0 mt-0.5" size={18} />
                            <div>
                                <strong>Управление каталогом:</strong> Здесь вы можете включать/отключать услуги конкретно для этого проекта и задавать индивидуальные цены или наценки.
                                Если параметры не заданы (Auto), используются глобальные настройки.
                            </div>
                        </div>
                        <ProjectServiceCatalog
                            projectId={id}
                            services={serializedServices as any}
                            overrides={serializedOverrides as any}
                            categories={categories as any}
                        />
                    </div>

                    {/* 2. IMPORT */}
                    <div>
                        <ProjectQuickImport
                            projectId={id}
                            providers={providers as any}
                        />
                    </div>
                </AdminTabs>
            </div>
        </PriceDisplayProvider>
    );
}
