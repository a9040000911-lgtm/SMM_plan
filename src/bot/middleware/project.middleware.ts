/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { ProjectService } from '@/services/core';

export const projectMiddleware = async (ctx: any, next: any) => {
    const token = ctx.telegram.token;
    let project = await ProjectService.getByBotToken(token);

    if (!project) {
        project = await ProjectService.ensureDefaultProject();
    }

    ctx.project = project;
    return next();
};


