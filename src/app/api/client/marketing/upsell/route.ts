import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getClientProjectId } from '@/utils/project-resolver';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const projectId = await getClientProjectId();
        if (!projectId) return NextResponse.json({ error: 'No project context' }, { status: 400 });

        const { searchParams } = new URL(req.url);
        const originalServiceId = searchParams.get('originalServiceId');

        if (!originalServiceId) {
            return NextResponse.json({ error: 'Missing service id' }, { status: 400 });
        }

        const originalService = await prisma.internalService.findUnique({
            where: { id: originalServiceId },
            include: { serviceCategory: { include: { socialPlatform: true } } }
        });

        if (!originalService?.serviceCategory?.socialPlatform) {
             return NextResponse.json({ upsell: null });
        }

        const platform = originalService.serviceCategory.socialPlatform;
        const currentCategorySlug = originalService.serviceCategory.slug;

        const crossSellCategory = await prisma.serviceCategory.findFirst({
            where: {
                projectId,
                socialPlatformId: platform.id,
                isActive: true,
                slug: { not: currentCategorySlug || '' }
            },
            include: {
                internalServices: {
                    where: { isActive: true, isPrivate: false },
                    orderBy: { pricePer1000: 'asc' },
                    take: 1
                }
            }
        });

        if (!crossSellCategory || crossSellCategory.internalServices.length === 0) {
            return NextResponse.json({ upsell: null });
        }

        const recommendedService = crossSellCategory.internalServices[0];

        return NextResponse.json({
            upsell: {
                platformSlug: platform.slug,
                platformName: platform.name,
                categoryName: crossSellCategory.name,
                categorySlug: crossSellCategory.slug,
                service: {
                    id: recommendedService.id,
                    name: recommendedService.name,
                    pricePer1000: recommendedService.pricePer1000,
                    priceUnit: recommendedService.priceUnit,
                }
            }
        });

    } catch (e: any) {
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
