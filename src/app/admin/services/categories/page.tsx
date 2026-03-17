/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { prisma } from '@/lib/prisma';
import { getActiveProjectId } from '@/utils/admin-session';
import { CategoryManager } from '@/components/admin/services/categories/category-manager';
import { Platform } from '@/generated/client';
import { AdminHeader } from '@/components/admin/core/admin-header';

export const dynamic = 'force-dynamic';

export default async function CategoryManagementPage() {
    const projectId = await getActiveProjectId();
    const isGlobalMode = projectId === 'all';

    const allCategories = await prisma.serviceCategory.findMany({
        where: isGlobalMode ? {} : {
            OR: [
                { projectId: projectId || undefined },
                { projectId: null }
            ]
        },
        orderBy: [
            { platform: 'asc' },
            { priority: 'asc' }
        ],
        include: {
            _count: {
                select: { internalServices: true }
            }
        }
    });

    // Deduplicate: if we have a project-specific category for (platform, categoryType), 
    // hide the global one in project mode.
    const categories = isGlobalMode ? allCategories : allCategories.filter((cat, index, self) => {
        if (cat.projectId !== null) return true; // Always keep project-specific

        // For global category, check if there's a project-specific override in "self"
        const hasOverride = self.some(other =>
            other.projectId === projectId &&
            other.platform === cat.platform &&
            other.categoryType === cat.categoryType
        );

        return !hasOverride;
    });

    const projects = await prisma.project.findMany({
        select: { id: true, name: true, brandColor: true }
    });

    const platforms = Object.keys(Platform);

    return (
        <div className="max-w-[1400px] mx-auto space-y-8">
            <AdminHeader
                title="Управление категориями"
                subtitle="Настройка отображения, группировка по соцсетям и управление приоритетами"
                projects={projects}
                projectId={projectId || 'all'}
            />

            <CategoryManager
                initialCategories={JSON.parse(JSON.stringify(categories))}
                platforms={platforms}
                projects={projects}
                activeProjectId={projectId === 'all' ? null : projectId}
            />
        </div>
    );
}
