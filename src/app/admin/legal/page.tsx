/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import React from 'react';
import { prisma } from '@/lib/prisma';
import { Scale } from 'lucide-react';
import { LegalContentManager } from './components';
import { cookies } from 'next/headers';
import { dictionaries, Locale } from '@/i18n/dictionaries';
import { ProjectSelector } from '@/components/admin/core/project-selector';

async function getLegalData(requestedProjectId?: string) {
    const allProjects = await prisma.project.findMany();

    let project;
    if (requestedProjectId && requestedProjectId !== 'all') {
        project = allProjects.find(p => p.id === requestedProjectId);
    }

    if (!project && allProjects.length > 0) {
        project = allProjects[0];
    }

    if (!project) return { project: null, documents: [], allProjects };

    const documents = await (prisma as any).legalDocument.findMany({
        where: { projectId: project.id },
        orderBy: { createdAt: 'desc' }
    });

    return { project, documents, allProjects };
}

export default async function LegalAdminPage(props: { searchParams: Promise<any> }) {
    const searchParams = await props.searchParams;
    const cookieStore = await cookies();

    // Priority: query param overrides cookie, else default. (But ProjectSelector mostly uses searchParams)
    const activeProjectId = searchParams.projectId || cookieStore.get('active_project_id')?.value;

    const { project, documents, allProjects } = await getLegalData(activeProjectId);
    const lang = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
    const t = dictionaries[lang].admin.legal;

    if (!project) return <div className="p-8">{t.error_projects}</div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-900 text-white rounded-xl">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">{t.title}</h1>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{t.subtitle} <b>{project.name}</b></p>
                    </div>
                </div>
                <div className="w-full md:w-auto">
                    <ProjectSelector allProjects={allProjects} currentProjectId={project.id} />
                </div>
            </div>

            <LegalContentManager projectId={project.id} initialDocuments={documents} />
        </div>
    );
}
