/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { AdminContext, AdminServiceResult } from "../../types";
import { safeAdminExecute } from "../../utils";
import { toPlainObject } from "@/utils/serialization";
import { LoyaltyService } from "../../users/loyalty.service";
import { ReferralLeaderboardService } from "../../users/referral-leaderboard.service";
import { UserFilters } from "../admin-data.service"; // Keep reuse

export class AdminUserService {
    /**
     * Gets a paged list of users with enriched data (loyalty, referrals).
     */
    static async getUsersPaged(ctx: AdminContext, filters: UserFilters): Promise<AdminServiceResult<{
        users: any[];
        totalMatching: number;
        totalGlobal: number;
    }>> {
        return safeAdminExecute(ctx, 'GET_USERS_PAGED', async () => {
            const skip = (filters.page - 1) * filters.limit;
            const where: Prisma.UserWhereInput = {};

            const AND: Prisma.UserWhereInput[] = [];

            if (!ctx.isGlobalAdmin) {
                AND.push({
                    OR: [
                        { projectId: { in: ctx.allowedProjects } },
                        { accessibleProjects: { some: { id: { in: ctx.allowedProjects } } } }
                    ]
                });
            }

            if (filters.role && filters.role !== 'ALL') {
                where.role = filters.role as any;
            }

            if (filters.search) {
                const isNumeric = /^\d+$/.test(filters.search);
                AND.push({
                    OR: [
                        { username: { contains: filters.search, mode: 'insensitive' } },
                        { email: { contains: filters.search, mode: 'insensitive' } },
                        { id: { contains: filters.search, mode: 'insensitive' } },
                        isNumeric ? { tgId: BigInt(filters.search) } : undefined
                    ].filter(Boolean) as Prisma.UserWhereInput[]
                });
            }

            if (AND.length > 0) {
                where.AND = AND;
            }

            const [users, totalMatching, totalGlobal] = await Promise.all([
                prisma.user.findMany({
                    where,
                    take: filters.limit,
                    skip: skip,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.user.count({ where }),
                prisma.user.count()
            ]);

            const enrichedUsers = await Promise.all(users.map(async (user, i) => {
                const spent = Number(user.spent);
                const loyalty = await LoyaltyService.getLoyaltyInfo(user.id, spent, user.projectId);
                const partnerLevel = ReferralLeaderboardService.calculateTier(spent);
                const partnerPercent = await LoyaltyService.getReferralPercent(user.id, user.projectId || 'DEFAULT');

                return {
                    id: user.id,
                    index: skip + i + 1,
                    username: user.username,
                    email: user.email,
                    tgId: user.tgId?.toString() || null,
                    balance: user.balance.toString(),
                    spent: user.spent.toString(),
                    referralEarnings: user.referralEarnings.toString(),
                    role: user.role,
                    createdAt: user.createdAt,
                    discount: loyalty.totalDiscount,
                    partnerLevel,
                    partnerPercent,
                    isBanned: user.isPermanentlyBanned || (user.banExpiresAt && user.banExpiresAt > new Date()),
                    isGlobalAdmin: user.isGlobalAdmin,
                };
            }));

            return toPlainObject({ users: enrichedUsers, totalMatching, totalGlobal });
        });
    }
}
