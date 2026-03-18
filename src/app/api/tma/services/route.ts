/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateProjectTMAData } from '@/utils/tma-auth';
import { getClientProjectId } from '@/utils/project-resolver';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');

    // ВРЕМЕННО: Пропускаем авторизацию для тестов в браузере, если заголовок отсутствует
    if (authHeader && authHeader.startsWith('tma ')) {
      await validateProjectTMAData(req);
    }

    const projectId = await getClientProjectId();

    const services = await prisma.internalService.findMany({
      where: { isActive: true, isPrivate: false },
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

    // Группируем данные: Platform -> Category -> Services
    const catalog: any = {};

    services.forEach(s => {
      const override = s.projectOverrides?.[0];
      if (override && !override.isActive) return; // Hide if disabled for project

      if (!catalog[s.platform]) catalog[s.platform] = {};
      if (!catalog[s.platform][s.category]) catalog[s.platform][s.category] = [];

      catalog[s.platform][s.category].push({
        id: s.id,
        name: override?.customName || s.name,
        description: override?.customDescription || s.description,
        price: override?.customPrice ? override.customPrice.toNumber() : s.pricePer1000.toNumber(),
        min: override?.customMinQty || s.minQty,
        max: override?.customMaxQty || s.maxQty,
        unit: s.unitName
      });
    });

    // Hidden Intellectual Property Watermark (Easter Egg)
    const response = {
      catalog,
      _meta: {
        sig: "SAA-2026-STABLE", // Sokolov Artem Andreevich
        v: "1.2.0"
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('TMA Services API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


