/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Decimal } from 'decimal.js';
import { PricingService } from '@/services/finance/pricing.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ rules: [] });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { pricingRules: true }
    });

    return NextResponse.json(project?.pricingRules || { rules: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const {
      providerName,
      category,
      markupPercent,
      fixedMarkup,
      minPrice,
      projectId // Optional: if we want to target a specific project
    } = await req.json();

    // 0. Если передан projectId (или мы берем дефолтный), сохраняем правило
    // Для обратной совместимости пока работаем с "глобальным" проектом или первым попавшимся, 
    // но в будущем лучше передавать ID явно.
    // Попробуем найти Main Project
    let targetProjectId = projectId;
    if (!targetProjectId) {
      // Fallback to finding the first project (Main)
      const mainProject = await prisma.project.findFirst();
      targetProjectId = mainProject?.id;
    }

    if (targetProjectId) {
      await PricingService.upsertMarkupRule({
        providerName: providerName || undefined,
        category: category || undefined,
        markupPercent: parseFloat(markupPercent || 0),
        fixedMarkup: parseFloat(fixedMarkup || 0),
        minPrice: parseFloat(minPrice || 0)
      }, targetProjectId);
    }

    // 1. Ищем все маппинги для указанного провайдера
    const where: any = { isActive: true };
    if (providerName) where.provider = { name: providerName };
    if (category) where.internalService = { category };

    const mappings = await prisma.internalServiceMapping.findMany({
      where,
      include: {
        providerService: true,
        internalService: true,
        provider: true
      }
    });

    const results = await prisma.$transaction(
      mappings.map((m) => {
        const costPrice = m.providerService.rawPrice;

        // Use the centralized calculator to ensure consistency
        // Note: We pass the specific context so it finds the specific rule we just saved (or better).
        // However, calculateRetailPrice logic loads rules from DB. Since we just saved it, it should be there.
        // But since we are inside a transaction/async flow, we might race? 
        // Actually upsertMarkupRule acts on Project, here we act on InternalService.

        // To be safe and efficient, we can construct the rule explicitly for immediate application
        // OR rely on the calculator. Let's rely on manual calculation here to match EXACTLY what the user just input,
        // ensuring immediate feedback matches input, even if DB lags (unlikely with Prisma await).

        // Manual Application for immediate result:
        let newPrice = costPrice.mul(1 + (markupPercent || 0) / 100);
        newPrice = newPrice.add(fixedMarkup || 0);

        if (minPrice && newPrice.lt(minPrice)) {
          newPrice = new Decimal(minPrice);
        }

        // 3. ПРИМЕНЕНИЕ ЗАЩИТНОГО ПОЛА (SAFETY FLOOR)
        const safetyPrice = PricingService.getSafetyPrice(costPrice);
        if (newPrice.lt(safetyPrice)) {
          newPrice = safetyPrice;
        }

        // 4. Округление (PricingService style)
        newPrice = new Decimal(Math.ceil(newPrice.toNumber() * 10) / 10).toDecimalPlaces(2, Decimal.ROUND_CEIL);

        return prisma.internalService.update({
          where: { id: m.internalServiceId },
          data: {
            pricePer1000: newPrice,
            lastProviderPrice: costPrice
          }
        });
      })
    );

    return NextResponse.json({
      success: true,
      updatedCount: results.length
    });
  } catch (error: any) {
    console.error('Markup Update Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


