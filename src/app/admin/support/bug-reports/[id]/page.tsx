/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { notFound } from 'next/navigation';
import { AdminHeader } from '@/components/admin/core/admin-header';
import { BugStatusEditor } from './status-editor';
import Link from 'next/link';
import NextImage from 'next/image';
import { ExternalLink, ArrowLeft, Bug } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export const dynamic = 'force-dynamic';

export default async function BugReportDetailPage({
    params
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const session = await getAdminSession();
    if (!session) return notFound();

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    const result = await AdminDataService.getBugReportDetail(ctx, id);
    if (!result.success) return notFound();

    const report = result.data;

    return (
        <div className="flex flex-col space-y-6 bg-[#f8fafc] p-8 h-full min-h-screen">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/support/bug-reports"
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
                >
                    <ArrowLeft size={20} />
                </Link>
                <AdminHeader
                    title={`Bug Report #${report.id.split('-')[0]}`}
                    subtitle={`От ${format(new Date(report.createdAt), 'dd MMMM yyyy HH:mm', { locale: ru })}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                                <Bug size={24} />
                            </div>
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                {report.title}
                            </h2>
                        </div>

                        <div className="space-y-6 text-slate-600">
                            <div>
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Описание проблемы</h3>
                                <p className="whitespace-pre-wrap">{report.description}</p>
                            </div>

                            {report.stepsToReproduce && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Шаги для воспроизведения</h3>
                                    <p className="whitespace-pre-wrap">{report.stepsToReproduce}</p>
                                </div>
                            )}

                            {report.screenshotUrl && (
                                <div>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Скриншот</h3>
                                    <a href={report.screenshotUrl} target="_blank" rel="noreferrer" className="inline-block rounded-xl overflow-hidden border border-slate-200 hover:border-primary/50 transition-colors relative group">
                                        <NextImage 
                                            src={report.screenshotUrl} 
                                            alt="Screenshot" 
                                            width={800}
                                            height={600}
                                            className="max-w-full rounded-xl max-h-[400px] object-contain" 
                                        />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-bold backdrop-blur-sm">
                                            <ExternalLink size={20} />
                                            Открыть оригинал
                                        </div>
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <BugStatusEditor
                        reportId={report.id}
                        initialStatus={report.status}
                        initialReward={Number(report.rewardAmount)}
                        adminNotes={report.adminNotes || ''}
                        isPaid={report.rewardPaid}
                    />

                    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4">Информация</h3>

                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Пользователь</span>
                            {report.user ? (
                                <Link href={`/admin/users/${report.userId}`} className="text-sm font-bold text-blue-600 hover:underline">
                                    @{report.user.username || 'user'}
                                </Link>
                            ) : (
                                <span className="text-sm font-medium text-slate-500">Аноним</span>
                            )}
                        </div>

                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Критичность</span>
                            <span className={`text-[10px] font-bold uppercase w-fit px-2 py-0.5 rounded ${report.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                report.severity === 'MAJOR' ? 'bg-amber-100 text-amber-700' :
                                    'bg-slate-100 text-slate-600'
                                }`}>
                                {report.severity === 'CRITICAL' ? 'Критическая' : report.severity === 'MAJOR' ? 'Значительная' : 'Незначительная'}
                            </span>
                        </div>

                        {report.project && (
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Проект</span>
                                <Link
                                    href={`/admin/projects/${report.projectId}`}
                                    className="text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit hover:opacity-80 transition-opacity"
                                    style={{
                                        backgroundColor: `${report.project.brandColor}15`,
                                        color: report.project.brandColor
                                    }}>
                                    {report.project.name}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
