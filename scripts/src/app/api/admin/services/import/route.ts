/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Platform, Category } from '@/generated/client';
import { SmartAnalyzerService } from '@/services/providers';
import { PricingService } from '@/services/finance/pricing.service';
import { Decimal } from 'decimal.js';

import { GuaranteeParser } from '@/utils/guarantee-parser';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerName = searchParams.get('provider');
    const search = searchParams.get('search');
    const platformFilter = searchParams.get('platform');
    const categoryFilter = searchParams.get('category');

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Новые параметры фильтрации
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort');

    // Базовый фильтр для БД
    const where: any = {};
    if (providerName) where.provider = { name: providerName };

    if (search) {
      const parts = search.split(',').map(p => p.trim()).filter(Boolean);
      if (parts.length > 1) {
        where.AND = [...(where.AND || []), ...parts.map(part => {
          const isNumeric = /^\d+$/.test(part);
          if (isNumeric) {
            return {
              OR: [
                { name: { contains: part, mode: 'insensitive' } },
                { id: { equals: parseInt(part) } }
              ]
            };
          }
          return { name: { contains: part, mode: 'insensitive' } };
        })];
      } else {
        const isNumeric = /^\d+$/.test(search);
        if (isNumeric) {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { id: { equals: parseInt(search) } }
          ];
        } else {
          where.name = { contains: search, mode: 'insensitive' };
        }
      }
    }

    // Фильтр по цене
    if (minPrice || maxPrice) {
      where.rawPrice = {};
      if (minPrice) where.rawPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.rawPrice.lte = parseFloat(maxPrice);
    }

    const hideImported = searchParams.get('hideImported') === 'true';
    if (hideImported) {
      where.mappings = { none: {} };
    }

    if (platformFilter) {
      // Search by both Prisma Platform enum AND socialPlatform slug
      // Wrap in AND to avoid conflicts with search OR
      const platformCondition = {
        OR: [
          { platform: platformFilter },
          { socialPlatform: { slug: { equals: platformFilter, mode: 'insensitive' as const } } }
        ]
      };
      if (where.AND) {
        where.AND.push(platformCondition);
      } else if (where.OR) {
        // If search already set OR, wrap both in AND
        const searchCondition = { OR: where.OR };
        delete where.OR;
        where.AND = [searchCondition, platformCondition];
      } else {
        where.AND = [platformCondition];
      }
    }
    if (categoryFilter) where.category = categoryFilter;

    // Сортировка
    let orderBy: any = { rawPrice: 'asc' }; // default

    if (sort === 'price_asc') {
      orderBy = { rawPrice: 'asc' };
    } else if (sort === 'price_desc') {
      orderBy = { rawPrice: 'desc' };
    }

    // Считаем общее количество
    const totalCount = await prisma.providerService.count({ where });

    // Загружаем с пагинацией
    const services = await prisma.providerService.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        provider: true,
        mappings: {
          include: {
            internalService: true
          }
        }
      }
    });

    const response = services.map((s: any) => {
      const raw = s.rawData as any;

      return {
        id: s.id,
        name: s.name,
        providerId: s.providerId,
        providerName: s.provider.name,
        rawPrice: s.rawPrice,
        platform: s.platform,
        category: s.category,
        min: raw.min,
        max: raw.max,
        description: raw.description,
        isImported: s.mappings.length > 0,
        mapping: s.mappings[0] || null,
        mappings: s.mappings,
        rawData: s.rawData,
        analysis: SmartAnalyzerService.detectSync(s.name, raw.description || '', s.category || '')
      };
    });

    return NextResponse.json({
      data: response,
      meta: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const services = Array.isArray(body) ? body : [body];

    const results = await prisma.$transaction(async (tx) => {
      const createdIds = [];

      for (const s of services) {
        const {
          id, name, platform, category, targetType: initialTargetType,
          pricePer1000, minQty, maxQty, providerId, providerUUID, priceUnit, unitName,
        } = s;

        let { description, isPrivate, targetType, requirements } = s;
        if (!targetType) targetType = initialTargetType;

        // Если описание стандартное или отсутствует, генерируем новое
        if (!description || description === 'Импортировано из API.') {
          const analysis = await SmartAnalyzerService.analyzeService(name, s.rawData?.description || '', s.category || '');
          if (analysis?.description_ru) {
            description = analysis.description_ru;
          }
          if (isPrivate === undefined && analysis?.isPrivate !== undefined) {
            isPrivate = analysis.isPrivate;
          }
          if (requirements === undefined && analysis?.requirements !== undefined) {
            requirements = analysis.requirements;
          }
        }

        // 0. Calculate Price using Pricing Engine
        // We find the Main Project ID for context (or use meaningful defaults)
        const mainProject = await prisma.project.findFirst();
        const projectIdFromDB = mainProject?.id;

        let finalPrice = new Decimal(pricePer1000 || 0);
        const rawPriceVal = s.rawPrice || (s.rawData as any)?.rate || 0;

        if (rawPriceVal) {
          finalPrice = await PricingService.calculateRetailPrice(new Decimal(rawPriceVal), {
            providerName: s.providerName,
            category: category as Category,
            projectId: projectIdFromDB
          });
        }

        // 0.1 Resolve or create Category
        const categoryObj = await SmartAnalyzerService.resolveCategory(tx, platform, category as Category, targetType as string, null);

        // 1. Создаем/обновляем внутреннюю услугу
        await tx.internalService.upsert({
          where: { id },
          update: {
            platform: platform as Platform,
            category: category as Category,
            serviceCategory: { connect: { id: categoryObj.id } },
            name,
            description,
            pricePer1000: finalPrice,
            lastProviderPrice: rawPriceVal,
            minQty,
            maxQty,
            targetType: targetType as any,
            isPrivate: isPrivate === true,
            requirements,
            geo: 'Мир',
            priceUnit: priceUnit || 1000,
            unitName: unitName || 'шт.',
            guaranteeDays: GuaranteeParser.parse(name + ' ' + (description || '')),
          },
          create: {
            id,
            platform: platform as Platform,
            category: category as Category,
            serviceCategory: { connect: { id: categoryObj.id } },
            name,
            description,
            pricePer1000: finalPrice,
            lastProviderPrice: rawPriceVal,
            minQty,
            maxQty,
            targetType: targetType as any,
            isPrivate: isPrivate === true,
            requirements,
            geo: 'Мир',
            priceUnit: priceUnit || 1000,
            unitName: unitName || 'шт.',
          }
        });

        // 2. Создаем маппинг
        const provider = await tx.provider.findUnique({ where: { id: providerUUID }, select: { projectId: true } });
        const targetProjectId = provider?.projectId || null;

        const existingMapping = await tx.internalServiceMapping.findFirst({
          where: {
            projectId: targetProjectId,
            internalServiceId: id,
            providerId: providerUUID
          }
        });

        if (existingMapping) {
          await tx.internalServiceMapping.update({
            where: { id: existingMapping.id },
            data: {
              priority: 1,
              isActive: true,
              providerServiceId: providerId
            }
          });
        } else {
          await tx.internalServiceMapping.create({
            data: {
              projectId: targetProjectId,
              internalServiceId: id,
              providerServiceId: providerId,
              providerId: providerUUID,
              priority: 1,
              isActive: true
            }
          });
        }

        createdIds.push(id);
      }
      return createdIds;
    });

    return NextResponse.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
