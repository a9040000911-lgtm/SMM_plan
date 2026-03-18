/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ProjectService } from '@/services/core/project.service';

export async function GET(request: NextRequest) {
    try {
        const host = request.headers.get('host') || 'localhost';
        // Remove port for local dev if present
        const domain = host.split(':')[0];

        const project = await ProjectService.getByDomain(domain);

        if (!project) {
            // Fallback to default project if domain not found
            const defaultProject = await ProjectService.getBySlug('default');
            if (defaultProject) {
                return NextResponse.json({
                    name: defaultProject.name,
                    brandColor: defaultProject.brandColor,
                    config: defaultProject.config,
                    domain: defaultProject.domain
                });
            }
            return NextResponse.json({ error: 'Project not found' }, { status: 404 });
        }

        return NextResponse.json({
            name: project.name,
            brandColor: project.brandColor,
            config: project.config,
            domain: project.domain
        });

    } catch (error) {
        console.error('Error fetching project config:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


