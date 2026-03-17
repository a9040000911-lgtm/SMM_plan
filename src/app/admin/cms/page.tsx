/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getActiveProjectId, getAdminSession } from '@/utils/admin-session';
import { CmsService } from '@/services/cms/cms.service';
import CmsAdmin from './cms-editor';
import { redirect } from 'next/navigation';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export default async function AdminCmsPage() {
    const projectId = await getActiveProjectId();
    const session = await getAdminSession();
    if (!session) return null;

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    if (!projectId || projectId === 'all') {
        const result = await AdminDataService.getSettingsDashboardData(ctx);
        if (result.success && result.data.project) {
            return redirect(`/admin/cms?projectId=${result.data.project.id}`);
        }
        return <div>No projects found.</div>;
    }

    // Use AdminDataService for project info to avoid direct prisma
    const result = await AdminDataService.getSettingsDashboardData(ctx, projectId);
    if (!result.success) return <div>Error: {result.error.message}</div>;

    const project = result.data.project;
    const cmsStrings = await CmsService.getProjectStrings(projectId);
    const cmsBlocks = await CmsService.getProjectBlocks(projectId);

    return <CmsAdmin project={project} initialStrings={cmsStrings} initialBlocks={cmsBlocks} />;
}
