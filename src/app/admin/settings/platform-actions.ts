'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { AdminDataService } from '@/services/admin/admin-data.service';
import { revalidatePath } from 'next/cache';
import { getAdminContext } from '@/utils/admin-context';

export interface PlatformDTO {
    id?: string;
    slug: string;
    name: string;
    nameRu?: string;
    keywords: string[];
    isActive?: boolean;
}

export async function createPlatformAction(data: PlatformDTO) {
    try {
        const ctx = await getAdminContext();
        const res = await AdminDataService.upsertSocialPlatform(ctx, {
            slug: data.slug.toLowerCase().trim(),
            name: data.name,
            nameRu: data.nameRu,
            keywords: data.keywords,
            isActive: true
        });
        if (!res.success) throw new Error(res.error?.message);
        revalidatePath('/admin/settings');
        return { success: true, platform: res.data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updatePlatformAction(id: string, data: Partial<PlatformDTO>) {
    try {
        const ctx = await getAdminContext();
        const res = await AdminDataService.upsertSocialPlatform(ctx, {
            id,
            ...(data.slug && { slug: data.slug.toLowerCase().trim() }),
            ...(data.name && { name: data.name }),
            ...(data.nameRu && { nameRu: data.nameRu }),
            ...(data.keywords && { keywords: data.keywords }),
            ...(data.isActive !== undefined && { isActive: data.isActive })
        });
        if (!res.success) throw new Error(res.error?.message);
        revalidatePath('/admin/settings');
        return { success: true, platform: res.data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function togglePlatformAction(id: string) {
    try {
        const ctx = await getAdminContext();
        const platformsRes = await AdminDataService.getSocialPlatforms(ctx);
        if (!platformsRes.success) throw new Error(platformsRes.error?.message);
        
        const current = platformsRes.data?.find(p => p.id === id);
        if (!current) throw new Error('Platform not found');

        const res = await AdminDataService.upsertSocialPlatform(ctx, {
            id,
            isActive: !current.isActive
        });
        if (!res.success) throw new Error(res.error?.message);
        
        revalidatePath('/admin/settings');
        return { success: true, platform: res.data };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deletePlatformAction(id: string) {
    try {
        const ctx = await getAdminContext();
        const res = await AdminDataService.deleteSocialPlatform(ctx, id);
        if (!res.success) throw new Error(res.error?.message);
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}


