import { prisma } from '@/lib/prisma';
import { AdminServiceResult, AdminContext } from '@/services/types';
import { BaseAdminService } from './base-admin.service';
import { Decimal } from "decimal.js";
import { Role } from '@/generated/client';
import { CreateEmployeeContract, UpdateUserBalanceContract, UpdateUserContract } from './contracts';
import { safeAdminExecute } from '../utils';

/**
 * Service for administrative user management operations.
 */
export class AdminUserService extends BaseAdminService {
    private static instance: AdminUserService;

    private constructor() {
        super();
    }

    public static getInstance(): AdminUserService {
        if (!AdminUserService.instance) {
            AdminUserService.instance = new AdminUserService();
        }
        return AdminUserService.instance;
    }

    /**
     * Creates a new user with initial balance and log.
     */
    async createUser(ctx: AdminContext, data: any): Promise<AdminServiceResult<any>> {
        return safeAdminExecute(ctx, 'CREATE_USER', async () => {
            const { LedgerEntryType } = await import('@/generated/client');
            const balance = Number(data.balance || 0);

            const user = await prisma.user.create({
                data: {
                    username: data.username,
                    email: data.email || null,
                    role: data.role || 'USER',
                    balance: balance,
                    password: data.password || null,
                    ledgerEntries: balance > 0 ? {
                        create: {
                            amount: balance,
                            type: LedgerEntryType.MANUAL_ADJUSTMENT,
                            description: 'Initial balance',
                            currency: 'RUB',
                            balanceBefore: 0,
                            balanceAfter: balance
                        }
                    } : undefined
                }
            });

            return user;
        });
    }

    /**
     * Gets all admin panel staff members with stats.
     */
    async getAdminStaffMembers(ctx: AdminContext): Promise<AdminServiceResult<any>> {
        try {
            const staffWhere: any = { role: { in: ['ADMIN', 'SUPPORT', 'SEO', 'CURATOR'] } };
            if (!ctx.isGlobalAdmin) staffWhere.accessibleProjects = { some: { id: { in: ctx.allowedProjects } } };

            const [staff, allProjects, adminLogCounts] = await Promise.all([
                prisma.user.findMany({
                    where: staffWhere,
                    include: { accessibleProjects: { select: { id: true, name: true } } },
                    orderBy: { role: 'asc' }
                }),
                prisma.project.findMany({
                    where: ctx.isGlobalAdmin ? {} : { id: { in: ctx.allowedProjects } },
                    select: { id: true, name: true }
                }),
                prisma.adminLog.groupBy({
                    by: ['adminId'],
                    _count: { id: true },
                    _max: { createdAt: true }
                })
            ]);

            const staffWithStats = staff.map(user => {
                const stats = adminLogCounts.find(log => log.adminId === user.id);
                return {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isGlobalAdmin: user.isGlobalAdmin,
                    permissions: user.permissions || [],
                    allowedTabs: user.allowedTabs || [],
                    accessibleProjects: user.accessibleProjects,
                    actionsCount: stats?._count.id || 0,
                    lastActionAt: stats?._max.createdAt || null
                };
            });

            return { success: true, data: { staff: staffWithStats, allProjects } };
        } catch (error: any) {
            return this.handleError(error, 'ADMIN_STAFF_FETCH_FAILED');
        }
    }

    /**
     * Gets paged bug reports.
     */
    async getBugReportsPaged(ctx: AdminContext, page: number = 1, limit: number = 20): Promise<AdminServiceResult<any>> {
        try {
            const skip = (page - 1) * limit;
            const where: any = {};
            if (!ctx.isGlobalAdmin) where.projectId = { in: ctx.allowedProjects };

            const [reports, total, statusCounts] = await Promise.all([
                prisma.bugReport.findMany({
                    where,
                    include: { user: true, project: true },
                    take: limit,
                    skip,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.bugReport.count({ where }),
                prisma.bugReport.groupBy({
                    by: ['status'],
                    where,
                    _count: { _all: true }
                })
            ]);

            const stats = {
                pending: statusCounts.find(s => s.status === 'PENDING')?._count._all || 0,
                reviewing: statusCounts.find(s => s.status === 'REVIEWING')?._count._all || 0,
                accepted: statusCounts.find(s => s.status === 'ACCEPTED')?._count._all || 0
            };

            return {
                success: true,
                data: {
                    reports: reports.map(r => ({ ...r, rewardAmount: r.rewardAmount.toString() })),
                    total,
                    stats
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'ADMIN_BUG_REPORTS_FETCH_FAILED');
        }
    }

    /**
     * Gets paged admin logs with filtering.
     */
    async getAdminLogsPaged(ctx: AdminContext, page: number = 1, filters: any = {}): Promise<AdminServiceResult<any>> {
        try {
            const limit = 20;
            const skip = (page - 1) * limit;

            const where: any = {};
            if (filters.action) where.action = filters.action;
            if (filters.adminId) where.adminId = filters.adminId;
            if (filters.dateFrom || filters.dateTo) {
                where.createdAt = {};
                if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
                if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
            }

            const [logs, total] = await Promise.all([
                prisma.adminLog.findMany({
                    where,
                    include: { admin: { select: { username: true } } },
                    take: limit,
                    skip,
                    orderBy: { createdAt: 'desc' }
                }),
                prisma.adminLog.count({ where })
            ]);

            return {
                success: true,
                data: {
                    logs,
                    pages: Math.ceil(total / limit),
                    total
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'ADMIN_LOGS_FETCH_FAILED');
        }
    }

    /**
     * Gets churn analytics statistics.
     */
    async getChurnStats(ctx: AdminContext): Promise<AdminServiceResult<any>> {
        try {
            const { ChurnService } = await import('@/services/churn/churn.service');
            const stats = await ChurnService.getGlobalStats(!ctx.isGlobalAdmin ? ctx.allowedProjects : undefined);
            return { success: true, data: stats };
        } catch (error: any) {
            return this.handleError(error, 'ADMIN_CHURN_STATS_FETCH_FAILED');
        }
    }

    /**
     * Gets data required for the admin layout.
     */
    async getLayoutData(ctx: AdminContext, tgId?: string): Promise<AdminServiceResult<any>> {
        try {
            const [accessibleProjects, dbUser] = await Promise.all([
                prisma.project.findMany({
                    where: ctx.isGlobalAdmin ? {} : { id: { in: ctx.allowedProjects } },
                    select: { id: true, name: true, brandColor: true }
                }),
                tgId ? prisma.user.findUnique({ where: { tgId: BigInt(tgId) }, select: { username: true, role: true } }) : Promise.resolve(null)
            ]);

            return {
                success: true,
                data: {
                    accessibleProjects,
                    sidebarUser: dbUser,
                    isGlobalAdmin: ctx.isGlobalAdmin
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'LAYOUT_DATA_FETCH_FAILED');
        }
    }

    /**
     * Performs a global search across multiple entities.
     */
    async globalSearch(ctx: AdminContext, query: string): Promise<AdminServiceResult<any>> {
        try {
            const isNumeric = /^\d+$/.test(query);
            if (!query || query.length < 2) {
                return { success: true, data: { users: [], orders: [], tickets: [], services: [], providers: [] } };
            }

            const projectWhere: any = ctx.isGlobalAdmin ? {} : { projectId: { in: ctx.allowedProjects } };
            
            const [users, orders, tickets, services, providers] = await Promise.all([
                prisma.user.findMany({
                    where: {
                        OR: [
                            { username: { contains: query, mode: 'insensitive' } },
                            { email: { contains: query, mode: 'insensitive' } },
                            isNumeric ? { tgId: BigInt(query) } : undefined
                        ].filter(Boolean) as any
                    },
                    take: 5,
                    select: { id: true, username: true, role: true }
                }),
                prisma.order.findMany({
                    where: {
                        ...projectWhere,
                        OR: [
                            ...(isNumeric ? [{ id: parseInt(query) }] : []),
                            { externalId: { contains: query, mode: 'insensitive' } },
                            { link: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    take: 5,
                    select: { id: true, status: true, totalPrice: true }
                }),
                prisma.supportTicket.findMany({
                    where: {
                        ...projectWhere,
                        OR: [
                            { subject: { contains: query, mode: 'insensitive' } },
                            { id: { contains: query, mode: 'insensitive' } }
                        ]
                    },
                    take: 5,
                    select: { id: true, subject: true, status: true }
                }),
                prisma.internalService.findMany({
                    where: {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { id: { contains: query } }
                        ]
                    },
                    take: 5,
                    select: { id: true, name: true, platform: true, isActive: true }
                }),
                prisma.provider.findMany({
                    where: {
                        name: { contains: query, mode: 'insensitive' }
                    },
                    take: 3,
                    select: { id: true, name: true, isEnabled: true }
                })
            ]);

            return {
                success: true,
                data: {
                    users,
                    orders: orders.map(o => ({ ...o, totalPrice: o.totalPrice.toString() })),
                    tickets,
                    services,
                    providers
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'ADMIN_GLOBAL_SEARCH_FAILED');
        }
    }

    /**
     * Gets detailed information for a specific bug report.
     */
    async getBugReportDetail(ctx: AdminContext, id: string): Promise<AdminServiceResult<any>> {
        try {
            const report = await prisma.bugReport.findUnique({
                where: { id },
                include: { user: true, project: true }
            });

            if (!report) throw new Error('Bug report not found');
            await this.checkProjectAuth(ctx, report.projectId);

            return { success: true, data: report };
        } catch (error: any) {
            return this.handleError(error, 'BUG_REPORT_DETAIL_FAILED');
        }
    }

    /**
     * Updates staff access and permissions.
     */
    async updateStaffAccess(ctx: AdminContext, staffUserId: string, data: { projectIds: string[]; isGlobal: boolean; allowedTabs: string[]; permissions: string[] }): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) throw new Error('Unauthorized');

            const updated = await prisma.user.update({
                where: { id: staffUserId },
                data: {
                    isGlobalAdmin: data.isGlobal,
                    allowedTabs: data.allowedTabs,
                    permissions: data.permissions,
                    accessibleProjects: { set: data.projectIds.map(id => ({ id })) }
                }
            });

            await this.logAction(ctx, 'UPDATE_STAFF_ACCESS', `Updated access for staff ${staffUserId}`);
            return { success: true, data: updated };
        } catch (error: any) {
            return this.handleError(error, 'STAFF_UPDATE_FAILED');
        }
    }

    /**
     * Creates a new employee/staff member.
     */
    async createEmployee(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) throw new Error('Unauthorized');
            const data = CreateEmployeeContract.parse(rawData);
            
            const bcrypt = await import('bcryptjs');
            const hashedPassword = await bcrypt.hash(data.password, 10);

            const user = await prisma.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    username: data.username.toLowerCase(),
                    password: hashedPassword,
                    role: data.role as Role,
                    isGlobalAdmin: data.isGlobalAdmin || false,
                    allowedTabs: data.allowedTabs || [],
                    projectId: data.projectIds?.length ? data.projectIds[0] : null,
                    accessibleProjects: { connect: (data.projectIds || []).map((id: string) => ({ id })) }
                }
            });

            await this.logAction(ctx, 'CREATE_EMPLOYEE', `Created employee ${user.username} (${user.id})`);
            return { success: true, data: user };
        } catch (error: any) {
            return this.handleError(error, 'STAFF_CREATE_FAILED');
        }
    }

    /**
     * Deletes (soft-delete) an employee.
     */
    async deleteEmployee(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) throw new Error('Unauthorized');

            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            const timestamp = Date.now();
            const updated = await prisma.user.update({
                where: { id: userId },
                data: {
                    deletedAt: new Date(),
                    email: user.email ? `deleted_${timestamp}_${user.email}` : null,
                    username: user.username ? `deleted_${timestamp}_${user.username}` : null,
                    tgId: null,
                }
            });

            await this.logAction(ctx, 'DELETE_EMPLOYEE', `Deleted employee ${userId}`);
            return { success: true, data: updated };
        } catch (error: any) {
            return this.handleError(error, 'STAFF_DELETE_FAILED');
        }
    }

    /**
     * Adjusts user balance manually.
     */
    async adjustUserBalance(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        return safeAdminExecute(ctx, 'ADJUST_BALANCE', async () => {
            const data = UpdateUserBalanceContract.parse(rawData);
            const { LedgerEntryType } = await import('@/generated/client');
            const user = await prisma.user.findUnique({ where: { id: data.userId } });
            if (!user) throw new Error('User not found');

            if (!this.isAllowed(ctx, user.projectId)) {
                throw new Error(`Forbidden access to project: ${user.projectId}`);
            }

            const oldBalance = user.balance;
            const newBalance = oldBalance.plus(data.amount);

            await this.runTransactional(async (tx) => {
                await tx.user.update({ where: { id: data.userId }, data: { balance: newBalance } });
                await tx.ledgerEntry.create({
                    data: {
                        userId: data.userId,
                        amount: new Decimal(data.amount),
                        type: LedgerEntryType.MANUAL_ADJUSTMENT,
                        description: data.reason || 'Admin adjustment',
                        currency: 'RUB',
                        balanceBefore: oldBalance,
                        balanceAfter: newBalance,
                        projectId: user.projectId
                    }
                });
            });

            return { newBalance: newBalance.toNumber() };
        }, undefined);
    }

    /**
     * Updates user profile/data.
     */
    async updateUser(ctx: AdminContext, userId: string, rawData: any): Promise<AdminServiceResult<any>> {
        const currentUser = await prisma.user.findUnique({ where: { id: userId } });
        return safeAdminExecute(ctx, 'UPDATE_USER', async () => {
            const data = UpdateUserContract.parse(rawData);
            if (!currentUser) throw new Error('User not found');

            if (!this.isAllowed(ctx, currentUser.projectId)) {
                throw new Error(`Forbidden access to project: ${currentUser.projectId}`);
            }

            const updateData: any = {
                ...(data.username ? { username: data.username } : {}),
                ...(data.email !== undefined ? { email: data.email || null } : {}),
                ...(data.password ? { password: data.password } : {}),
                ...(data.role ? { role: data.role as Role } : {}),
                ...(data.referralPercent !== undefined ? { referralPercent: data.referralPercent } : {}),
                ...(data.isBanned !== undefined ? { isPermanentlyBanned: data.isBanned } : {}),
                ...(data.moderationNote !== undefined ? { moderationNote: data.moderationNote } : {}),
                ...(data.isGlobalAdmin !== undefined ? { isGlobalAdmin: data.isGlobalAdmin } : {})
            };

            await this.runTransactional(async (tx) => {
                if (data.balance !== undefined) {
                    const balanceAmount = new Decimal(data.balance);
                    const oldBalance = currentUser.balance;

                    if (!balanceAmount.equals(oldBalance)) {
                        updateData.balance = balanceAmount;
                        const { LedgerEntryType } = await import('@/generated/client');
                        await tx.ledgerEntry.create({
                            data: {
                                userId,
                                amount: balanceAmount.minus(oldBalance),
                                type: LedgerEntryType.MANUAL_ADJUSTMENT,
                                description: 'Profile update adjustment',
                                currency: 'RUB',
                                balanceBefore: oldBalance,
                                balanceAfter: balanceAmount,
                                projectId: currentUser.projectId
                            }
                        });
                    }
                }

                await tx.user.update({ where: { id: userId }, data: updateData });
            });

            return { userId };
        }, currentUser?.projectId || undefined);
    }

    /**
     * Warns a user and notifies via Telegram.
     */
    async warnUser(ctx: AdminContext, userId: string, reason: string): Promise<AdminServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            await this.checkProjectAuth(ctx, user.projectId);

            const newWarningCount = user.warningCount + 1;
            let banExpiresAt = user.banExpiresAt;
            let moderationNote = user.moderationNote || '';
            moderationNote += `\n[${new Date().toLocaleString()}] Предупреждение: ${reason}`;

            if (newWarningCount >= 3) {
                banExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                moderationNote += `\n[${new Date().toLocaleString()}] Автоматическая блокировка на 24ч (3 предупреждения)`;
            }

            await prisma.user.update({
                where: { id: userId },
                data: { warningCount: newWarningCount, banExpiresAt, moderationNote }
            });

            // Notification logic (async import to avoid circular)
            const { BroadcastService } = await import('@/services/support');
            if (user.tgId) {
                const msg = newWarningCount >= 3
                    ? `🚫 <b>ВЫ ЗАБЛОКИРОВАНЫ НА 24 ЧАСА</b>\n────────────────────\nПричина: Частое нарушение правил (3-е предупреждение).\n\nВаше право на использование поддержки временно ограничено.`
                    : `⚠️ <b>ВАМ ВЫНЕСЕНО ПРЕДУПРЕЖДЕНИЕ</b>\n────────────────────\nПричина: ${reason}\n\nПожалуйста, соблюдайте правила общения. При получении 3-х предупреждений ваш аккаунт будет временно заблокирован.`;
                await BroadcastService.notifyUser(user.tgId, msg).catch(() => { });
            }

            await this.logAction(ctx, 'WARN_USER', `Warned user ${userId}: ${reason}`, user.projectId || undefined);
            return { success: true, data: {} };
        } catch (error: any) {
            return this.handleError(error, 'WARN_USER_FAILED');
        }
    }

    /**
     * Bans a user with optional duration.
     */
    async banUser(ctx: AdminContext, userId: string, durationHours: number | 'PERMANENT', reason: string): Promise<AdminServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            await this.checkProjectAuth(ctx, user.projectId);

            let banExpiresAt: Date | null = null;
            let isPermanentlyBanned = false;
            let durationText = '';

            if (durationHours === 'PERMANENT') {
                isPermanentlyBanned = true;
                durationText = 'навсегда';
            } else {
                banExpiresAt = new Date(Date.now() + (durationHours as number) * 60 * 60 * 1000);
                durationText = `на ${durationHours} ч.`;
            }

            let moderationNote = user.moderationNote || '';
            moderationNote += `\n[${new Date().toLocaleString()}] Блокировка (${durationText}): ${reason}`;

            await prisma.user.update({
                where: { id: userId },
                data: { banExpiresAt, isPermanentlyBanned, moderationNote }
            });

            const { BroadcastService } = await import('@/services/support');
            if (user.tgId) {
                const msg = isPermanentlyBanned
                    ? `🚫 <b>ВАШ АККАУНТ ЗАБЛОКИРОВАН НАВСЕГДА</b>\n────────────────────\nПричина: ${reason}\n\nВы больше не можете пользоваться услугами поддержки.`
                    : `🚫 <b>ВАШ АККАУНТ ЗАБЛОКИРОВАН ${durationText.toUpperCase()}</b>\n────────────────────\nПричина: ${reason}\n\nДоступ к поддержке временно ограничен.`;
                await BroadcastService.notifyUser(user.tgId, msg).catch(() => { });
            }

            await this.logAction(ctx, 'BAN_USER', `Banned user ${userId} (${durationText}): ${reason}`, user.projectId || undefined);
            return { success: true, data: {} };
        } catch (error: any) {
            return this.handleError(error, 'BAN_USER_FAILED');
        }
    }

    /**
     * Unbans a user.
     */
    async unbanUser(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            await this.checkProjectAuth(ctx, user.projectId);

            await prisma.user.update({
                where: { id: userId },
                data: { banExpiresAt: null, isPermanentlyBanned: false, warningCount: 0 }
            });

            const { BroadcastService } = await import('@/services/support');
            if (user.tgId) {
                await BroadcastService.notifyUser(user.tgId, `✅ <b>ВАША БЛОКИРОВКА СНЯТА</b>\n────────────────────\nВы снова можете пользоваться поддержкой. Пожалуйста, не нарушайте правила.`).catch(() => { });
            }

            await this.logAction(ctx, 'UNBAN_USER', `Unbanned user ${userId}`, user.projectId || undefined);
            return { success: true, data: {} };
        } catch (error: any) {
            return this.handleError(error, 'UNBAN_USER_FAILED');
        }
    }

    /**
     * Archives/Soft-deletes a user.
     */
    async archiveUser(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw new Error('User not found');

            await this.checkProjectAuth(ctx, user.projectId);

            await prisma.user.update({
                where: { id: userId },
                data: {
                    tgId: null,
                    email: null,
                    username: `archived_${userId.substring(0, 6)}`,
                    balance: 0,
                    isPermanentlyBanned: true,
                    deletedAt: new Date()
                }
            });
            await this.logAction(ctx, 'ARCHIVE_USER', `Archived user ${userId}`, userId);
            return { success: true, data: {} };
        } catch (error: any) {
            return this.handleError(error, 'USER_ARCHIVE_FAILED');
        }
    }

    /**
     * Gets user quick view data.
     */
    async getUserQuickViewData(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    balance: true,
                    isPermanentlyBanned: true,
                    _count: { select: { orders: true, referrals: true } }
                }
            });
            if (!user) throw new Error('User not found');
            return { success: true, data: { ...user, balance: Number(user.balance) } };
        } catch (error: any) {
            return this.handleError(error, 'USER_QUICKVIEW_FAILED');
        }
    }

    /**
     * Searches users for manual orders.
     */
    async searchUsers(ctx: AdminContext, query: string): Promise<AdminServiceResult<any[]>> {
        try {
            const users = await prisma.user.findMany({
                where: {
                    OR: [
                        { tgId: query.match(/^\d+$/) ? BigInt(query) : undefined },
                        { username: { contains: query, mode: 'insensitive' } },
                        { email: { contains: query, mode: 'insensitive' } },
                        { id: query.length === 36 ? query : undefined }
                    ]
                },
                take: 10,
                select: { id: true, tgId: true, username: true, balance: true, projectId: true }
            });
            return { success: true, data: users.map(u => ({ ...u, tgId: u.tgId?.toString() || null, balance: Number(u.balance) })) };
        } catch (error: any) {
            return this.handleError(error, 'USER_SEARCH_FAILED');
        }
    }
}


