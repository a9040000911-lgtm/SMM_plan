/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
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
import { getActiveProjectId } from '@/utils/project-resolver';
import { getAdminSession } from '@/utils/admin-session';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { MarkupAnalyticsWidget } from '@/components/admin/services/command-center/markup-analytics';

export const dynamic = 'force-dynamic';

export default async function AdminServicesPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { providerId } = await searchParams;
  const projectId = await getActiveProjectId();
  // eslint-disable-next-line unused-imports/no-unused-vars
  const session = await getAdminSession();

  const isGlobalMode = projectId === 'all';

  const dataWhere: any = isGlobalMode ? {} : {
    OR: [
      { projectId: null },
      { projectId: projectId }
    ]
  };

  const [services, providers, categories, projects, overrides, providerLogs, usdRateRecord] = await Promise.all([
    prisma.internalService.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        providerMappings: {
          where: isGlobalMode ? {} : {
            OR: [
              { projectId: null },
              { projectId: (projectId as string) }
            ]
          },
          orderBy: { priority: 'asc' },
          include: {
            provider: true,
            providerService: true
          }
        },
        serviceCategory: true,
      }
    }),
    prisma.provider.findMany({
      where: dataWhere,
      include: { _count: { select: { services: true } } },
      orderBy: { name: 'asc' }
    }),
    getServiceCategoriesAction(),
    prisma.project.findMany({
      orderBy: { name: 'asc' }
    }),
    prisma.projectServiceOverride.findMany({
      where: (isGlobalMode || !projectId) ? {} : { projectId: projectId as string }
    }),
    prisma.providerBalanceLog.findMany({
      where: { provider: dataWhere },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.currencyRate.findUnique({ where: { code: 'USD' } })
  ]);

  const usdRate = usdRateRecord?.rate.toNumber() || 90;

  const latestLogsMap = new Map();
  providerLogs.forEach(log => {
    if (!latestLogsMap.has(log.providerId)) {
      latestLogsMap.set(log.providerId, log);
    }
  });

  const serializedProviders = providers.map((p) => {
    const log = latestLogsMap.get(p.id);
    return {
      id: p.id,
      name: p.name,
      type: p.type,
      apiKey: p.apiKey,
      apiUrl: p.apiUrl,
      isEnabled: p.isEnabled,
      balanceThreshold: p.balanceThreshold?.toNumber() || 0,
      currentBalance: log?.balance.toNumber() || 0,
      metadata: p.metadata,
      projectId: p.projectId,
      balanceCurrency: (p.balanceCurrency as 'RUB' | 'USD') || 'RUB',
      pricesCurrency: (p.pricesCurrency as 'RUB' | 'USD') || 'RUB',
      serviceCount: p._count.services,
      _count: p._count
    } as AdminProvider;
  });

  const serializedServices = services.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    pricePer1000: s.pricePer1000.toNumber(),
    lastProviderPrice: s.lastProviderPrice ? s.lastProviderPrice.toNumber() : null,
    marketPrice: s.marketPrice ? s.marketPrice.toNumber() : null,
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
    providerPriceOriginal: s.providerPriceOriginal?.toNumber() || null,
    providerCurrencyOriginal: s.providerCurrencyOriginal,
    markup: s.markup?.toNumber() || null,
    providerMappings: s.providerMappings.map(m => ({
      id: m.id,
      priority: m.priority,
      isActive: m.isActive,
      providerId: m.providerId,
      providerServiceId: m.providerServiceId,
      provider: m.provider ? {
        id: m.provider.id,
        name: m.provider.name,
        type: m.provider.type,
        balanceThreshold: m.provider.balanceThreshold?.toNumber() || 0
      } : null,
      providerService: m.providerService ? {
        id: m.providerService.id,
        name: m.providerService.name,
        rawPrice: m.providerService.rawPrice.toNumber(),
        rawPriceOriginal: m.providerService.rawPriceOriginal?.toNumber() || null,
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

  const serializedOverrides = overrides.map(o => ({
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
