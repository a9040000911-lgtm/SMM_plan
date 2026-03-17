/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { prisma } from '@/lib/prisma';
import { getActiveProjectId } from '@/utils/admin-session';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  Database,
  Activity,
  Settings,
  DollarSign,
  Link as LinkIcon,
  Activity as ActivityIcon
} from 'lucide-react';
import Link from 'next/link';
import { AdminTabs } from '@/components/admin/core/admin-tabs';
import { ServiceEditor } from '@/components/admin/services/service-editor';
import { ProviderLinker } from '@/components/admin/providers/provider-linker';
import { MappingList } from '@/components/admin/providers/mapping-list';
import { ServiceOverrides } from '@/components/admin/services/service-overrides';
import { ProjectVisibilityManager } from '@/components/admin/services/project-visibility-toggle';
import { PriceDisplayProvider } from '@/components/admin/services/price-display-context';
import { CurrencyService } from '@/services/finance/currency.service';
import { sanitizeData } from '@/utils/service-sanitizer';

export const dynamic = 'force-dynamic';

async function getService(id: string) {
  const [serviceRaw, projectsRaw, providers, allInternalServicesRaw, categories, activeProjectId] = await Promise.all([
    prisma.internalService.findUnique({
      where: { id },
      include: {
        providerMappings: {
          include: {
            providerService: true,
            provider: true
          }
        },
        projectOverrides: true,
        _count: { select: { orders: true } }
      }
    }),
    prisma.project.findMany({
      select: { id: true, name: true, brandColor: true }
    }),
    prisma.provider.findMany({
      where: { isEnabled: true },
      select: { id: true, name: true }
    }),
    prisma.internalService.findMany({
      where: { type: 'REGULAR', isActive: true },
      select: { id: true, name: true, pricePer1000: true }
    }),
    prisma.serviceCategory.findMany({
      orderBy: [
        { platform: 'asc' },
        { priority: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        platform: true,
        categoryType: true
      }
    }),
    getActiveProjectId()
  ]);

  if (!serviceRaw) return { service: null, projects: [], providers: [], availableServices: [], allInternalServices: [], categories: [], activeProjectId: null };

  const service = sanitizeData(serviceRaw);
  const allInternalServices = sanitizeData(allInternalServicesRaw);
  const projects = sanitizeData(projectsRaw);

  const allOverrides = await prisma.projectServiceOverride.findMany({
    where: { internalServiceId: id }
  });

  const rawAvailableServices = await prisma.providerService.findMany({
    include: {
      provider: {
        select: { name: true }
      }
    }
  });

  return {
    service,
    projects,
    providers,
    allInternalServices,
    categories,
    activeProjectId,
    projectOverrides: sanitizeData(allOverrides),
    availableServices: sanitizeData(rawAvailableServices.map(as => ({
      id: as.id,
      name: as.name,
      rawPrice: as.rawPrice,
      providerName: as.provider.name,
      providerId: as.providerId,
      platform: as.platform,
      category: as.category
    })))
  };
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rates = await CurrencyService.getRates();
  const data = await getService(id);
  const { service, projects, availableServices, providers, allInternalServices, projectOverrides, categories, activeProjectId } = data;

  if (!service) {
    notFound();
  }

  const price = Number(service.pricePer1000);

  const tabs = [
    { label: 'Основные', icon: <Settings size={16} />, id: 'general', description: 'Настройка названия, ограничений и интерфейса услуги.' },
    { label: 'Стоимость', icon: <DollarSign size={16} />, id: 'pricing', description: 'Управление базовой ценой и наценками по проектам.' },
    { label: 'Провайдеры', icon: <LinkIcon size={16} />, id: 'providers', description: 'Привязка услуги к внешним API-провайдерам.' },
    { label: 'Анатилика и Доступ', icon: <ActivityIcon size={16} />, id: 'analytics', description: 'Статистика успешности и управление видимостью в проектах.' },
  ];

  return (
    <PriceDisplayProvider usdRate={rates.USD || 90}>
      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">

        {/* Sticky Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 bg-slate-50/90 backdrop-blur-md z-10 py-4 border-b border-slate-200/60 -mx-4 px-4 sm:-mx-8 sm:px-8">
          <div className="space-y-1">
            <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
              <Link href="/admin/services" className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                <ArrowLeft size={14} />
                Назад
              </Link>
              <div className="w-1 h-1 rounded-full bg-slate-200" />
              <span className="text-slate-900 truncate max-w-[200px]">{service.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <span className="text-slate-400 font-mono text-xl bg-slate-100 px-2.5 py-1 rounded cursor-help" title={`Core ID: ${service.id}`}>#{service.numericId}</span>
                {service.name}
              </h1>
              <div className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${service.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {service.isActive ? 'Активен' : 'Неактивен'}
              </div>
            </div>
          </div>
        </div>

        <AdminTabs tabs={tabs}>

          {/* TAB 1: General */}
          <div className="space-y-8 pb-10">
            <ServiceEditor
              service={service as any}
              allRegularServices={allInternalServices}
              allProjects={projects}
              allCategories={categories}
              initialProjectOverrides={projectOverrides}
              activeProjectId={activeProjectId}
            />
          </div>

          {/* TAB 2: Pricing */}
          <div className="space-y-8 pb-10">
            <ServiceOverrides
              serviceId={service.id}
              basePrice={price}
              projects={projects}
              initialOverrides={service.projectOverrides}
            />
          </div>

          {/* TAB 3: Providers */}
          <div className="space-y-8 pb-10">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Database size={16} className="text-indigo-500" />
                  Привязки к провайдерам
                </h3>
              </div>
              <div className="overflow-x-auto">
                <MappingList
                  _internalServiceId={service.id}
                  mappings={service.providerMappings as any}
                  internalPrice={price}
                />
              </div>
            </div>

            <ProviderLinker
              internalServiceId={service.id}
              internalServiceName={service.name}
              providers={providers}
              availableServices={availableServices as any}
            />
          </div>

          {/* TAB 4: Analytics and Access */}
          <div className="space-y-8 pb-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2 mb-6">
                  <Activity size={16} className="text-indigo-500" />
                  Сводка аналитики
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Успешность</div>
                    <div className="text-lg font-bold text-emerald-600">{Number(service.successRate).toFixed(1)}%</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Ср. время</div>
                    <div className="text-lg font-bold text-slate-700">{Math.round((service.avgCompletionTime || 0) / 60)}м</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center space-y-1 col-span-2">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Всего заказов</div>
                    <div className="text-lg font-bold text-slate-700">{service._count.orders}</div>
                  </div>
                </div>
              </div>

              <ProjectVisibilityManager
                serviceId={service.id}
                projects={projects}
                initialEnabledIds={projectOverrides.filter((o: any) => o.isActive).map((o: any) => o.projectId)}
              />
            </div>
          </div>

        </AdminTabs>
      </div>
    </PriceDisplayProvider>
  );
}