'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/utils/admin-session';

async function checkAuth() {
    const session = await getAdminSession();
    if (!session || session.role !== 'ADMIN') {
        throw new Error('Unauthorized');
    }
}

export async function getAdminLogsAction(page: number = 1, filters: any = {}) {
    await checkAuth();

    const skip = (page - 1) * 50;
    const where: any = {};

    if (filters.adminId) where.adminId = filters.adminId;
    if (filters.action) where.action = filters.action;

    if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    const [logs, total] = await Promise.all([
        prisma.adminLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: 50
        }),
        prisma.adminLog.count({ where })
    ]);

    // Fetch admin details manually for display
    const adminIds = Array.from(new Set(logs.map(l => l.adminId)));
    const admins = await prisma.user.findMany({
        where: { id: { in: adminIds } },
        select: { id: true, username: true }
    });

    const logsWithAdmins = logs.map(log => ({
        ...log,
        admin: admins.find(a => a.id === log.adminId)
    }));

    return {
        success: true,
        logs: logsWithAdmins,
        total,
        pages: Math.ceil(total / 50)
    };
}
