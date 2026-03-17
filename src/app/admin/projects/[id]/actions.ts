'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from 'next/cache';
import { BotModuleGenerator, Tone, BotModule } from '@/services/ai/bot-module.generator';
import { ProjectService } from '@/services/core';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

async function getCtx(projectId: string): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session) throw new Error('Unauthorized');
    if (!session.isGlobalAdmin && !session.allowedProjects?.includes(projectId)) {
        throw new Error('Forbidden');
    }
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

export async function generateFunnelAction(projectId: string, tone: Tone) {
    const ctx = await getCtx(projectId);
    const projectResult = await AdminDataService.getProjectRaw(ctx, projectId);
    if (!projectResult.success) throw new Error(projectResult.error.message);

    const project = projectResult.data;
    const context = `Project Name: ${project.name}. Description: An automated SMM panel for Instagram, Telegram, TikTok. Target Audience: Influencers, businesses.`;

    const modules = await BotModuleGenerator.generateFunnel(context, tone);
    return modules;
}

export async function saveBotModulesAction(projectId: string, modules: BotModule[]) {
    await getCtx(projectId);
    await BotModuleGenerator.saveModules(projectId, modules);
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
}

export async function updateProjectConfigAction(projectId: string, updates: any) {
    const ctx = await getCtx(projectId);
    const projectResult = await AdminDataService.getProjectRaw(ctx, projectId);
    if (!projectResult.success) throw new Error(projectResult.error.message);

    const currentConfig = projectResult.data.config || {};
    const newConfig = { ...currentConfig, ...updates };

    const result = await AdminDataService.updateProjectConfig(ctx, projectId, newConfig);
    if (!result.success) throw new Error(result.error.message);

    ProjectService.clearCache();
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
}

export async function updateMarketerSettingsAction(projectId: string, settings: any) {
    const ctx = await getCtx(projectId);
    const result = await AdminDataService.updateMarketerSettings(ctx, projectId, settings);
    if (!result.success) throw new Error(result.error.message);

    ProjectService.clearCache();
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
}

export async function updateProjectServiceOverrideAction(
    projectId: string,
    serviceId: string,
    isActive: boolean,
    customPrice: number | null,
    markup: number | null = null
) {
    const ctx = await getCtx(projectId);
    const result = await AdminDataService.updateProjectServiceOverride(ctx, projectId, serviceId, {
        isActive,
        customPrice,
        markup
    });
    if (!result.success) throw new Error(result.error.message);

    revalidatePath(`/admin/projects/${projectId}/services`);
    return { success: true };
}

export async function bulkUpdateProjectOverridesAction(
    projectId: string,
    serviceIds: string[],
    data: {
        isActive?: boolean;
        markup?: number | null;
        customPrice?: number | null;
    }
) {
    const ctx = await getCtx(projectId);
    const result = await AdminDataService.bulkUpdateProjectOverrides(ctx, projectId, serviceIds, data);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath(`/admin/projects/${projectId}/services`);
    return { success: true, count: result.data.count };
}

export async function mapProjectServiceToProviderAction(
    projectId: string,
    internalServiceId: string,
    providerId: string,
    providerServiceId: number
) {
    const ctx = await getCtx(projectId);
    const result = await AdminDataService.mapProjectServiceToProvider(ctx, projectId, internalServiceId, providerId, providerServiceId);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath(`/admin/projects/${projectId}/services`);
    return { success: true };
}