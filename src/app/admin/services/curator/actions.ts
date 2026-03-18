'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

async function getCtx(): Promise<AdminContext> {
  const session = await getAdminSession();
  if (!session) throw new Error('Unauthorized');
  return {
    userId: session.id,
    role: session.role as any,
    allowedProjects: session.allowedProjects,
    isGlobalAdmin: session.isGlobalAdmin
  };
}

export interface ServiceFilter {
    search?: string;
    provider?: string;
    platform?: string;
    category?: string;
    priceMin?: number;
    priceMax?: number;
    showIgnored?: boolean;
    page?: number;
    limit?: number;
}

export async function getProviderServicesAction(filter: ServiceFilter) {
    const ctx = await getCtx();
    const result = await AdminDataService.getProviderServices(ctx, filter);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

export async function ignoreServicesAction(ids: number[], providerName: string) {
    const ctx = await getCtx();
    const result = await AdminDataService.ignoreProviderServices(ctx, ids.map(String), providerName);
    if (!result.success) throw new Error(result.error.message);
    
    revalidatePath('/admin/services/curator');
}

export interface ImportConfig {
    markupPercent: number;
    platform: string;
    category: string;
    targetType: string;
}

export async function importServicesAction(selectedServices: any[], config: ImportConfig) {
    const ctx = await getCtx();
    const result = await AdminDataService.importProviderServices(ctx, selectedServices, config);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/services/curator');
    return { success: true, importedCount: result.data.count };
}


