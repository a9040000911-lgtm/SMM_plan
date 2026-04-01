/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import React from 'react';
import { notFound } from 'next/navigation';
import { Bug, CheckCircle2, AlertTriangle, AlertOctagon, ExternalLink } from 'lucide-react';
import { formatAmount } from '@/utils/formatter';
import { Pagination } from '@/components/admin/core/pagination';
import { AdminTableCard } from '@/components/admin/core/admin-table-card';
import Link from 'next/link';
import { getAdminSession } from '@/utils/admin-session';
import { AdminDataService } from '@/services/admin/admin-data.service';
import { AdminContext } from '@/services/types';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BugReportsPage({ searchParams }: PageProps) {
    const params = await searchParams || {};
    const page = parseInt(typeof params.page === 'string' ? params.page : '1') || 1;
    const limit = parseInt(typeof params.limit === 'string' ? params.limit : '20') || 20;

    const session = await getAdminSession();
    if (!session) return notFound();

    const ctx: AdminContext = {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };

    const result = await AdminDataService.getBugReportsPaged(ctx, page, limit);
    if (!result.success) {
        return <div className="p-8 text-red-500">Ошибка: {result.error.message}</div>;
    }

    const { reports, total, stats } = result.data;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><AlertTriangle size={24} /></div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Новые баги</div>
                        <div className="text-2xl font-black text-slate-800">{stats.pending}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Bug size={24} /></div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">На проверке</div>
                        <div className="text-2xl font-black text-slate-800">{stats.reviewing}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={24} /></div>
                    <div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Исправлено/Оплачено</div>
                        <div className="text-2xl font-black text-slate-800">{stats.accepted}</div>
                    </div>
                </div>
            </div>

            <AdminTableCard title="Все Баг-Репорты" icon={Bug}>
                <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Проект / Критичность</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Пользователь</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest w-[40%]">Описание проблемы</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Статус</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Награда</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {reports.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                                        Нет баг-репортов
                                    </td>
                                </tr>
                            ) : (
                                reports.map((report) => (
                                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-2">
                                                {report.project && (
                                                    <Link
                                                        href={`/admin/projects/${report.projectId}`}
                                                        className="text-[10px] font-black uppercase px-2 py-0.5 rounded w-fit hover:opacity-80 transition-opacity"
                                                        style={{
                                                            backgroundColor: `${report.project.brandColor}15`,
                                                            color: report.project.brandColor
                                                        }}>
                                                        {report.project.name}
                                                    </Link>
                                                )}
                                            <span className={`flex items-center gap-1 text-[10px] font-bold uppercase w-fit px-2 py-0.5 rounded ${report.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                                                    report.severity === 'MAJOR' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {report.severity === 'CRITICAL' && <AlertOctagon size={10} />}
                                                    {report.severity === 'MAJOR' && <AlertTriangle size={10} />}
                                                    {report.severity === 'CRITICAL' ? 'Критическая' : report.severity === 'MAJOR' ? 'Значительная' : 'Незначительная'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                {report.user ? (
                                                    <>
                                                        <Link href={`/admin/users/${report.userId}`} className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">
                                                            @{report.user.username || 'user'}
                                                        </Link>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            ID: {report.user.id.substring(0, 8)}...
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-sm font-bold text-slate-500">Аноним</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <Link href={`/admin/support/bug-reports/${report.id}`} className="font-bold text-blue-600 hover:underline text-xs shadow-sm w-fit">
                                                    {report.title} <ExternalLink size={10} className="inline ml-1" />
                                                </Link>
                                                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                                                    {report.description}
                                                </p>
                                                {report.screenshotUrl && (
                                                    <a href={report.screenshotUrl} target="_blank" className="flex items-center gap-1 text-[10px] text-blue-500 font-bold mt-1 hover:underline">
                                                        <ExternalLink size={10} /> Скриншот
                                                    </a>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[9px] font-black px-2 py-1 rounded uppercase border ${report.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                report.status === 'REJECTED' ? 'bg-slate-50 text-slate-400 border-slate-200' :
                                                    report.status === 'REVIEWING' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                }`}>
                                                {report.status === 'PENDING' ? 'Новый' : report.status === 'REVIEWING' ? 'На проверке' : report.status === 'ACCEPTED' ? 'Принят' : 'Отклонен'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {report.status === 'ACCEPTED' ? (
                                                <span className="text-sm font-black text-emerald-600">
                                                    {formatAmount(report.rewardAmount)}₽
                                                </span>
                                            ) : (
                                                <span className="text-slate-300 text-xs font-bold">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
            </AdminTableCard>

            <Pagination totalPages={Math.ceil(total / limit)} />
        </div>
    );
}


