/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */
import { prisma } from '@/lib/prisma';

/**
 * Churn Service Facade for Analytics
 */
export class ChurnService {
    /**
     * Get global churn statistics for admin dashboard
     */
    static async getGlobalStats(allowedProjects?: string[]) {
        const where: any = {};
        if (allowedProjects) {
            where.projectId = { in: allowedProjects };
        }

        const [atRiskCount, totalMonitoredOrders, recentSnapshots] = await Promise.all([
            prisma.churnPrediction.count({
                where: {
                    recommendedAction: 'REFILL_NOW',
                    createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
                    order: where
                }
            }),
            prisma.order.count({
                where: {
                    ...where,
                    warrantyDays: { not: null },
                    status: 'COMPLETED'
                }
            }),
            prisma.churnSnapshot.findMany({
                where: { order: where },
                orderBy: { snapshotDate: 'desc' },
                take: 100
            })
        ]);

        const avgDropoff = recentSnapshots.length > 0
            ? recentSnapshots.reduce((acc, s) => acc + Number(s.dropoffRate), 0) / recentSnapshots.length
            : 0;

        return {
            atRiskCount,
            totalMonitoredOrders,
            avgDropoff: Number(avgDropoff.toFixed(2)),
            period: 'last_48h'
        };
    }
}


