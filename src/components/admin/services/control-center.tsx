'use client';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import {
    LayoutGrid,
    Download,
    Settings2,
    HeartPulse,
    TrendingUp,
    Info
} from 'lucide-react';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { ProjectDistribution } from '@/app/admin/services/project-distribution';
import { CatalogDashboard } from '@/components/admin/services/catalog-dashboard';
import { SmartServiceImporter } from './smart-service-importer';
import ServiceHealthPage from '@/app/admin/services/health/page';
import MarkupManagerPage from '@/app/admin/services/markup/page';

interface ServiceControlCenterProps {
    services: any[];
    providers: any[];
    categories: any[];
    projects: any[];
    overrides: any[];
    allProviderServices: any[];
    activeProjectId: string | null;
}

export function ServiceControlCenter({
    services,
    providers,
    categories,
    projects,
    overrides,
    allProviderServices,
    activeProjectId
}: ServiceControlCenterProps) {
    const tabs = [
        {
            label: 'Каталог',
            icon: <LayoutGrid size={16} />,
            id: 'catalog',
            description: 'Управление основными услугами, категориями и их структурой.'
        },
        {
            label: 'Проекты',
            icon: <Settings2 size={16} />,
            id: 'projects',
            description: 'Настройка видимости и цен тарифов для каждого отдельного сайта (проекта).'
        },
        {
            label: 'Умный Импорт',
            icon: <Download size={16} />,
            id: 'smart-import',
            description: 'Автоматизированный импорт услуг с определением типа и категории.'
        },
        {
            label: 'Здоровье',
            icon: <HeartPulse size={16} />,
            id: 'health',
            description: 'Мониторинг стабильности выполнения заказов.'
        },
        {
            label: 'Наценка',
            icon: <TrendingUp size={16} />,
            id: 'markup',
            description: 'Глобальные правила наценки.'
        },
        {
            label: 'Инструкция',
            icon: <Info size={16} />,
            id: 'guide',
            description: 'Как пользоваться новой системой управления.'
        }
    ];

    return (
        <div className="space-y-6">
            <AdminTabs tabs={tabs}>
                {/* Tab 1: Catalog */}
                <div>
                    <CatalogDashboard
                        categories={categories}
                        services={services}
                        providers={providers}
                        allProviderServices={allProviderServices}
                        activeProjectId={activeProjectId}
                        initialOverrides={overrides}
                    />
                </div>

                {/* Tab 2: Projects */}
                <div>
                    <ProjectDistribution
                        services={services}
                        projects={projects}
                        initialOverrides={overrides}
                        activeProjectId={activeProjectId}
                    />
                </div>

                {/* Tab 2: Smart Import */}
                <div>
                    <SmartServiceImporter providers={providers} categories={categories} />
                </div>

                {/* Tab 3: Health */}
                <div>
                    <ServiceHealthPage />
                </div>

                {/* Tab 4: Markup */}
                <div>
                    <MarkupManagerPage />
                </div>

                {/* Tab 5: Guide */}
                <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
                    <iframe
                        src="/admin/services/guide"
                        className="w-full h-[800px] border-none"
                        title="Management Guide"
                    />
                </div>
            </AdminTabs>
        </div>
    );
}


