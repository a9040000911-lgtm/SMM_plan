/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AdminContext, AdminServiceResult } from "../../types";
import { toPlainObject } from "@/utils/serialization";
import { OrderFilters } from "../admin-data.service"; // Reuse interface from parent or relocate it later

export class AdminOrderService {
    /**
     * Finds orders trapped in intermediate statuses for an excessive duration.
     */
    static async getStuckStats(ctx: AdminContext, projectId?: string): Promise<AdminServiceResult<{ pendingCount: number; processingCount: number; totalStuck: number }>> {
        try {
            const whereBase: Prisma.OrderWhereInput = {};
            if (projectId && projectId !== 'ALL') {
                if (!ctx.isGlobalAdmin && !ctx.allowedProjects.includes(projectId)) {
                    throw new Error("Access denied to project");
                }
                whereBase.projectId = projectId;
            } else if (!ctx.isGlobalAdmin) {
                whereBase.projectId = { in: ctx.allowedProjects };
            }

            const threshold24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const threshold48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

            const [pendingCount, processingCount] = await Promise.all([
                prisma.order.count({
                    where: { ...whereBase, status: 'PENDING', updatedAt: { lte: threshold24h } }
                }),
                prisma.order.count({
                    where: { ...whereBase, status: 'PROCESSING', updatedAt: { lte: threshold48h } }
                })
            ]);

            return {
                success: true,
                data: {
                    pendingCount,
                    processingCount,
                    totalStuck: pendingCount + processingCount
                }
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'STUCK_STATS_FAILED', message: error.message }
            };
        }
    }

    /**
     * Gets a paged list of orders with full admin-level details.
     */
    static async getOrdersPaged(ctx: AdminContext, filters: OrderFilters): Promise<AdminServiceResult<{
        orders: any[];
        totalMatching: number;
        projects: any[];
        providers: any[];
    }>> {
        try {
            const skip = (filters.page - 1) * filters.limit;
            const where: Prisma.OrderWhereInput = {};

            if (filters.projectId && filters.projectId !== 'ALL') {
                if (!ctx.isGlobalAdmin && !ctx.allowedProjects.includes(filters.projectId)) {
                    throw new Error("Access denied to project");
                }
                where.projectId = filters.projectId;
            } else if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            if (filters.status && filters.status !== 'ALL') {
                where.status = filters.status as any;
            }
            if (filters.platform && filters.platform !== 'ALL') {
                where.internalService = { ...(where.internalService as any || {}), socialPlatform: { slug: filters.platform } };
            }
            if (filters.provider && filters.provider !== 'ALL') {
                where.internalService = { ...(where.internalService as any || {}), providerMappings: { some: { providerId: filters.provider } } };
            }
            if (filters.category && filters.category !== 'ALL') {
                where.internalService = { ...(where.internalService as any || {}), serviceCategory: { categoryType: filters.category as any } };
            }
            if (filters.serviceId && filters.serviceId !== 'ALL') {
                where.internalServiceId = filters.serviceId;
            }
            if (filters.dateFrom || filters.dateTo) {
                where.createdAt = {};
                if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
                if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
            }
            const AND: Prisma.OrderWhereInput[] = [];

            if (filters.search) {
                const isNumeric = /^\d+$/.test(filters.search);
                AND.push({
                    OR: [
                        ...(isNumeric ? [{ id: parseInt(filters.search) }] : []),
                        { externalId: { contains: filters.search, mode: 'insensitive' } },
                        { link: { contains: filters.search, mode: 'insensitive' } }
                    ]
                });
            }

            if (filters.stuck) {
                const threshold24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
                const threshold48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
                AND.push({
                    OR: [
                        { status: 'PENDING', updatedAt: { lte: threshold24h } },
                        { status: 'PROCESSING', updatedAt: { lte: threshold48h } }
                    ]
                });
            }

            if (AND.length > 0) {
                where.AND = AND;
            }

            const [orders, totalMatching, allProjects, allProviders] = await Promise.all([
                prisma.order.findMany({
                    where,
                    take: filters.limit,
                    skip: skip,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: true,
                        project: true,
                        internalService: {
                            include: {
                                providerMappings: {
                                    include: {
                                        provider: true
                                    }
                                }
                            }
                        },
                    },
                }),
                prisma.order.count({ where }),
                prisma.project.findMany({
                    where: ctx.isGlobalAdmin ? {} : { id: { in: ctx.allowedProjects } },
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true, brandColor: true }
                }),
                prisma.provider.findMany({
                    orderBy: { name: 'asc' },
                    select: { id: true, name: true }
                })
            ]);

            return {
                success: true,
                data: toPlainObject({
                    orders: orders.map(({ providerRawResponse: _providerRawResponse, ...o }) => ({
                        ...o,
                        totalPrice: o.totalPrice?.toNumber() || 0,
                        costPrice: o.costPrice?.toNumber() || 0,
                        discountAmount: o.discountAmount?.toNumber() || 0,
                        refundedAmount: o.refundedAmount?.toNumber ? o.refundedAmount.toNumber() : Number(o.refundedAmount || 0),
                        internalService: o.internalService ? {
                            ...o.internalService,
                            pricePer1000: o.internalService.pricePer1000?.toNumber ? o.internalService.pricePer1000.toNumber() : Number(o.internalService.pricePer1000 || 0),
                            lastProviderPrice: o.internalService.lastProviderPrice?.toNumber ? o.internalService.lastProviderPrice.toNumber() : (o.internalService.lastProviderPrice ? Number(o.internalService.lastProviderPrice) : null),
                            marketPrice: o.internalService.marketPrice?.toNumber ? o.internalService.marketPrice.toNumber() : (o.internalService.marketPrice ? Number(o.internalService.marketPrice) : null),
                            markup: o.internalService.markup?.toNumber ? o.internalService.markup.toNumber() : (o.internalService.markup ? Number(o.internalService.markup) : null),
                            providerPriceOriginal: o.internalService.providerPriceOriginal?.toNumber ? o.internalService.providerPriceOriginal.toNumber() : (o.internalService.providerPriceOriginal ? Number(o.internalService.providerPriceOriginal) : null),
                            providerMappings: o.internalService.providerMappings?.map((pm: any) => ({
                                ...pm,
                                customPrice: pm.customPrice?.toNumber ? pm.customPrice.toNumber() : (pm.customPrice ? Number(pm.customPrice) : null),
                                provider: pm.provider
                            }))
                        } : null
                    })),
                    totalMatching,
                    projects: allProjects,
                    providers: allProviders
                })
            };
        } catch (error: any) {
            return {
                success: false,
                error: { code: 'ADMIN_ORDERS_FETCH_FAILED', message: error.message }
            };
        }
    }
}
