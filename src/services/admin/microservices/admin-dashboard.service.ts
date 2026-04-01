/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { AdminContext, AdminServiceResult } from "../../types";
import { toPlainObject } from "@/utils/serialization";

export class AdminDashboardService {
    /**
     * Gets global statistics for the admin dashboard.
     */
    static async getGlobalStats(ctx: AdminContext): Promise<AdminServiceResult<any>> {
        try {
            const whereClause: any = {};
            if (!ctx.isGlobalAdmin) {
                whereClause.projectId = { in: ctx.allowedProjects };
            }

            const [revenue, orderCount, userCount, openTickets, stuckOrders, latestOrders] = await Promise.all([
                prisma.transaction.aggregate({
                    where: {
                        type: 'DEPOSIT',
                        status: 'COMPLETED',
                        ...(!ctx.isGlobalAdmin ? { user: { projectId: { in: ctx.allowedProjects } } } : {})
                    },
                    _sum: { amount: true }
                }),
                prisma.order.count({ where: whereClause }),
                prisma.user.count({ where: !ctx.isGlobalAdmin ? { projectId: { in: ctx.allowedProjects } } : {} }),
                prisma.supportTicket.count({
                    where: {
                        status: { in: ['OPEN', 'PENDING'] },
                        ...(!ctx.isGlobalAdmin ? { projectId: { in: ctx.allowedProjects } } : {})
                    }
                }),
                prisma.order.count({
                    where: {
                        ...whereClause,
                        status: 'PENDING'
                    }
                }),
                prisma.order.findMany({
                    where: whereClause,
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: { select: { username: true, email: true } },
                        internalService: { select: { name: true } }
                    }
                })
            ]);

            return {
                success: true,
                data: toPlainObject({
                    revenue: Number(revenue._sum.amount || 0),
                    orderCount,
                    userCount,
                    openTicketsCount: openTickets,
                    stuckOrdersCount: stuckOrders,
                    latestOrders: latestOrders.map(o => ({
                        ...o,
                        totalPrice: o.totalPrice.toNumber(),
                        costPrice: o.costPrice?.toNumber() || 0,
                        discountAmount: o.discountAmount?.toNumber() || 0,
                        refundedAmount: o.refundedAmount?.toNumber() || 0,
                        user: o.user,
                        internalService: o.internalService
                    }))
                })
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'ADMIN_STATS_FETCH_FAILED', message: error.message }
            };
        }
    }
}
