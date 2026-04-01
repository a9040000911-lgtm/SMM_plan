'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getClientProjectId } from "@/utils/project-resolver";

/**
 * Returns public auth settings for the current project context.
 */
export async function getProjectAuthSettings() {
    try {
        const projectId = await getClientProjectId();
        if (!projectId) return null;

        const { ProjectService } = await import("@/services/core/project.service");
        const project = await ProjectService.getById(projectId);

        return {
            botUsername: project?.botUsername || null,
            projectId: project?.slug || null,
        };
    } catch (e) {
        console.error('[getProjectAuthSettings] Error:', e);
        return null;
    }
}
