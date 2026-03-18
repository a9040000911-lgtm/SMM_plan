'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getActiveProjectId } from '@/utils/admin-session';
import { sanitizeData } from '@/utils/service-sanitizer';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { getAdminContext } from '@/utils/admin-context';

/**
 * Переключает статус активности услуги.
 */
export async function toggleServiceStatus(serviceId: string, isActive: boolean) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.toggleServiceStatus(ctx, serviceId, isActive);
    if (!result.success) return { success: false, error: result.error.message };
    
    revalidatePath('/admin/services');
    revalidatePath('/admin/services/curator');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Получает историю изменений услуги.
 */
export async function getServiceHistoryAction(serviceId: string) {
  const ctx = await getAdminContext();
  const result = await AdminDataService.getServiceHistory(ctx, serviceId);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

/**
 * Улучшает описание услуги через AI.
 */
export async function enhanceDescriptionAction(serviceId: string, currentDescription: string) {
  const ctx = await getAdminContext();
  const result = await AdminDataService.enhanceDescription(ctx, serviceId, currentDescription);
  if (!result.success) return { success: false, error: result.error.message };
  return { success: true, description: result.data.description };
}

/**
 * Улучшает описания категорий платформы через AI.
 */
export async function enhanceCategoryDescriptionsAction(platform: string) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.enhanceCategoryDescriptions(ctx, platform);
    if (!result.success) return { success: false, error: result.error.message };
    
    revalidatePath('/admin/services');
    return { success: true, count: result.data.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Массовое включение/выключение услуги во ВСЕХ проектах сразу.
 */
export async function bulkToggleServiceForAllProjects(serviceId: string, isActive: boolean) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.bulkToggleServiceForAllProjects(ctx, serviceId, isActive);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, count: result.data.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Массовая установка цены услуги во ВСЕХ проектах сразу.
 */
export async function bulkSetServicePriceForAllProjects(serviceId: string, price: number | null) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.bulkSetServicePriceForAllProjects(ctx, serviceId, price);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, count: result.data.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Обновляет данные услуги.
 */
export async function updateService(serviceId: string, data: any) {
  try {
    const ctx = await getAdminContext();
    const activeProjectId = await getActiveProjectId();
    
    const result = await AdminDataService.updateService(ctx, serviceId, data, activeProjectId || undefined);
    
    if (!result.success) {
      if (result.error?.details?.name === 'ZodError') {
        throw result.error.details;
      }
      throw new Error(result.error.message);
    }

    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${serviceId}`);
    return { success: true } as { success: boolean; error?: string };
  } catch (err: any) {
    if (err.name === 'ZodError') throw err;
    throw err;
  }
}

/**
 * Обновляет вручную созданную услугу.
 */
export async function updateManualServiceAction(serviceId: string, data: any) {
  return updateService(serviceId, data);
}

/**
 * Обновляет переопределение услуги для проекта.
 */
export async function upsertProjectOverrideAction(serviceId: string, projectId: string | null, data: any) {
  try {
    const ctx = await getAdminContext();
    const targetProjectId = projectId || data.projectId || await getActiveProjectId();
    
    const result = await AdminDataService.upsertProjectOverride(ctx, { ...data, internalServiceId: serviceId, projectId: targetProjectId });
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Удаляет услугу. Если услуга привязана к заказам, деактивирует её.
 */
export async function deleteService(serviceId: string) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.deleteService(ctx, serviceId);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, message: result.data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Обновляет привязку к провайдеру.
 */
export async function updateProviderMapping(mappingId: string, data: any) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.updateProviderMapping(ctx, mappingId, data);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Удаляет привязку к провайдеру.
 */
export async function unlinkProviderService(mappingId: string) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.unlinkProviderService(ctx, mappingId);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Синхронизирует цену и данные привязки из API провайдера.
 */
export async function syncProviderMappingAction(mappingId: string) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.syncProviderMapping(ctx, mappingId);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Создает новую привязку к провайдеру.
 */
export async function linkProviderService(internalServiceId: string, providerId: string, providerServiceId: string) {
  try {
    const ctx = await getAdminContext();
    const activeProjectId = await getActiveProjectId();
    const projectId = activeProjectId === 'all' ? null : activeProjectId;

    const result = await AdminDataService.linkProviderService(ctx, internalServiceId, providerId, providerServiceId, projectId);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    revalidatePath(`/admin/services/${internalServiceId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Получает список услуг для инспекции.
 */
export async function getServicesForCurator() {
  const result = await AdminDataService.getServicesForCurator(await getAdminContext());
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

/**
 * Создает новую услугу.
 */
export async function createService(input: FormData | any) {
  try {
    const ctx = await getAdminContext();
    const data = input instanceof FormData ? Object.fromEntries(input.entries()) : input;
    const result = await AdminDataService.createService(ctx, data);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/admin/services');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Создает услугу вручную.
 */
export async function createManualServiceAction(data: any) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.createManualService(ctx, data);
    if (!result.success) return { success: false, error: result.error.message };
    revalidatePath('/admin/services');
    return { success: true, service: result.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Обновляет категорию услуг.
 */
export async function upsertServiceCategoryAction(id: string | undefined, data: any) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.upsertServiceCategory(ctx, id, data);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, data: result.data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Получает список категорий.
 */
export async function getServiceCategories() {
  const ctx = await getAdminContext();
  const projectId = await getActiveProjectId();
  const result = await AdminDataService.getServiceCategories(ctx, projectId || 'all');
  if (!result.success) throw new Error(result.error.message);

  return sanitizeData(result.data);
}

/**
 * Обратная совместимость для компонентов, использующих старое имя
 */
export const getServiceCategoriesAction = getServiceCategories;

/**
 * Получает статистику наценок.
 */
export async function getMarkupStatsAction() {
  const ctx = await getAdminContext();
  const result = await AdminDataService.getMarkupStats(ctx);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

/**
 * Удаляет категорию.
 */
export async function deleteServiceCategoryAction(id: string) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.deleteServiceCategory(ctx, id);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Получает услуги провайдера для импорта.
 */
export async function getProviderServicesForImport(providerId?: string) {
  const ctx = await getAdminContext();
  const result = await AdminDataService.getProviderServicesForImport(ctx, providerId);
  if (!result.success) throw new Error(result.error.message);
  return sanitizeData(result.data);
}

/**
 * Массовый импорт услуг провайдера.
 */
export async function importProviderServicesAction(items: any[], settings: any) {
  try {
    const ctx = await getAdminContext();
    const activeProjectId = await getActiveProjectId();
    const projectId = activeProjectId === 'all' ? undefined : (activeProjectId || undefined);

    const result = await AdminDataService.importProviderServices(ctx, items, settings, projectId);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, count: result.data.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Выполняет интеллектуальный импорт услуг от провайдера.
 */
export async function smartImportProviderServicesAction(items: any[], settings: any) {
  try {
    const _ctx = await getAdminContext();
    const activeProjectId = await getActiveProjectId();
    const projectId = activeProjectId === 'all' ? null : activeProjectId;

    const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');
    const result = await SmartAnalyzerService.bulkImport(items, { ...settings, projectId });
    revalidatePath('/admin/services');
    return { success: true, count: result.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Выполняет массовый умный импорт всех услуг провайдера в конкретный проект.
 */
export async function smartImportFromProviderAction(providerId: string, projectId: string, filters: any) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.smartImportFromProvider(ctx, providerId, projectId, filters);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, count: result.data.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Активирует услугу из мастер-каталога в конкретном проекте.
 */
export async function activateServiceInProject(serviceId: string, projectId: string) {
  await getAdminContext(); // Access check
  const { SmartAnalyzerService } = await import('@/services/providers/smart-analyzer.service');
  const result = await SmartAnalyzerService.activateInProject(serviceId, projectId);

  revalidatePath('/admin/services');
  return { success: true, data: result };
}

/**
 * Получает статус услуги (активна/нет) во всех доступных администратору проектах.
 */
export async function getServiceProjectStatuses(serviceId: string) {
  const ctx = await getAdminContext();
  const result = await AdminDataService.getServiceProjectStatuses(ctx, serviceId);
  if (!result.success) throw new Error(result.error.message);
  return result.data;
}

/**
 * Массово изменяет статус услуги в выбранных проектах.
 */
export async function bulkToggleServiceInProjects(serviceId: string, projectSettings: Record<string, boolean>) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.bulkToggleServiceInProjects(ctx, serviceId, projectSettings);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Запускает полную синхронизацию всех услуг.
 */
export async function syncAllServicesAction() {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.syncAllServices(ctx);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, updatedCount: result.data.updatedCount };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Восстанавливает категории услуг.
 */
export async function repairCategoriesAction(projectId: string | null) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.repairCategories(ctx, projectId);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, count: result.data.count };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Массовое удаление услуг.
 */
export async function bulkDeleteServicesAction(ids: string[]) {
  try {
    const ctx = await getAdminContext();
    const result = await AdminDataService.bulkDeleteServices(ctx, ids);
    if (!result.success) return { success: false, error: result.error.message };

    revalidatePath('/admin/services');
    return { success: true, deleted: result.data.deleted, deactivated: result.data.deactivated };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}


