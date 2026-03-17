/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { getServiceCategoriesAction } from './actions';
import { UnifiedServiceManager } from '@/components/admin/services/unified-manager';
import { SerializedService, AdminProvider, SerializedOverride } from '@/types/admin';
import {
  ActionCardsWidget,
  ProviderMonitoringWidget,
  ServicesTableWidget,
  MaintenanceWidget
} from '@/components/admin/services/command-center/widgets';
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

  const serializedProviders = providers.map((p: any) => {
    const log = latestLogsMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      apiKey: p.apiKey,
      apiUrl: p.apiUrl,
      isEnabled: p.isEnabled,
      balanceThreshold: p.balanceThreshold?.toNumber ? p.balanceThreshold.toNumber() : Number(p.balanceThreshold || 0),
      currentBalance: log?.balance?.toNumber ? log.balance.toNumber() : Number(log?.balance || 0),
      metadata: p.metadata,
      projectId: p.projectId,
      balanceCurrency: (p.balanceCurrency as 'RUB' | 'USD') || 'RUB',
      pricesCurrency: (p.pricesCurrency as 'RUB' | 'USD') || 'RUB',
      serviceCount: p._count.services,
      _count: p._count
    } as AdminProvider;
  });

  const serializedServices = services.map((s: any) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    pricePer1000: s.pricePer1000?.toNumber ? s.pricePer1000.toNumber() : Number(s.pricePer1000 || 0),
    lastProviderPrice: s.lastProviderPrice?.toNumber ? s.lastProviderPrice.toNumber() : (s.lastProviderPrice ? Number(s.lastProviderPrice) : null),
    marketPrice: s.marketPrice?.toNumber ? s.marketPrice.toNumber() : (s.marketPrice ? Number(s.marketPrice) : null),
    isActive: s.isActive,
    platform: s.platform,
    category: s.category,
    targetType: s.targetType,
    requirements: s.requirements,
    guaranteeDays: s.guaranteeDays,
    successRate: s.successRate,
    isPrivate: s.isPrivate,
    categoryId: s.categoryId,
    minQty: s.minQty,
    maxQty: s.maxQty,
    providerPriceOriginal: s.providerPriceOriginal?.toNumber ? s.providerPriceOriginal.toNumber() : (s.providerPriceOriginal ? Number(s.providerPriceOriginal) : null),
    providerCurrencyOriginal: s.providerCurrencyOriginal,
    markup: s.markup?.toNumber ? s.markup.toNumber() : (s.markup ? Number(s.markup) : null),
    providerMappings: s.providerMappings.map((m: any) => ({
      id: m.id,
      priority: m.priority,
      isActive: m.isActive,
      providerId: m.providerId,
      providerServiceId: m.providerServiceId,
      provider: m.provider ? {
        id: m.provider.id,
        name: m.provider.name,
        type: m.provider.type,
        balanceThreshold: m.provider.balanceThreshold?.toNumber ? m.provider.balanceThreshold.toNumber() : Number(m.provider.balanceThreshold || 0)
      } : null,
      providerService: m.providerService ? {
        id: m.providerService.id,
        name: m.providerService.name,
        rawPrice: m.providerService.rawPrice?.toNumber ? m.providerService.rawPrice.toNumber() : Number(m.providerService.rawPrice || 0),
        rawPriceOriginal: m.providerService.rawPriceOriginal?.toNumber ? m.providerService.rawPriceOriginal.toNumber() : (m.providerService.rawPriceOriginal ? Number(m.providerService.rawPriceOriginal) : null),
        rawCurrencyOriginal: m.providerService.rawCurrencyOriginal,
        rawData: m.providerService.rawData
      } : null
    })),
    serviceCategory: s.serviceCategory ? {
      id: s.serviceCategory.id,
      name: s.serviceCategory.name,
      icon: s.serviceCategory.icon
    } : undefined,
  })) as SerializedService[];

  const serializedOverrides = overrides.map((o: any) => ({
    ...o,
    customPrice: o.customPrice?.toNumber() || null,
    markup: o.markup?.toNumber() || null
  })) as SerializedOverride[];

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
          title="Центр управления услугами"
          subtitle="Единый центр управления API, балансами и глобальным каталогом"
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
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <ServicesTableWidget />
        </div>
      </UnifiedServiceManager>
    </div>
  );
}
