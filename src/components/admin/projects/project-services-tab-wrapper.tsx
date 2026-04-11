import React from 'react';
import { prisma } from '@/lib/prisma';
import { ProjectServiceCatalog } from './project-service-catalog';
import { PriceDisplayProvider } from '@/components/admin/services/price-display-context';
import { CurrencyService } from '@/services/finance/currency.service';

interface ProjectServicesTabWrapperProps {
    projectId: string;
}

export async function ProjectServicesTabWrapper({ projectId }: ProjectServicesTabWrapperProps) {
    const [allInternalServices, overrides, categoriesRaw, rates] = await Promise.all([
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
            where: { projectId }
        }),
        prisma.serviceCategory.findMany({
            where: {
                OR: [
                    { projectId: null },
                    { projectId }
                ],
                isActive: true
            },
            orderBy: { name: 'asc' }
        }),
        CurrencyService.getRates()
    ]);

    const categories = categoriesRaw.map(c => ({
        id: c.id,
        name: c.name,
        platform: c.platform,
        categoryType: c.categoryType
    }));

    const services = allInternalServices.map(s => ({
        ...s,
        pricePer1000: s.pricePer1000.toNumber(),
        lastProviderPrice: s.lastProviderPrice ? s.lastProviderPrice.toNumber() : 0,
         बाजारннаяЦена: s.marketPrice ? s.marketPrice.toNumber() : null, // keep consistent with existing
        marketPrice: s.marketPrice ? s.marketPrice.toNumber() : null, // Fix if marketPrice was wrongly named
        markup: s.markup ? s.markup.toNumber() : null,
        providerPriceOriginal: s.providerPriceOriginal ? s.providerPriceOriginal.toNumber() : null,
        providerMappings: s.providerMappings.map(pm => ({
            ...pm,
            provider: { name: pm.provider.name }
        }))
    }));

    const serviceOverrides = overrides.map(o => ({
        ...o,
        customPrice: o.customPrice ? o.customPrice.toNumber() : null,
        markup: o.markup ? o.markup.toNumber() : null
    }));

    return (
        <PriceDisplayProvider usdRate={rates.USD || 90}>
            <ProjectServiceCatalog
                projectId={projectId}
                services={services}
                overrides={serviceOverrides}
                categories={categories}
            />
        </PriceDisplayProvider>
    );
}
