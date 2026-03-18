/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';
import { auth } from "@/auth";

import { LoyaltyService } from '@/services/users';

export async function GET(_req: NextRequest) {
    try {
        const projectId = await getClientProjectId();
        const session = await auth();

        let discount = 0;
        let isEarlyBird = false;

        if (session?.user?.email && projectId) {
            const user = await prisma.user.findFirst({
                where: { email: session.user.email, projectId }
            });
            if (user) {
                const loyalty = await LoyaltyService.getLoyaltyInfo(user.id, user.spent.toNumber(), projectId);
                discount = loyalty.totalDiscount;
                isEarlyBird = loyalty.isEarlyBird;
            }
        }

        // 1. Fetch services that:
        // - Belong to a group of this project
        // - OR have no group (global services)
        // - AND apply project overrides
        const services = await prisma.internalService.findMany({
            where: {
                isActive: true,
                OR: [
                    { serviceCategory: { projectId: projectId || undefined } },
                    { serviceCategory: { projectId: null } },
                    { categoryId: null }
                ]
            },
            include: {
                serviceCategory: true,
                projectOverrides: {
                    where: { projectId: projectId || undefined }
                }
            },
            orderBy: [
                { platform: 'asc' },
                { category: 'asc' },
                { pricePer1000: 'asc' }
            ]
        });

        // Group data: Platform -> ServiceCategory -> Services
        const catalog: any = {};

        // Sort services by category priority first, then price
        const sortedServices = services.sort((a, b) => {
            const pA = a.serviceCategory?.priority ?? 0;
            const pB = b.serviceCategory?.priority ?? 0;
            if (pB !== pA) return pB - pA;
            return a.pricePer1000.toNumber() - b.pricePer1000.toNumber();
        });

        sortedServices.forEach(s => {
            const override = s.projectOverrides?.[0];
            if (override && !override.isActive) return; // Hidden by override

            if (!catalog[s.platform]) catalog[s.platform] = {};

            const category = s.serviceCategory;
            const catName = category?.name || 'Другое';

            if (!catalog[s.platform][catName]) {
                catalog[s.platform][catName] = {
                    metadata: {
                        id: category?.id || 'other',
                        description: category?.description || '',
                        icon: category?.icon || '',
                        targetType: category?.targetType || s.targetType,
                        category: category?.categoryType || s.category
                    },
                    services: []
                };
            }

            const price = override?.customPrice
                ? override.customPrice.toNumber()
                : (s.pricePer1000 ? s.pricePer1000.toNumber() : 0);

            catalog[s.platform][catName].services.push({
                id: s.numericId.toString(),
                name: s.name,
                tierName: 'Стандарт',
                tierColor: '#3b82f6',
                description: s.description,
                price,
                min: s.minQty,
                max: s.maxQty,
                unit: s.unitName,
                platform: s.platform,
                category: category?.categoryType || s.category,
                targetType: category?.targetType || s.targetType,
                isBest: s.isCurated,
                tierPriority: 99,
                discountPercent: discount,
                isPioneer: isEarlyBird,
                personalizedPrice: discount > 0 ? price * (1 - discount / 100) : price
            });
        });

        return NextResponse.json(catalog);
    } catch (error) {
        console.error('Client Services API Error:', error);
        return NextResponse.json({
            error: 'Internal Server Error',
            message: (error as any).message
        }, { status: 500 });
    }
}


