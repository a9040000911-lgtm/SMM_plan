/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import React from 'react';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Star, CheckCircle2, XCircle } from 'lucide-react';
import { Pagination } from '@/components/admin/core/pagination';
import { dictionaries, Locale } from '@/i18n/dictionaries';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ReviewsPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(typeof params.page === 'string' ? params.page : '1') || 1;
    const limit = parseInt(typeof params.limit === 'string' ? params.limit : '20') || 20;
    const skip = (page - 1) * limit;

    // Session Check
    const cookieStore = await cookies();
    const sessionData = cookieStore.get('admin_session');
    if (!sessionData) return notFound();

    const { verifyAdminSession } = await import('@/lib/jwt');
    const session = await verifyAdminSession(sessionData.value);
    if (!session) return notFound();

    const lang = cookieStore.get('smmplan_lang')?.value as Locale || 'ru';
    const t = dictionaries[lang].admin.reviews;

    const isGlobalAdmin = session.isGlobalAdmin;
    const allowedProjects = session.allowedProjects || [];

    const where: any = {};
    if (!isGlobalAdmin) {
        where.projectId = { in: allowedProjects };
    }

    const [reviews, totalReviews, statusCounts, projects] = await Promise.all([
        prisma.review.findMany({
            where,
            include: {
                user: true,
                project: true,
                order: {
                    include: { internalService: true }
                }
            },
            take: limit,
            skip,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.review.count({ where }),
        prisma.review.groupBy({
            by: ['status'],
            where,
            _count: { _all: true }
        }),
        prisma.project.findMany({
            where: isGlobalAdmin ? {} : { id: { in: allowedProjects } },
            select: { id: true, name: true }
        })
    ]);

    const stats = {
        pending: statusCounts.find(s => s.status === 'PENDING')?._count._all || 0,
        approved: statusCounts.find(s => s.status === 'APPROVED')?._count._all || 0,
        rejected: statusCounts.find(s => s.status === 'REJECTED')?._count._all || 0
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:shadow-amber-500/5 group">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><Star size={24} /></div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.stats.pending}</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.pending}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:shadow-emerald-500/5 group">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><CheckCircle2 size={24} /></div>
                    <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.stats.approved}</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.approved}</div>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:shadow-rose-500/5 group">
                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><XCircle size={24} /></div>
                    <div>
                        <div className="text-[10px] font-black text-slate-500/40 uppercase tracking-widest leading-none mb-1">{t.stats.rejected}</div>
                        <div className="text-3xl font-black text-slate-800 tracking-tight">{stats.rejected}</div>
                    </div>
                </div>
            </div>

            {/* Interactive Reviews Table */}
            <ReviewsTable
                initialReviews={JSON.parse(JSON.stringify(reviews))}
                projects={projects}
                t={t}
            />

            <div className="mt-8 flex justify-center pb-12">
                <Pagination totalPages={Math.ceil(totalReviews / limit)} />
            </div>
        </div>
    );
}

// Add necessary import
import { ReviewsTable } from '@/components/admin/reviews/ReviewsTable';
