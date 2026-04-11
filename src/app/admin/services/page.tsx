/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { getServiceCategoriesAction } from './actions';
import { UnifiedServiceManager } from '@/components/admin/services/unified-manager';
import { SerializedService, AdminProvider, SerializedOverride } from '@/types/admin';
import { ActionCardsWidget } from '@/components/admin/services/command-center/widgets/action-cards';
import { ProviderMonitoringWidget } from '@/components/admin/services/command-center/widgets/provider-monitoring';
import { ServicesTableWidget } from '@/components/admin/services/command-center/widgets/services-table';
import { MaintenanceWidget } from '@/components/admin/services/command-center/widgets/maintenance';
import { StuckOrdersWidget } from '@/components/admin/services/command-center/stuck-orders-widget';
import { getAdminSession, getActiveProjectId } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { MarkupAnalyticsWidget } from '@/components/admin/services/command-center/markup-analytics';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { providerId } = await searchParams;
  const projectId = await getActiveProjectId();
  const session = await getAdminSession();
  if (!session) return null;

  const ctx: AdminContext = {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };

  const activeProjectId = projectId || 'all';
  const result = await AdminDataService.getServicesDashboardData(ctx, activeProjectId);
  if (!result.success) {
    return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
  }

  const {
    services,
    providers,
    projects,
    overrides,
    usdRate,
    providerLogs
  } = result.data;

  // Categories are fetched via action for now to maintain consistency with existing business logic if it has special processing
  const categories = await getServiceCategoriesAction();

  const latestLogsMap = new Map();
  providerLogs.forEach(log => {
    if (!latestLogsMap.has(log.providerId)) {
      latestLogsMap.set(log.providerId, log);
    }
  });

  const serializedProviders = providers as AdminProvider[];
  const serializedServices = services as SerializedService[];
  const serializedOverrides = overrides as SerializedOverride[];

  return (
    <div className="max-w-[1700px] mx-auto px-4 sm:px-8 py-8 min-h-screen space-y-8">
      <UnifiedServiceManager
        services={serializedServices}
        providers={serializedProviders}
        categories={categories}
        projects={projects}
        overrides={serializedOverrides}
        activeProjectId={projectId}
        defaultProviderId={providerId as string}
        usdRate={usdRate}
      >
        <AdminHeader
          title="Услуги"
          subtitle="Внутренние цены, маржинальность и распределение по проектам"
        />

        {/* Action Widgets Grid */}
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-8">
            <StuckOrdersWidget />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <MarkupAnalyticsWidget />
          </div>
          <div className="col-span-12 lg:col-span-8">
            <ActionCardsWidget />
          </div>
          <div className="col-span-12 lg:col-span-4">
            <ProviderMonitoringWidget />
          </div>
        </div>

        {/* Maintenance Section */}
        <MaintenanceWidget />

        {/* Table Section */}
        <ServicesTableWidget />
      </UnifiedServiceManager>
    </div>
  );
}


