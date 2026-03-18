"use client";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { PriceDisplayProvider } from './price-display-context';
import { ServiceDashboardProvider, useServiceDashboard } from './command-center/manager-context';
import { QuickImportDrawer } from './command-center/quick-import';

import { SerializedService, AdminProvider, SerializedOverride } from '@/types/admin';

interface UnifiedServiceManagerProps {
    services: SerializedService[];
    providers: AdminProvider[];
    categories: any[];
    projects: any[];
    overrides: SerializedOverride[];
    activeProjectId: string | null;
    defaultProviderId?: string;
    usdRate?: number;
    children: React.ReactNode;
}

export function UnifiedServiceManager({
    services: initialServices,
    providers,
    categories,
    projects,
    overrides,
    activeProjectId,
    defaultProviderId,
    usdRate = 90,
    children
}: UnifiedServiceManagerProps) {
    return (
        <PriceDisplayProvider usdRate={usdRate}>
            <ServiceDashboardProvider
                initialServices={initialServices}
                providers={providers}
                categories={categories}
                projects={projects}
                overrides={overrides}
                activeProjectId={activeProjectId}
                defaultProviderId={defaultProviderId}
            >
                <div className="space-y-6">
                    {children}
                </div>

                <ImportDrawerWrapper />
            </ServiceDashboardProvider>
        </PriceDisplayProvider>
    );
}

function ImportDrawerWrapper() {
    const { isImportOpen, setIsImportOpen, providers } = useServiceDashboard();

    return (
        <QuickImportDrawer
            isOpen={isImportOpen}
            onClose={() => setIsImportOpen(false)}
            providers={providers}
            onImportSuccess={() => setTimeout(() => window.location.reload(), 1000)}
        />
    );
}


