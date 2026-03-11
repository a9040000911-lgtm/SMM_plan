'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { DescriptionGeneratorService } from '@/services/ai/description-generator.service';
import { revalidatePath } from 'next/cache';
import { Decimal } from 'decimal.js';
import { SmartSyncService } from '@/services/providers/smart-sync.service';
import { getAdminSession } from '@/utils/admin-session';
import { getActiveProjectId } from '@/utils/project-resolver';
import { sanitizeData } from '@/utils/service-sanitizer';
import { ProviderService } from '@/services/providers/provider.service';
import { PricingService } from '@/services/finance/pricing.service';
import { CurrencyService } from '@/services/finance/currency.service';
import { z } from 'zod';
import { CATEGORY_DISPLAY_NAMES, CATEGORY_ICONS } from '@/utils/category-metadata';

async function requireSupportOrAdmin() {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Unauthorized: Session not found");
  }
  if (!['ADMIN', 'SUPPORT'].includes(session.role)) {
    throw new Error(`Forbidden: Role ${session.role} is not authorized for this action`);
  }
  return session;
}

/**
 * Вспомогательная функция для логирования изменений услуги.
 */
async function logServiceChange(tx: any, serviceId: string, type: string, oldValue: string | null, newValue: string | null, reason: string = 'Админ-панель') {
  await tx.serviceChangeLog.create({
    data: {
      internalServiceId: serviceId,
      type,
      oldValue,
      newValue,
      reason
    }
  });
}

/**
 * Переключает статус активности услуги.
 */
export async function toggleServiceStatus(serviceId: string, isActive: boolean) {
  await requireSupportOrAdmin();

  try {
    await prisma.internalService.update({
      where: { id: serviceId },
      data: { isActive: isActive }
    });
    revalidatePath('/admin/services');
    revalidatePath('/admin/services/curator');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to toggle service status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Массовое включение/выключение услуги во ВСЕХ проектах сразу.
 */
export async function bulkToggleServiceForAllProjects(serviceId: string, isActive: boolean) {
  await requireSupportOrAdmin();

  try {
    const projects = await prisma.project.findMany({ select: { id: true } });

    await Promise.all(projects.map(project =>
      prisma.projectServiceOverride.upsert({
        where: {
          projectId_internalServiceId: {
            projectId: project.id,
            internalServiceId: serviceId
          }
        },
        update: { isActive },
        create: {
          projectId: project.id,
          internalServiceId: serviceId,
          isActive
        }
      })
    ));

    revalidatePath('/admin/services');
    return { success: true, count: projects.length };
  } catch (error: any) {
    console.error('Failed to bulk toggle service:', error);
    return { success: false, error: error.message };
  }
}

const ServiceUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  pricePer1000: z.number().positive('Price must be positive').optional(),
  minQty: z.number().int().positive().optional(),
  maxQty: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  platform: z.string().optional(),
  category: z.string().optional(),
  categoryId: z.string().nullable().optional(),
  targetType: z.string().optional(),
  allowedTargetTypes: z.array(z.string()).optional(),
  requirements: z.string().optional(),
  marketPrice: z.number().nullable().optional(),
  markup: z.number().min(0).max(15000).optional(),
  avgCompletionTime: z.number().optional(),
});

/**
 * Обновляет данные услуги.
 */
export async function updateService(serviceId: string, data: any) {
  const session = await requireSupportOrAdmin();

  try {
    const validatedData = ServiceUpdateSchema.parse(data) as any;

    if (session.role === 'SEO') {
      const allowedFields = ['name', 'description', 'requirements'];
      const attemptedFields = Object.keys(data);
      const forbiddenFields = attemptedFields.filter(f => !allowedFields.includes(f));
      if (forbiddenFields.length > 0) {
        throw new Error(`Forbidden: Role ${session.role} is not authorized to update fields: ${forbiddenFields.join(', ')}`);
      }
    }

    // Logic for automatic price calculation based on Pricing Ladder
    if (validatedData.markup !== undefined || validatedData.pricePer1000 === undefined) {
      const service = await prisma.internalService.findUnique({
        where: { id: serviceId },
        select: { lastProviderPrice: true, category: true, platform: true }
      });

      if (service?.lastProviderPrice && validatedData.markup !== undefined) {
        // If markup is manually provided, we still use calculateRetailPrice but it might need to respect the markup
        // However, the goal is to shift to the LADDER. 
        // For now, let's ensure calculateRetailPrice is the source of truth.
        const activeProjectId = await getActiveProjectId();
        validatedData.pricePer1000 = await PricingService.calculateRetailPrice(service.lastProviderPrice, {
          category: service.category,
          projectId: session.role === 'ADMIN' ? undefined : (activeProjectId || undefined)
        });
      }
    }

    const updateData: any = { ...validatedData };
    if (updateData.pricePer1000) updateData.pricePer1000 = new Decimal(updateData.pricePer1000);
    if (updateData.marketPrice !== undefined) updateData.marketPrice = updateData.marketPrice ? new Decimal(updateData.marketPrice) : null;
    if (updateData.categoryId === '') updateData.categoryId = null;

    delete (updateData as any).id;

    const oldService = await prisma.internalService.findUnique({
      where: { id: serviceId },
      select: { pricePer1000: true, markup: true }
    });

    const activeProjectId = await getActiveProjectId();
    const isProjectScope = activeProjectId && activeProjectId !== 'all';

    await prisma.$transaction(async (tx) => {
      const globalUpdateData = { ...updateData };

      // If we are in project scope, we handle categoryId as an override
      if (isProjectScope && updateData.categoryId !== undefined) {
        delete globalUpdateData.categoryId;

        await tx.projectServiceOverride.upsert({
          where: {
            projectId_internalServiceId: {
              projectId: activeProjectId,
              internalServiceId: serviceId
            }
          },
          update: { categoryId: updateData.categoryId },
          create: {
            projectId: activeProjectId,
            internalServiceId: serviceId,
            categoryId: updateData.categoryId,
            isActive: true
          }
        });
      }

      await tx.internalService.update({
        where: { id: serviceId },
        data: {
          ...globalUpdateData,
          requirements: globalUpdateData.requirements || undefined,
          description: globalUpdateData.description || undefined,
        }
      });

      // Log price change
      if (updateData.pricePer1000 && !new Decimal(updateData.pricePer1000).equals(oldService?.pricePer1000 || 0)) {
        await logServiceChange(tx, serviceId, 'PRICE_CHANGE', oldService?.pricePer1000?.toString() || '0', updateData.pricePer1000.toString(), 'Ручное обновление');
      }

      // Log markup change
      if (updateData.markup !== undefined && Number(updateData.markup) !== Number(oldService?.markup || 0)) {
        await logServiceChange(tx, serviceId, 'MARKUP_CHANGE', oldService?.markup?.toString() || '0', updateData.markup.toString(), 'Ручное обновление');
      }
    });

    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${serviceId}`);
    return { success: true };
  } catch (error: any) {
    if (error.name === 'ZodError') throw error;
    console.error("Update Action Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Удаляет услугу. Если услуга привязана к заказам, деактивирует её.
 */
export async function deleteService(serviceId: string) {
  await requireSupportOrAdmin();

  try {
    // Проверяем наличие заказов
    const ordersCount = await prisma.order.count({ where: { internalServiceId: serviceId } });

    if (ordersCount > 0) {
      await prisma.internalService.update({
        where: { id: serviceId },
        data: { isActive: false }
      });
      revalidatePath('/admin/services');
      return { success: true, message: 'Услуга деактивирована (есть заказы).' };
    }

    await prisma.internalService.delete({ where: { id: serviceId } });
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: any) {
    console.error('Delete Service Error:', error);
    return { success: false, error: 'Не удалось удалить услугу.' };
  }
}

/**
 * Обновляет привязку к провайдеру.
 */
export async function updateProviderMapping(mappingId: string, data: any) {
  await requireSupportOrAdmin();

  try {
    await prisma.internalServiceMapping.update({
      where: { id: mappingId },
      data: data
    });
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Удаляет привязку к провайдеру.
 */
export async function unlinkProviderService(mappingId: string) {
  await requireSupportOrAdmin();

  try {
    await prisma.internalServiceMapping.delete({ where: { id: mappingId } });
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Создает новую привязку к провайдеру.
 */
export async function linkProviderService(internalServiceId: string, providerId: string, providerServiceId: string) {
  await requireSupportOrAdmin();
  const activeProjectId = await getActiveProjectId();
  const projectId = activeProjectId === 'all' ? null : activeProjectId;

  try {
    await prisma.internalServiceMapping.create({
      data: {
        internalServiceId,
        providerId,
        providerServiceId: providerServiceId,
        projectId: projectId,
        priority: 99,
        isActive: true
      }
    });
    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${internalServiceId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Link Provider Service Error:', error);
    return { success: false, error: error.message };
  }
}



/**
 * Получает список услуг для инспекции.
 */
export async function getServicesForCurator() {
  await requireSupportOrAdmin();
  try {
    const services = await prisma.internalService.findMany({
      include: {
        providerMappings: { include: { provider: true, providerService: true } },
      },
      orderBy: [{ platform: 'asc' }, { category: 'asc' }, { rating: 'desc' }]
    });
    return JSON.parse(JSON.stringify(services));
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Создает новую услугу.
 */
export async function createService(input: FormData | any) {
  await requireSupportOrAdmin();
  try {
    const data = input instanceof FormData ? Object.fromEntries(input.entries()) : input;
    const price = data.pricePer1000 ? new Decimal(data.pricePer1000) : new Decimal(0);
    const serviceId = (data.id as string) || Math.floor(Math.random() * 10000).toString();

    await prisma.internalService.create({
      data: {
        id: serviceId,
        slug: (data.slug as string) || (data.name as string)?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'service',
        name: data.name as string,
        description: data.description as string,
        pricePer1000: price,
        minQty: Number(data.minQty || 10),
        maxQty: Number(data.maxQty || 100000),
        type: (data.type as any) || 'REGULAR',
        category: data.category as any,
        platform: data.platform as any,
        targetType: (data.targetType as string) || 'ALL',
        allowedTargetTypes: Array.isArray(data.allowedTargetTypes) ? data.allowedTargetTypes : [],
        isActive: data.isActive === 'true' || data.isActive === true,
        priceUnit: 1000,
        unitName: 'шт',
        geo: 'Mixed',
      }
    });
    revalidatePath('/admin/services');
  } catch (error: any) {
    throw new Error(error.message);
  }
}

/**
 * Создает услугу вручную.
 */
export async function createManualServiceAction(data: {
  id: string,
  name: string,
  description: string,
  requirements: string,
  pricePer1000: number,
  minQty: number,
  maxQty: number,
  platform: any,
  category: any,
  targetType: string,
  allowedTargetTypes?: string[],
  mappings: Array<{ providerId: string, providerServiceId: string, priority: number }>
}) {
  await requireSupportOrAdmin();
  try {
    const service = await prisma.internalService.create({
      data: {
        id: data.id,
        slug: data.id,
        name: data.name,
        description: data.description,
        requirements: data.requirements,
        pricePer1000: new Decimal(data.pricePer1000),
        minQty: data.minQty,
        maxQty: data.maxQty,
        platform: data.platform,
        category: data.category,
        targetType: data.targetType,
        allowedTargetTypes: data.allowedTargetTypes || [],
        isActive: true,
        geo: 'Mixed',
        providerMappings: {
          create: data.mappings.map(m => ({
            providerId: m.providerId,
            providerServiceId: m.providerServiceId,
            priority: m.priority,
            isActive: true,
            projectId: null // Global or handle as needed
          }))
        }
      }
    });
    revalidatePath('/admin/services');
    return { success: true, service };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Обновляет услугу, созданную вручную.
 */
export async function updateManualServiceAction(serviceId: string, data: any) {
  await requireSupportOrAdmin();
  try {
    const updateData = { ...data };
    if (updateData.pricePer1000) updateData.pricePer1000 = new Decimal(updateData.pricePer1000);

    // Handle mappings separately or as part of the update
    const mappings = updateData.mappings;
    delete updateData.mappings;

    await prisma.internalService.update({
      where: { id: serviceId },
      data: updateData
    });

    if (mappings) {
      // Logic to sync mappings if needed
    }

    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${serviceId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Обновляет категорию услуг.
 */
export async function upsertServiceCategoryAction(id: string | undefined, data: {
  name: string,
  platform: any,
  categoryType?: any,
  targetType?: string,
  description?: string,
  priority?: number,
  projectId?: string,
  icon?: string,
  slug?: string
}) {
  await requireSupportOrAdmin();
  const activeProjectId = await getActiveProjectId();
  const finalProjectId = data.projectId || activeProjectId;

  // Generate slug if not provided
  const slug = data.slug || data.name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const payload = {
    name: data.name,
    slug: slug,
    platform: data.platform,
    categoryType: data.categoryType || 'OTHER',
    targetType: data.targetType || 'POST',
    description: data.description || null,
    priority: data.priority || 0,
    icon: data.icon || null
  };

  if (id) {
    const existing = await prisma.serviceCategory.findUnique({ where: { id } });

    // If editing a global category while in a project context, create a NEW project-specific category
    // This implements "Shadowing/Copy-on-write" isolation
    if (existing && existing.projectId === null && finalProjectId && finalProjectId !== 'all') {
      return await prisma.serviceCategory.create({
        data: {
          ...payload,
          projectId: finalProjectId
        }
      });
    }

    return await prisma.serviceCategory.update({
      where: { id },
      data: payload
    });
  } else {
    // Check if category with this name/platform already exists in project to avoid P2002
    const targetProjectId = finalProjectId === 'all' ? null : (finalProjectId || null);
    const existing = await prisma.serviceCategory.findFirst({
      where: {
        projectId: targetProjectId,
        platform: data.platform,
        name: data.name
      }
    });

    if (existing) {
      return await prisma.serviceCategory.update({
        where: { id: existing.id },
        data: payload
      });
    }

    return await prisma.serviceCategory.create({
      data: { ...payload, projectId: targetProjectId }
    });
  }
}

export async function getServiceCategoriesAction() {
  await requireSupportOrAdmin();
  const projectId = await getActiveProjectId();

  const where: any = {};
  if (projectId === 'all') {
    where.projectId = null;
  } else if (projectId) {
    where.projectId = projectId;
  }

  const categories = await prisma.serviceCategory.findMany({
    where,
    orderBy: { priority: 'asc' },
    include: { _count: { select: { internalServices: true } } }
  });
  return sanitizeData(categories);
}

export async function deleteServiceCategoryAction(id: string) {
  await requireSupportOrAdmin();
  try {
    const count = await prisma.internalService.count({ where: { categoryId: id } });
    if (count > 0) return { success: false, error: 'Нельзя удалить категорию с услугами' };
    await prisma.serviceCategory.delete({ where: { id } });
    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getProviderServicesForImport(providerId?: string) {
  await requireSupportOrAdmin();
  const services = await prisma.providerService.findMany({
    where: { isIgnored: false, ...(providerId ? { providerId } : {}) },
    include: { provider: { select: { name: true } } },
    orderBy: [{ providerId: 'asc' }, { name: 'asc' }]
  });
  return sanitizeData(services);
}

export async function importProviderServicesAction(
  items: Array<{ providerId: string, serviceId: number, name: string, rawPrice: number }>,
  settings: { categoryId: string, platform: any, targetType: string, priceMultiplier: number }
) {
  await requireSupportOrAdmin();
  const activeProjectId = await getActiveProjectId();

  try {
    const categoryData = await prisma.serviceCategory.findUnique({ where: { id: settings.categoryId } });
    const categoryEnum = categoryData?.categoryType || 'OTHER';
    const projectId = categoryData?.projectId || (activeProjectId !== 'all' ? activeProjectId : null);

    for (const item of items) {
      const existingMap = await prisma.internalServiceMapping.findFirst({
        where: { providerId: item.providerId, providerServiceId: item.serviceId.toString() }
      });
      const internalId = existingMap ? existingMap.internalServiceId : crypto.randomUUID();
      const finalPrice = new Decimal(item.rawPrice).mul(settings.priceMultiplier);

      // 1. Upsert Internal Service
      await prisma.internalService.upsert({
        where: { id: internalId },
        update: {
          serviceCategory: { connect: { id: settings.categoryId } },
          category: categoryEnum,
          pricePer1000: finalPrice,
          lastProviderPrice: new Decimal(item.rawPrice),
          isActive: true
        },
        create: {
          id: internalId,
          slug: internalId,
          name: item.name,
          description: `Imported via Standard Import`,
          pricePer1000: finalPrice,
          lastProviderPrice: new Decimal(item.rawPrice),
          minQty: 10,
          maxQty: 100000,
          platform: settings.platform,
          serviceCategory: { connect: { id: settings.categoryId } },
          category: categoryEnum,
          geo: 'Global',
          targetType: settings.targetType,
          isActive: true
        }
      });

      // 2. Sync Mapping separately to ensure it exists even if service was updated
      const mappingData = {
        projectId: projectId,
        internalServiceId: internalId,
        providerId: item.providerId,
        providerServiceId: item.serviceId.toString(),
      };

      const existingMapping = await prisma.internalServiceMapping.findFirst({
        where: {
          projectId: mappingData.projectId,
          internalServiceId: mappingData.internalServiceId,
          providerId: mappingData.providerId
        }
      });

      if (existingMapping) {
        await prisma.internalServiceMapping.update({
          where: { id: existingMapping.id },
          data: {
            providerServiceId: mappingData.providerServiceId,
            priority: 1,
            isActive: true
          }
        });
      } else {
        await prisma.internalServiceMapping.create({
          data: {
            ...mappingData,
            priority: 1,
            isActive: true
          }
        });
      }
    }
    revalidatePath('/admin/services');
    return { success: true, count: items.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Выполняет интеллектуальный импорт услуг от провайдера.
 */
export async function smartImportProviderServicesAction(
  items: any[],
  settings: { priceMultiplier: number }
) {
  await requireSupportOrAdmin();
  const activeProjectId = await getActiveProjectId();
  const projectId = activeProjectId === 'all' ? null : activeProjectId;

  try {
    const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');
    const result = await SmartAnalyzerService.bulkImport(items, { ...settings, projectId });
    revalidatePath('/admin/services');
    return { success: true, count: result.count };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Выполняет массовый умный импорт всех услуг провайдера в конкретный проект.
 */
export async function smartImportFromProviderAction(providerId: string, projectId: string, filters: { include?: string, exclude?: string }) {
  await requireSupportOrAdmin();
  try {
    const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');

    // 1. Получаем все услуги провайдера из нашей БД
    const providerServices = await prisma.providerService.findMany({
      where: { providerId, isIgnored: false }
    });

    // 2. Применяем фильтры
    const includeTerms = filters.include?.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) || [];
    const excludeTerms = filters.exclude?.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) || [];

    const filtered = providerServices.filter(s => {
      const name = s.name.toLowerCase();
      const matchesInclude = includeTerms.length === 0 || includeTerms.some(t => name.includes(t));
      const matchesExclude = excludeTerms.length > 0 && excludeTerms.some(t => name.includes(t));
      return matchesInclude && !matchesExclude;
    });

    if (filtered.length === 0) return { success: true, count: 0 };

    // 3. Импортируем в мастер-каталог и активируем в проекте
    let count = 0;
    for (const ps of filtered) {
      const internalSvc = await SmartAnalyzerService.importSingle(providerId, ps.id);
      await activateServiceInProject(internalSvc.id, projectId);
      count++;
    }

    revalidatePath('/admin/services');
    return { success: true, count };
  } catch (error: any) {
    console.error('Smart bulk import failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Активирует услугу из мастер-каталога в конкретном проекте.
 * Автоматически создает категорию, если её нет в проекте.
 */
export async function activateServiceInProject(serviceId: string, projectId: string) {
  await requireSupportOrAdmin();

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Получаем данные об услуге, чтобы знать платформу и тип
      const service = await tx.internalService.findUnique({
        where: { id: serviceId },
        select: { platform: true, category: true, targetType: true }
      });

      if (!service) throw new Error('Service not found');

      // 2. Ищем существующую категорию в проекте по типу
      let category = await tx.serviceCategory.findFirst({
        where: {
          projectId,
          platform: service.platform,
          categoryType: service.category
        }
      });

      // 3. Если категории нет - создаем её
      if (!category) {
        const name = CATEGORY_DISPLAY_NAMES[service.category as any] || service.category;
        const icon = CATEGORY_ICONS[service.category as any] || 'layers';

        category = await tx.serviceCategory.create({
          data: {
            projectId,
            platform: service.platform,
            categoryType: service.category,
            name: name,
            icon: icon,
            targetType: service.targetType,
            priority: 0
          }
        });
      }

      // 4. Создаем/обновляем оверрайд (активация)
      return tx.projectServiceOverride.upsert({
        where: {
          projectId_internalServiceId: {
            projectId,
            internalServiceId: serviceId
          }
        },
        update: {
          isActive: true
        },
        create: {
          projectId,
          internalServiceId: serviceId,
          isActive: true,
          categoryId: category.id
        }
      });
    });

    revalidatePath('/admin/services');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to activate service in project:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Синхронизирует конкретную привязку к провайдеру в реальном времени.
 */
export async function syncProviderMappingAction(mappingId: string) {
  await requireSupportOrAdmin();

  try {
    const mapping = await prisma.internalServiceMapping.findUnique({
      where: { id: mappingId },
      include: { provider: true }
    });

    if (!mapping) throw new Error('Mapping not found');

    const instance = await ProviderService.getInstance(mapping.providerId);
    if (!instance) throw new Error('Provider instance not available');

    const services = await instance.getServices();

    // We need the externalId from the storedProviderService to compare correctly
    const storedProviderSvc = await prisma.providerService.findUnique({
      where: { id: mapping.providerServiceId }
    });

    if (!storedProviderSvc) throw new Error('Provider service not found');

    const remoteSvcFinal = services.find((s: any) => String(s.service) === storedProviderSvc.externalId);

    if (!remoteSvcFinal) throw new Error('Service no longer exists on provider side');

    const meta = mapping.provider.metadata as any;
    const currency = (meta?.pricesCurrency || meta?.currency || (mapping.provider.type === 'stream-promotion' ? 'USD' : 'RUB')) as any;

    const convertedPrice = await CurrencyService.convert(new Decimal(remoteSvcFinal.rate), currency, 'RUB');

    await prisma.providerService.update({
      where: { id: mapping.providerServiceId },
      data: {
        rawPrice: convertedPrice,
        name: remoteSvcFinal.name,
        rawData: remoteSvcFinal,
        lastSeenAt: new Date()
      }
    });

    if (mapping.priority === 1 && mapping.isActive) {
      const internalSvc = await prisma.internalService.findUnique({
        where: { id: mapping.internalServiceId },
        select: { markup: true, category: true }
      });

      const cost = convertedPrice;

      const newGlobalPrice = await PricingService.calculateRetailPrice(cost, {
        providerName: mapping.provider.name,
        category: internalSvc?.category || 'OTHER'
      });

      await prisma.internalService.update({
        where: { id: mapping.internalServiceId },
        data: { lastProviderPrice: convertedPrice, pricePer1000: newGlobalPrice }
      });

      // Update project overrides if they exist and don't have custom prices
      const projectOverrides = await prisma.projectServiceOverride.findMany({
        where: { internalServiceId: mapping.internalServiceId, customPrice: null },
        include: { project: { select: { markup: true } } }
      });

      await Promise.all(projectOverrides.map(async (override) => {
        const projectMarkup = override.project?.markup ? Number(override.project.markup) : 0;

        // Apply projects-specific floor
        const projectMultiplier = Math.max(1 + projectMarkup / 100, 1.5);
        const newProjectPrice = new Decimal(cost).mul(projectMultiplier);

        await prisma.projectServiceOverride.update({
          where: { id: override.id },
          data: { customPrice: newProjectPrice }
        });
      }));
    }

    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${mapping.internalServiceId}`);
    return { success: true };
  } catch (error: any) {
    console.error('Failed to sync mapping:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkSetServicePriceForAllProjects(serviceId: string, customPrice: number | null) {
  await requireSupportOrAdmin();
  try {
    const projects = await prisma.project.findMany({ select: { id: true } });

    const operations = projects.map(p => prisma.projectServiceOverride.upsert({
      where: {
        projectId_internalServiceId: {
          projectId: p.id,
          internalServiceId: serviceId
        }
      },
      update: {
        customPrice: customPrice ? new Decimal(customPrice) : null
      },
      create: {
        projectId: p.id,
        internalServiceId: serviceId,
        customPrice: customPrice ? new Decimal(customPrice) : null,
        isActive: true // Default to active if creating from bulk
      }
    }));

    await prisma.$transaction(operations);
    revalidatePath('/admin/services');
    return { success: true, count: projects.length };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Получает аналитику наценок для суперадмина.
 */
export async function getMarkupStatsAction() {
  await requireSupportOrAdmin();
  try {
    return await PricingService.getMarkupAnalytics();
  } catch (error: any) {
    console.error('Failed to get markup stats:', error);
    return { stats: null, extremeServices: [] };
  }
}

/**
 * Обновляет оверрайд проекта
 */
export async function upsertProjectOverrideAction(projectId: string, serviceId: string, data: {
  customPrice?: number | null,
  customName?: string | null,
  customDescription?: string | null,
  customRequirements?: string | null,
  customMinQty?: number | null,
  customMaxQty?: number | null,
  isActive?: boolean
}) {
  await requireSupportOrAdmin();

  try {
    const updateData: any = { ...data };
    if (updateData.customPrice !== undefined) updateData.customPrice = updateData.customPrice ? new Decimal(updateData.customPrice) : null;

    const result = await prisma.projectServiceOverride.upsert({
      where: {
        projectId_internalServiceId: {
          projectId,
          internalServiceId: serviceId
        }
      },
      update: updateData,
      create: {
        projectId,
        internalServiceId: serviceId,
        isActive: true, // Default to true if creating
        ...updateData
      }
    });

    revalidatePath('/admin/services');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('Failed to upsert project override:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Автоматически создает недостающие категории для проекта или глобально.
 */
export async function repairCategoriesAction(projectId: string | null) {
  await requireSupportOrAdmin();

  try {
    // Use shared metadata from utility

    // 1. Get all unique platform/category pairs from services
    const services = await prisma.internalService.findMany({
      select: { platform: true, category: true, targetType: true }
    });

    const uniquePairs = new Set<string>();
    services.forEach(s => {
      uniquePairs.add(`${s.platform}:${s.category}:${s.targetType}`);
    });

    let createdCount = 0;
    for (const pair of uniquePairs) {
      const [platform, categoryType, targetType] = pair.split(':');

      const exists = await prisma.serviceCategory.findFirst({
        where: {
          projectId: projectId || null,
          platform: platform as any,
          categoryType: categoryType as any
        }
      });

      if (!exists) {
        await prisma.serviceCategory.create({
          data: {
            projectId: projectId || null,
            platform: platform as any,
            categoryType: categoryType as any,
            name: CATEGORY_DISPLAY_NAMES[categoryType as any] || categoryType,
            icon: CATEGORY_ICONS[categoryType as any] || 'layers',
            targetType: targetType || 'ALL',
            priority: 0
          }
        });
        createdCount++;
      }
    }

    revalidatePath('/admin/services');
    return { success: true, count: createdCount };
  } catch (error: any) {
    console.error('Failed to repair categories:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Унифицированное обновление услуги (глобально или проектный оверрайд).
 */
export async function updateUnifiedServiceAction(
  serviceId: string,
  projectId: string | null,
  data: {
    price?: number,
    isActive?: boolean,
    name?: string,
    description?: string,
    requirements?: string
  }
) {
  await requireSupportOrAdmin();

  try {
    if (!projectId || projectId === 'all') {
      // Global Update
      const updateData: any = {};
      if (data.price !== undefined) updateData.pricePer1000 = new Decimal(data.price);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.requirements !== undefined) updateData.requirements = data.requirements;

      await prisma.internalService.update({
        where: { id: serviceId },
        data: updateData
      });
    } else {
      // Project Override
      const overrideData: any = {};
      if (data.price !== undefined) overrideData.customPrice = new Decimal(data.price);
      if (data.isActive !== undefined) overrideData.isActive = data.isActive;
      if (data.name !== undefined) overrideData.customName = data.name;
      if (data.description !== undefined) overrideData.customDescription = data.description;
      if (data.requirements !== undefined) overrideData.customRequirements = data.requirements;

      await prisma.projectServiceOverride.upsert({
        where: {
          projectId_internalServiceId: {
            projectId,
            internalServiceId: serviceId
          }
        },
        update: overrideData,
        create: {
          projectId,
          internalServiceId: serviceId,
          ...overrideData
        }
      });
    }

    revalidatePath('/admin/services');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update unified service:', error);
    return { success: false, error: error.message };
  }
}

export async function syncAllServicesAction() {
  try {
    await requireSupportOrAdmin();
    const result = await SmartSyncService.syncPricesAndMarkup();
    revalidatePath('/admin/services');
    return { success: true, ...result };
  } catch (error: any) {
    console.error('Failed to sync services:', error);
    return { success: false, error: error.message };
  }
}

export async function bulkDeleteServicesAction(ids: string[]) {
  try {
    await requireSupportOrAdmin();

    // 1. Находим услуги, у которых есть заказы
    const serviceWithOrders = await prisma.order.findMany({
      where: { internalServiceId: { in: ids } },
      select: { internalServiceId: true }
    });

    const idsWithOrders = new Set(serviceWithOrders.map(o => o.internalServiceId));
    const idsToDelete = ids.filter(id => !idsWithOrders.has(id));
    const idsToDeactivate = Array.from(idsWithOrders);

    // 2. Удаляем чистые услуги
    if (idsToDelete.length > 0) {
      await prisma.internalService.deleteMany({
        where: { id: { in: idsToDelete } }
      });
    }

    // 3. Деактивируем услуги с заказами
    if (idsToDeactivate.length > 0) {
      await prisma.internalService.updateMany({
        where: { id: { in: idsToDeactivate } },
        data: { isActive: false }
      });
    }

    revalidatePath('/admin/services');
    return {
      success: true,
      deleted: idsToDelete.length,
      deactivated: idsToDeactivate.length
    };
  } catch (error: any) {
    console.error('Bulk Delete Error:', error);
    return { success: false, error: error.message };
  }
}


/**
 * Улучшает описание услуги с помощью AI.
 */
export async function enhanceDescriptionAction(serviceId: string, currentDescription: string) {
  await requireSupportOrAdmin();

  try {
    const service = await prisma.internalService.findUnique({
      where: { id: serviceId },
      include: {
        providerMappings: {
          where: { isActive: true },
          orderBy: { priority: 'asc' },
          take: 1,
          include: {
            providerService: {
              select: { description: true }
            }
          }
        }
      }
    });

    if (!service) throw new Error('Service not found');

    const providerDescription = service.providerMappings[0]?.providerService?.description || '';

    const enhanced = await DescriptionGeneratorService.enhanceDescription({
      name: service.name,
      currentDescription,
      providerDescription
    });

    return { success: true, description: enhanced };
  } catch (error: any) {
    console.error('Enhance Description Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Улучшает описания ВСЕХ услуг в категории с помощью AI.
 * Это ресурсозатратная операция, поэтому выполняется последовательно.
 */
export async function enhanceCategoryDescriptionsAction(categoryId: string) {
  await requireSupportOrAdmin();

  try {
    const services = await prisma.internalService.findMany({
      where: { categoryId },
      include: {
        providerMappings: {
          where: { isActive: true },
          orderBy: { priority: 'asc' },
          take: 1,
          include: {
            providerService: { select: { description: true } }
          }
        }
      }
    });

    if (services.length === 0) return { success: true, count: 0 };

    let count = 0;
    for (const service of services) {
      try {
        const providerDescription = service.providerMappings[0]?.providerService?.description || '';
        const enhanced = await DescriptionGeneratorService.enhanceDescription({
          name: service.name,
          currentDescription: service.description,
          providerDescription
        });

        await prisma.internalService.update({
          where: { id: service.id },
          data: { description: enhanced }
        });
        count++;
      } catch (err) {
        console.error(`Failed to enhance service ${service.id}:`, err);
      }
    }

    revalidatePath('/admin/services');
    return { success: true, count };
  } catch (error: any) {
    console.error('Bulk Enhance Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Получает историю изменений услуги.
 */
export async function getServiceHistoryAction(serviceId: string) {
  await requireSupportOrAdmin();
  try {
    const logs = await prisma.serviceChangeLog.findMany({
      where: { internalServiceId: serviceId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return sanitizeData(logs);
  } catch (error: any) {
    console.error('Failed to get service history:', error);
    return [];
  }
}
