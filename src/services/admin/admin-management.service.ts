import { prisma } from '@/lib/prisma';
import { AdminServiceResult, AdminContext } from '@/services/types';
import { BaseAdminService } from './base-admin.service';
import { UpdateCmsStringsContract, UpdateCmsBlocksContract, CreateNewsContract, UpdateGlobalSettingsContract } from './contracts';

/**
 * Service for administrative management operations.
 * Handles CMS, News, Providers, Social Platforms, and Global Settings.
 */
export class AdminManagementService extends BaseAdminService {
    private static instance: AdminManagementService;

    private constructor() {
        super('AdminManagement');
    }

    public static getInstance(): AdminManagementService {
        if (!AdminManagementService.instance) {
            AdminManagementService.instance = new AdminManagementService();
        }
        return AdminManagementService.instance;
    }

    /**
     * Gets global statistics for the admin dashboard.
     */
    async getGlobalStats(ctx: AdminContext): Promise<AdminServiceResult<any>> {
        try {
            const whereClause: any = {};
            if (!ctx.isGlobalAdmin) {
                whereClause.projectId = { in: ctx.allowedProjects };
            }

            const [revenue, orderCount, userCount, openTickets, stuckOrders, latestOrders] = await Promise.all([
                prisma.transaction.aggregate({
                    where: {
                        status: 'COMPLETED',
                        ...(!ctx.isGlobalAdmin ? { user: { projectId: { in: ctx.allowedProjects } } } : {})
                    },
                    _sum: { amount: true }
                }),
                prisma.order.count({ where: whereClause }),
                prisma.user.count({ where: !ctx.isGlobalAdmin ? { projectId: { in: ctx.allowedProjects } } : {} }),
                prisma.supportTicket.count({
                    where: {
                        status: 'OPEN',
                        ...(!ctx.isGlobalAdmin ? { projectId: { in: ctx.allowedProjects } } : {})
                    }
                }),
                prisma.order.count({
                    where: {
                        ...whereClause,
                        status: 'PENDING' // Changed from ERROR to PENDING as ERROR is not in OrderStatus enum
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
                data: {
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
                }
            };
        } catch (error: any) {
            return this.handleError(error, 'ADMIN_STATS_FETCH_FAILED');
        }
    }

    /**
     * Updates CMS strings for a project.
     */
    async updateCmsStrings(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<{ count: number }>> {
        try {
            const data = UpdateCmsStringsContract.parse(rawData);
            if (!this.isAllowed(ctx, data.projectId)) {
                return this.error('FORBIDDEN', `Forbidden access to project: ${data.projectId}`);
            }

            let pageId: string | undefined;
            if (data.pageSlug) {
                const page = await prisma.cmsPage.findUnique({
                    where: { projectId_slug: { projectId: data.projectId, slug: data.pageSlug } }
                });
                pageId = page?.id;
            }

            let count = 0;
            for (const [key, value] of Object.entries(data.updates)) {
                await prisma.cmsString.upsert({
                    where: { projectId_key_pageId: { projectId: data.projectId, key, pageId: pageId || null as any } },
                    update: { value, isPublished: true },
                    create: { projectId: data.projectId, key, value, pageId: pageId || null, isPublished: true }
                });
                count++;
            }
            
            await this.logAction(ctx, 'UPDATE_CMS_STRINGS', `Updated ${count} strings for project ${data.projectId}`, data.projectId, undefined, null, null, data.projectId);

            return { success: true, data: { count: Object.keys(data.updates).length } };
        } catch (error: any) {
            return this.handleError(error, 'CMS_STRINGS_UPDATE_FAILED');
        }
    }

    /**
     * Updates CMS blocks for a page.
     */
    async updateCmsBlocks(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            const data = UpdateCmsBlocksContract.parse(rawData);
            if (!this.isAllowed(ctx, data.projectId)) {
                return this.error('FORBIDDEN', `Forbidden access to project: ${data.projectId}`);
            }

            let page = await prisma.cmsPage.findUnique({
                where: { projectId_slug: { projectId: data.projectId, slug: data.pageSlug } }
            });

            if (!page) {
                page = await prisma.cmsPage.create({
                    data: { projectId: data.projectId, slug: data.pageSlug, title: data.pageSlug === 'home' ? 'Главная' : data.pageSlug }
                });
            }

            await this.runTransactional(async (tx) => {
                const keepIds = data.blocks.map(b => b.id).filter((id): id is string => !!id && !id.startsWith('temp-'));
                await tx.cmsBlock.deleteMany({
                    where: { pageId: page!.id, id: { notIn: keepIds } }
                });

                for (let i = 0; i < data.blocks.length; i++) {
                    const b = data.blocks[i];
                    const blockData = {
                        type: b.type,
                        slot: b.slot || 'DEFAULT',
                        content: b.data as any,
                        order: i,
                        isPublished: true
                    };

                    if (b.id && !b.id.startsWith('temp-')) {
                        await tx.cmsBlock.update({ where: { id: b.id }, data: blockData });
                    } else {
                        await tx.cmsBlock.create({ data: { ...blockData, pageId: page!.id } });
                    }
                }
            });

            await this.logAction(ctx, 'UPDATE_CMS_BLOCKS', `Updated ${data.blocks.length} CMS blocks for page ${data.pageSlug}`, data.projectId);

            return { success: true, data: { count: data.blocks.length } };
        } catch (error: any) {
            return this.handleError(error, 'CMS_BLOCKS_UPDATE_FAILED');
        }
    }

    /**
     * Creates a news item.
     */
    async createNews(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            const data = CreateNewsContract.parse(rawData);
            if (data.projectId && !this.isAllowed(ctx, data.projectId)) {
                return this.error('FORBIDDEN', `Forbidden access to project: ${data.projectId}`);
            }
            if (!data.projectId && !ctx.isGlobalAdmin) {
                return this.error('FORBIDDEN', 'Forbidden: Only Global Admins can publish global news.');
            }

            const news = await prisma.news.create({
                data: {
                    title: data.title,
                    content: data.content,
                    imageUrl: data.imageUrl || null,
                    projectId: data.projectId || null,
                }
            });
            await this.logAction(ctx, 'CREATE_NEWS', `Created news ${news.title}`, data.projectId || undefined);
            return { success: true, data: news };
        } catch (error: any) {
            return this.handleError(error, 'NEWS_CREATE_FAILED');
        }
    }

    /**
     * Gets news and its target users for broadcasting.
     */
    async getNewsAndTargetUsers(ctx: AdminContext, newsId: string): Promise<AdminServiceResult<{ news: any; users: any[] }>> {
        try {
            const news = await prisma.news.findUnique({ where: { id: newsId } });
            if (!news) throw new Error('News not found');

            const where: any = {};
            if (news.projectId) {
                where.projectId = news.projectId;
            }

            const users = await prisma.user.findMany({
                where: { ...where, tgId: { not: null } },
                select: { id: true, tgId: true }
            });

            return { success: true, data: { news, users } };
        } catch (error: any) {
            return this.handleError(error, 'NEWS_BROADCAST_DATA_FAILED');
        }
    }

    /**
     * Marks news as sent/published.
     */
    async markNewsAsSent(ctx: AdminContext, newsId: string): Promise<AdminServiceResult<void>> {
        try {
            await prisma.news.update({
                where: { id: newsId },
                data: { isSent: true }
            });
            return { success: true, data: undefined };
        } catch (error: any) {
            return this.handleError(error, 'NEWS_MARK_SENT_FAILED');
        }
    }

    /**
     * Deletes a news item.
     */
    async deleteNews(ctx: AdminContext, id: string): Promise<AdminServiceResult<any>> {
        try {
            const news = await prisma.news.findUnique({ where: { id } });
            if (!news) throw new Error('News not found');

            if (news.projectId) await this.checkProjectAuth(ctx, news.projectId);

            await prisma.news.delete({ where: { id } });
            await this.logAction(ctx, 'DELETE_NEWS', `Deleted news ${id}`, news.projectId || undefined);
            return { success: true, data: {} };
        } catch (error: any) {
            return this.handleError(error, 'NEWS_DELETE_FAILED');
        }
    }

    /**
     * Gets all providers with balance stats.
     */
    async getProvidersWithStats(ctx: AdminContext, projectId?: string): Promise<AdminServiceResult<any[]>> {
        try {
            const where: any = {};
            if (projectId && projectId !== 'all') {
                if (!ctx.isGlobalAdmin && !ctx.allowedProjects.includes(projectId)) {
                    throw new Error('Forbidden access to project');
                }
                where.OR = [{ projectId: null }, { projectId }];
            } else if (!ctx.isGlobalAdmin) {
                where.projectId = { in: ctx.allowedProjects };
            }

            const providers = await prisma.provider.findMany({
                where,
                include: {
                    _count: { select: { services: true } }
                },
                orderBy: { name: 'asc' }
            });

            const stats = await Promise.all(providers.map(async (p) => {
                const lastLog = await prisma.providerBalanceLog.findFirst({
                    where: { providerId: p.id },
                    orderBy: { createdAt: 'desc' }
                });
                return {
                    ...p,
                    balanceThreshold: p.balanceThreshold.toNumber(),
                    currentBalance: lastLog?.balance.toNumber() || 0,
                    lastSync: lastLog?.createdAt.toISOString() || null,
                    serviceCount: p._count.services
                };
            }));

            return { success: true, data: stats };
        } catch (error: any) {
            return this.handleError(error, 'PROVIDERS_FETCH_FAILED');
        }
    }

    /**
     * Gets global settings.
     */
    async getGlobalSettings(_ctx: AdminContext): Promise<AdminServiceResult<Record<string, string>>> {
        try {
            const settings = await prisma.globalSetting.findMany();
            const map: Record<string, string> = {};
            settings.forEach(s => map[s.key] = s.value);
            return { success: true, data: map };
        } catch (error: any) {
            return this.handleError(error, 'SETTINGS_FETCH_FAILED');
        }
    }

    /**
     * Updates global settings.
     */
    async updateGlobalSettings(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<void>> {
        try {
            if (!ctx.isGlobalAdmin) throw new Error('Unauthorized');
            const data = UpdateGlobalSettingsContract.parse(rawData);
            const oldSettings = await prisma.globalSetting.findMany({
                where: { key: { in: Object.keys(data.settings) } }
            });
            const oldMap: Record<string, string> = {};
            oldSettings.forEach(s => oldMap[s.key] = s.value);

            await this.runTransactional(async (tx) => {
                const operations = Object.entries(data.settings).map(([key, value]) =>
                    tx.globalSetting.upsert({
                        where: { key },
                        update: { value },
                        create: { key, value }
                    })
                );
                await Promise.all(operations);
            });
            await this.logAction(
                ctx, 
                'UPDATE_GLOBAL_SETTINGS', 
                `Изменены системные настройки: ${Object.keys(data.settings).join(', ')}`,
                null,
                oldMap,
                data.settings
            );
            return { success: true, data: undefined };
        } catch (error: any) {
            return this.handleError(error, 'SETTINGS_UPDATE_FAILED');
        }
    }

    /**
     * Gets all projects.
     */
    async getProjects(ctx: AdminContext): Promise<AdminServiceResult<any[]>> {
        try {
            const projects = await prisma.project.findMany({
                where: ctx.isGlobalAdmin ? {} : { id: { in: ctx.allowedProjects } },
                orderBy: { name: 'asc' }
            });
            return { success: true, data: projects };
        } catch (error: any) {
            return this.handleError(error, 'PROJECTS_FETCH_FAILED');
        }
    }


}


