/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';
import { PricingService } from '@/services/finance/pricing.service';
import { sanitizeData } from '@/utils/service-sanitizer';
import { Decimal } from 'decimal.js';

export async function GET() {
    try {
        const session = await getAdminSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const services = await prisma.internalService.findMany({
            orderBy: { id: 'asc' },
            include: {
                providerMappings: {
                    orderBy: { priority: 'asc' },
                    include: {
                        provider: true,
                        providerService: true
                    }
                },
                serviceCategory: true
            }
        });

        // Calculate recommendations for each service
        const enrichedServices = await Promise.all(services.map(async (s) => {
            const cost = Number(s.lastProviderPrice) ||
                Number(s.providerMappings?.[0]?.providerService?.rawPrice) || 0;

            let recommendedPrice = null;
            if (cost > 0) {
                const rec = await PricingService.calculateRetailPrice(new Decimal(cost), {
                    category: s.serviceCategory?.categoryType as any
                });
                recommendedPrice = rec.toNumber();
            }

            return {
                ...s,
                recommendedPrice
            };
        }));

        return NextResponse.json(sanitizeData(enrichedServices));
    } catch (error: any) {
        console.error('API Services GET Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}


