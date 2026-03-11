'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Decimal } from 'decimal.js';
import { getAdminSession } from '@/utils/admin-session';
import { validateProjectAccess } from '@/utils/project-resolver';

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

export async function saveServiceOverrides(serviceId: string, overrides: Record<string, { customPrice: string, isActive: boolean, customName?: string, customDescription?: string }>) {
  await requireSupportOrAdmin();

  for (const [projectId, data] of Object.entries(overrides)) {
    if (!(await validateProjectAccess(projectId))) {
      throw new Error(`Forbidden: No access to project ${projectId}`);
    }

    const price = data.customPrice ? new Decimal(data.customPrice.replace(',', '.')) : null;

    await prisma.projectServiceOverride.upsert({
      where: {
        projectId_internalServiceId: {
          projectId,
          internalServiceId: serviceId
        }
      },
      update: {
        customPrice: price,
        isActive: data.isActive,
        customName: data.customName || null,
        customDescription: data.customDescription || null
      },
      create: {
        projectId,
        internalServiceId: serviceId,
        customPrice: price,
        isActive: data.isActive,
        customName: data.customName || null,
        customDescription: data.customDescription || null
      }
    });
  }

  revalidatePath(`/admin/services/${serviceId}`);
  return { success: true };
}
