'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 */
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { prisma } from '@/lib/prisma';
import { Category } from '@/types/enums';

async function checkAdmin() {
    const session = await getAdminSession();
    if (!session || !session.isGlobalAdmin) throw new Error('Unauthorized');
    return session;
}

export async function getDictionaries() {
    await checkAdmin();
    // Use any typing to avoid local TS errors when Prisma client isn't regenerated yet
    const prismaAny = prisma as any;
    const keywords = (await prismaAny.parserDictionary?.findMany({
        orderBy: { createdAt: 'desc' }
    })) || [];
    const providerRules = (await prismaAny.providerCategoryRule?.findMany({
        orderBy: { createdAt: 'desc' }
    })) || [];
    return { keywords, providerRules };
}

export async function addKeyword(data: { keyword: string; category: Category; weight: number; isNegative: boolean }) {
    await checkAdmin();
    const prismaAny = prisma as any;
    
    // Check if exists
    const exists = await prismaAny.parserDictionary.findFirst({
        where: { keyword: data.keyword.toLowerCase() }
    });
    if (exists) throw new Error('Ключевое слово уже существует');

    await prismaAny.parserDictionary.create({
        data: {
            id: crypto.randomUUID(),
            keyword: data.keyword.toLowerCase(),
            category: data.category,
            weight: data.weight,
            isNegative: data.isNegative,
            updatedAt: new Date()
        }
    });
    revalidatePath('/admin/services/dictionaries');
}

export async function deleteKeyword(id: string) {
    await checkAdmin();
    const prismaAny = prisma as any;
    await prismaAny.parserDictionary.delete({ where: { id } });
    revalidatePath('/admin/services/dictionaries');
}

export async function addProviderRule(data: { providerId: string; providerCategory: string; keyword?: string; targetCategory: Category }) {
    await checkAdmin();
    const prismaAny = prisma as any;
    await prismaAny.providerCategoryRule.create({
        data: {
            id: crypto.randomUUID(),
            providerId: data.providerId,
            providerCategory: data.providerCategory,
            keyword: data.keyword || null,
            targetCategory: data.targetCategory,
            updatedAt: new Date()
        }
    });
    revalidatePath('/admin/services/dictionaries');
}

export async function deleteProviderRule(id: string) {
    await checkAdmin();
    const prismaAny = prisma as any;
    await prismaAny.providerCategoryRule.delete({ where: { id } });
    revalidatePath('/admin/services/dictionaries');
}
