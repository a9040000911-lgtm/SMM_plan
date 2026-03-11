'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
// Old Enum, checking if needed.
// Actually we use 'SocialPlatform' model now.

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
        const platform = await prisma.socialPlatform.create({
            data: {
                slug: data.slug.toLowerCase().trim(),
                name: data.name,
                nameRu: data.nameRu,
                keywords: data.keywords,
                isActive: true
            }
        });
        revalidatePath('/admin/settings');
        return { success: true, platform };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function updatePlatformAction(id: string, data: Partial<PlatformDTO>) {
    try {
        const platform = await prisma.socialPlatform.update({
            where: { id },
            data: {
                ...(data.slug && { slug: data.slug.toLowerCase().trim() }),
                ...(data.name && { name: data.name }),
                ...(data.nameRu && { nameRu: data.nameRu }),
                ...(data.keywords && { keywords: data.keywords }),
                ...(data.isActive !== undefined && { isActive: data.isActive })
            }
        });
        revalidatePath('/admin/settings');
        return { success: true, platform };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function togglePlatformAction(id: string) {
    try {
        const current = await prisma.socialPlatform.findUnique({ where: { id } });
        if (!current) throw new Error('Platform not found');

        const platform = await prisma.socialPlatform.update({
            where: { id },
            data: { isActive: !current.isActive }
        });
        revalidatePath('/admin/settings');
        return { success: true, platform };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function deletePlatformAction(id: string) {
    try {
        await prisma.socialPlatform.delete({ where: { id } });
        revalidatePath('/admin/settings');
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
