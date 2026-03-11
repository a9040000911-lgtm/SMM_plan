'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { BotModuleGenerator, Tone, BotModule } from '@/services/ai/bot-module.generator';
import { cookies } from 'next/headers';
import { ProjectService } from '@/services/core';

// Authentication Check Helper
async function checkAuth(projectId: string) {
    const cookieStore = await cookies();
    const sessionData = cookieStore.get('admin_session');
    const { verifyAdminSession } = await import('@/lib/jwt');
    const session = sessionData ? await verifyAdminSession(sessionData.value) : null;

    if (!session) throw new Error('Unauthorized');
    if (!session.isGlobalAdmin && !session.allowedProjects?.includes(projectId)) {
        throw new Error('Forbidden');
    }
}

export async function generateFunnelAction(projectId: string, tone: Tone) {
    await checkAuth(projectId);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const context = `Project Name: ${project.name}. Description: An automated SMM panel for Instagram, Telegram, TikTok. Target Audience: Influencers, businesses.`;

    // Generate new funnel
    const modules = await BotModuleGenerator.generateFunnel(context, tone);
    return modules;
}

export async function saveBotModulesAction(projectId: string, modules: BotModule[]) {
    await checkAuth(projectId);
    await BotModuleGenerator.saveModules(projectId, modules);
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
}

export async function updateProjectConfigAction(projectId: string, updates: any) {
    await checkAuth(projectId);

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new Error('Project not found');

    const currentConfig = (project.config as any) || {};

    await prisma.project.update({
        where: { id: projectId },
        data: {
            config: {
                ...currentConfig,
                ...updates
            }
        }
    });

    ProjectService.clearCache();
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true };
}

export async function updateMarketerSettingsAction(projectId: string, settings: any) {
    await checkAuth(projectId);

    await prisma.project.update({
        where: { id: projectId },
        data: {
            marketerSettings: settings
        }
    });

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
    await checkAuth(projectId);

    await prisma.projectServiceOverride.upsert({
        where: {
            projectId_internalServiceId: {
                projectId,
                internalServiceId: serviceId
            }
        },
        create: {
            projectId,
            internalServiceId: serviceId,
            isActive,
            customPrice: customPrice !== null ? customPrice : undefined,
            markup: markup !== null ? markup : undefined
        },
        update: {
            isActive,
            customPrice: customPrice !== null ? customPrice : null,
            markup: markup !== null ? markup : null
        }
    });

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
    await checkAuth(projectId);

    if (!serviceIds.length) return { success: false, error: 'No services selected' };

    // We use a transaction to ensure all upserts succeed or fail together
    await prisma.$transaction(
        serviceIds.map(serviceId =>
            prisma.projectServiceOverride.upsert({
                where: {
                    projectId_internalServiceId: {
                        projectId,
                        internalServiceId: serviceId
                    }
                },
                create: {
                    projectId,
                    internalServiceId: serviceId,
                    isActive: data.isActive ?? true,
                    markup: data.markup !== undefined ? (data.markup ?? undefined) : undefined,
                    customPrice: data.customPrice !== undefined ? (data.customPrice ?? undefined) : undefined,
                },
                update: {
                    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
                    ...(data.markup !== undefined ? { markup: data.markup } : {}),
                    ...(data.customPrice !== undefined ? { customPrice: data.customPrice } : {}),
                }
            })
        )
    );

    revalidatePath(`/admin/projects/${projectId}/services`);
    return { success: true, count: serviceIds.length };
}

export async function mapProjectServiceToProviderAction(
    projectId: string,
    internalServiceId: string,
    providerId: string,
    providerServiceId: number
) {
    await checkAuth(projectId);

    // Set all existing mappings for this service in this project to inactive
    await prisma.internalServiceMapping.updateMany({
        where: { projectId, internalServiceId },
        data: { isActive: false, priority: 0 }
    });

    // Create or update the new mapping
    const existingMapping = await prisma.internalServiceMapping.findFirst({
        where: {
            projectId: projectId,
            internalServiceId,
            providerId
        }
    });

    if (existingMapping) {
        await prisma.internalServiceMapping.update({
            where: { id: existingMapping.id },
            data: {
                providerServiceId: String(providerServiceId),
                isActive: true,
                priority: 1
            }
        });
    } else {
        await prisma.internalServiceMapping.create({
            data: {
                projectId,
                internalServiceId,
                providerServiceId: String(providerServiceId),
                providerId,
                priority: 1,
                isActive: true
            }
        });
    }

    revalidatePath(`/admin/projects/${projectId}/services`);
    return { success: true };
}