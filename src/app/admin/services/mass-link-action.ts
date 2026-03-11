'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/utils/admin-session';
import { getActiveProjectId } from '@/utils/project-resolver';

export async function massLinkCategoryServicesAction(categoryId: string, mappings: Array<{ internalServiceId: string, providerId: string, providerServiceId: number }>) {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) {
        return { success: false, error: 'Unauthorized' };
    }

    const activeProjectId = await getActiveProjectId();

    try {
        await prisma.$transaction(async (tx) => {
            for (const m of mappings) {
                const existingMapping = await tx.internalServiceMapping.findFirst({
                    where: {
                        projectId: activeProjectId || null,
                        internalServiceId: m.internalServiceId,
                        providerId: m.providerId
                    }
                });

                if (existingMapping) {
                    await tx.internalServiceMapping.update({
                        where: { id: existingMapping.id },
                        data: {
                            providerServiceId: String(m.providerServiceId),
                            isActive: true,
                            priority: 1
                        }
                    });
                } else {
                    await tx.internalServiceMapping.create({
                        data: {
                            projectId: activeProjectId || null,
                            internalServiceId: m.internalServiceId,
                            providerServiceId: String(m.providerServiceId),
                            providerId: m.providerId,
                            priority: 1,
                            isActive: true
                        }
                    });
                }
            }
        });

        revalidatePath('/admin/services');
        return { success: true, count: mappings.length };
    } catch (error: any) {
        console.error('[massLinkCategoryServicesAction] Error:', error);
        return { success: false, error: error.message };
    }
}
