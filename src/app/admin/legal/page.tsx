/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
export const dynamic = 'force-dynamic';
import React from 'react';
import { Scale } from 'lucide-react';
import { LegalContentManager } from './components';
import { cookies } from 'next/headers';
import { dictionaries, Locale } from '@/i18n/dictionaries';
import { ProjectSelector } from '@/components/admin/core/project-selector';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export default async function LegalAdminPage(props: { searchParams: Promise<any> }) {
    const searchParams = await props.searchParams;
    const cookieStore = await cookies();
    const session = await getAdminSession();
    if (!session) return null;

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    // Priority: query param overrides cookie, else default
    const activeProjectId = searchParams.projectId || cookieStore.get('active_project_id')?.value;

    const result = await AdminDataService.getLegalDashboardData(ctx, activeProjectId);
    if (!result.success) return <div className="p-8 text-red-500">Error: {result.error.message}</div>;

    const { project, documents, allProjects } = result.data;
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
