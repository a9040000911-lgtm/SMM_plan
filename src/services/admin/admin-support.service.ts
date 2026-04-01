/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { AdminServiceResult, AdminContext } from '@/services/types';
import { BaseAdminService } from "./base-admin.service";
import { Decimal } from "decimal.js";
import { UpdateSupportNotesContract, CreateSupportTemplateContract, CreateSupportMacroContract } from "./contracts";

export class AdminSupportService extends BaseAdminService {
    private static instance: AdminSupportService;

    private constructor() {
        super('AdminSupport');
    }

    public static getInstance(): AdminSupportService {
        if (!AdminSupportService.instance) {
            AdminSupportService.instance = new AdminSupportService();
        }
        return AdminSupportService.instance;
    }

    /**
     * Closes a support ticket and logs the action.
     */
    async closeTicket(ctx: AdminContext, ticketId: string): Promise<AdminServiceResult<any>> {
        try {
            const oldTicket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
            if (!oldTicket) throw new Error('Ticket not found');
            await this.checkProjectAuth(ctx, oldTicket.projectId);

            const updated = await prisma.supportTicket.update({
                where: { id: ticketId },
                data: { status: 'CLOSED' }
            });

            await this.logAction(ctx, 'TICKET_CLOSE', `Closed support ticket ${ticketId}`, ticketId, undefined, oldTicket, updated, oldTicket.projectId);
            return this.success({ ticketId });
        } catch (error: any) {
            return this.error('TICKET_CLOSE_FAILED', error.message, error);
        }
    }

    /**
     * Gets user Telegram info for support messaging.
     */
    async getSupportUserTgInfo(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any>> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { tgId: true, projectId: true }
            });
            if (!user) throw new Error('User not found');
            await this.checkProjectAuth(ctx, user.projectId);
            return this.success({ tgId: user.tgId?.toString(), projectId: user.projectId });
        } catch (error: any) {
            return this.error('USER_TG_INFO_FAILED', error.message, error);
        }
    }

    /**
     * Updates internal support notes for a user.
     */
    async updateSupportNotes(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            const data = UpdateSupportNotesContract.parse(rawData);
            const user = await prisma.user.findUnique({ where: { id: data.userId }, select: { projectId: true, supportNotes: true } });
            
            if (!user) throw new Error('User not found');
            if (!this.isAllowed(ctx, user.projectId)) {
                return this.error('FORBIDDEN', `Forbidden access to project: ${user.projectId}`);
            }

            const updated = await prisma.user.update({
                where: { id: data.userId },
                data: { supportNotes: data.notes }
            });

            await this.logAction(ctx, 'UPDATE_SUPPORT_NOTES', `Updated support notes for user ${data.userId}`, data.userId, undefined, { notes: user.supportNotes }, { notes: updated.supportNotes }, user.projectId);
            return this.success({ userId: data.userId });
        } catch (error: any) {
            return this.error('SUPPORT_NOTES_UPDATE_FAILED', error.message, error);
        }
    }

    /**
     * Gets support templates.
     */
    async getSupportTemplates(_ctx: AdminContext): Promise<AdminServiceResult<any[]>> {
        try {
            const templates = await prisma.supportTemplate.findMany({ orderBy: { title: 'asc' } });
            return this.success(templates);
        } catch (error: any) {
            return this.error('TEMPLATES_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Creates a support template.
     */
    async createSupportTemplate(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) return this.error('FORBIDDEN', 'Only Global Admins can manage logic templates.');
            const data = CreateSupportTemplateContract.parse(rawData);
            const template = await prisma.supportTemplate.create({ data });
            await this.logAction(ctx, 'CREATE_SUPPORT_TEMPLATE', `Created template ${data.title}`);
            return this.success(template);
        } catch (error: any) {
            return this.error('TEMPLATE_CREATE_FAILED', error.message, error);
        }
    }

    /**
     * Updates a support template.
     */
    async updateSupportTemplate(ctx: AdminContext, id: string, data: { title: string; content: string }): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) return this.error('FORBIDDEN', 'Only Global Admins can manage logic templates.');
            await prisma.supportTemplate.update({ where: { id }, data });
            await this.logAction(ctx, 'UPDATE_SUPPORT_TEMPLATE', `Updated template ${id}`);
            return this.success({});
        } catch (error: any) {
            return this.error('TEMPLATE_UPDATE_FAILED', error.message, error);
        }
    }

    /**
     * Deletes a support template.
     */
    async deleteSupportTemplate(ctx: AdminContext, id: string): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) return this.error('FORBIDDEN', 'Only Global Admins can manage logic templates.');
            await prisma.supportTemplate.delete({ where: { id } });
            await this.logAction(ctx, 'DELETE_SUPPORT_TEMPLATE', `Deleted template ${id}`);
            return this.success({});
        } catch (error: any) {
            return this.error('TEMPLATE_DELETE_FAILED', error.message, error);
        }
    }

    /**
     * Creates a support macro.
     */
    async createSupportMacro(ctx: AdminContext, rawData: any): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) return this.error('FORBIDDEN', 'Only Global Admins can manage logic macros.');
            const data = CreateSupportMacroContract.parse(rawData);
            const macro = await prisma.supportMacro.create({ 
                data: {
                    title: data.title,
                    text: data.text,
                    actions: data.actions as any
                }
             });
            await this.logAction(ctx, 'CREATE_MACRO', `Created macro ${data.title}`);
            return this.success(macro);
        } catch (error: any) {
            return this.error('MACRO_CREATE_FAILED', error.message, error);
        }
    }

    /**
     * Deletes a support macro.
     */
    async deleteSupportMacro(ctx: AdminContext, id: string): Promise<AdminServiceResult<any>> {
        try {
            if (!ctx.isGlobalAdmin) return this.error('FORBIDDEN', 'Only Global Admins can manage logic macros.');
            await prisma.supportMacro.delete({ where: { id } });
            await this.logAction(ctx, 'DELETE_MACRO', `Deleted macro ${id}`);
            return this.success({});
        } catch (error: any) {
            return this.error('MACRO_DELETE_FAILED', error.message, error);
        }
    }

    /**
     * Executes a support macro.
     */
    async executeSupportMacro(ctx: AdminContext, ticketId: string, macroId: string): Promise<AdminServiceResult<string[]>> {
        try {
            const ticket = await prisma.supportTicket.findUnique({
                where: { id: ticketId },
                include: { user: true }
            });
            const macro = await prisma.supportMacro.findUnique({ where: { id: macroId } });

            if (!ticket || !macro) throw new Error('Ticket or Macro not found');

            const actions = macro.actions as any[];
            const results: string[] = [];
            let grantedPromo: string | null = null;

            const { TicketService } = await import('@/services/support');
            const { handleRefund } = await import('@/services/orders');

            for (const action of actions) {
                try {
                    if (action.type === 'GIVE_PROMOCODE') {
                        const promoCode = await prisma.promoCode.findUnique({ where: { id: action.promoId || '' } });
                        if (promoCode) {
                            await prisma.userPromo.upsert({
                                where: { userId_promoCodeId: { userId: ticket.userId, promoCodeId: promoCode.id } },
                                update: { usedAt: null },
                                create: { userId: ticket.userId, promoCodeId: promoCode.id }
                            });
                            grantedPromo = promoCode.code;
                            results.push(`Promo ${promoCode.code} granted`);
                        }
                    }

                    if (action.type === 'SEND_MESSAGE') {
                        let finalMsg = macro.text.replace('{username}', ticket.user.username || 'клиент');
                        if (grantedPromo) finalMsg = finalMsg.replace('{promo}', grantedPromo);
                        await TicketService.sendStaffReply(ticketId, finalMsg, ctx.userId);
                        results.push('Message sent');
                    }

                    if (action.type === 'REFUND_LAST_ORDER') {
                        const lastOrder = await prisma.order.findFirst({
                            where: { userId: ticket.userId, status: { in: ['PROCESSING', 'PENDING'] } },
                            orderBy: { createdAt: 'desc' }
                        });
                        if (lastOrder) {
                            await handleRefund(lastOrder, 'CANCELED', 0);
                            results.push(`Order #${lastOrder.id} refunded`);
                        }
                    }

                    if (action.type === 'ADD_BONUS') {
                        const amount = action.amount || 0;
                        await prisma.user.update({ where: { id: ticket.userId }, data: { balance: { increment: amount } } });
                        await prisma.transaction.create({
                            data: {
                                projectId: ticket.user.projectId,
                                userId: ticket.userId,
                                amount: new Decimal(amount),
                                type: 'DEPOSIT',
                                provider: 'INTERNAL',
                                status: 'COMPLETED',
                                metadata: { adminNote: `Macro Bonus: ${macro.title}` }
                            }
                        });
                        results.push(`Bonus ${amount} RUB added`);
                    }

                    if (action.type === 'CLOSE_TICKET') {
                        await prisma.supportTicket.update({ where: { id: ticketId }, data: { status: 'CLOSED' } });
                        results.push('Ticket closed');
                    }
                } catch (e: any) {
                    results.push(`Error in ${action.type}: ${e.message}`);
                }
            }

            await this.logAction(ctx, 'EXECUTE_MACRO', `Macro "${macro.title}" executed on ticket ${ticketId}. results: ${results.join(', ')}`);
            return this.success(results);
        } catch (error: any) {
            return this.error('MACRO_EXECUTION_FAILED', error.message, error);
        }
    }

    /**
     * Updates staff presence in a ticket.
     */
    async setSupportPresence(ctx: AdminContext, ticketId: string, adminName: string): Promise<AdminServiceResult<any>> {
        try {
            const presenceKey = `SUPPORT_PRESENCE_${ticketId}`;
            const now = new Date().toISOString();
            await prisma.settings.upsert({
                where: { projectId_key: { projectId: 'global', key: presenceKey } },
                update: { value: `${adminName}|${now}` },
                create: { projectId: 'global', key: presenceKey, value: `${adminName}|${now}` }
            });
            return this.success({});
        } catch (error: any) {
            return this.error('PRESENCE_UPDATE_FAILED', error.message, error);
        }
    }

    /**
     * Gets staff presence in a ticket.
     */
    async getSupportPresence(ctx: AdminContext, ticketId: string, currentAdminName: string): Promise<AdminServiceResult<string | null>> {
        try {
            const presenceKey = `SUPPORT_PRESENCE_${ticketId}`;
            const record = await prisma.settings.findUnique({
                where: { projectId_key: { projectId: 'global', key: presenceKey } }
            });

            if (!record) return this.success(null);

            const [name, time] = record.value.split('|');
            const lastSeen = new Date(time);
            const diff = Date.now() - lastSeen.getTime();

            if (diff < 30000 && name !== currentAdminName) {
                return this.success(name);
            }
            return this.success(null);
        } catch (error: any) {
            return this.error('PRESENCE_FETCH_FAILED', error.message, error);
        }
    }

    /**
     * Gets user list for support module with complex filtering and stats.
     */
    async getSupportUserList(ctx: AdminContext, params: any): Promise<AdminServiceResult<any>> {
        try {
            const { filter = 'active', search = '', projectId = null, page = 1, limit = 20 } = params;
            const skip = (page - 1) * limit;

            const userConditions: any = {};
            if (projectId) {
                if (!ctx.isGlobalAdmin && !ctx.allowedProjects.includes(projectId)) {
                    throw new Error('Forbidden access to project');
                }
                userConditions.projectId = projectId;
            } else if (!ctx.isGlobalAdmin) {
                userConditions.projectId = { in: ctx.allowedProjects };
            }

            if (search) {
                userConditions.OR = [
                    { username: { contains: search, mode: 'insensitive' } },
                    { id: { contains: search, mode: 'insensitive' } },
                    { tgId: { contains: search, mode: 'insensitive' } },
                    ...(typeof search === 'string' && /^\d+$/.test(search) ? [{ tickets: { some: { orderId: parseInt(search) } } }] : [])
                ];
            }

            const ticketConditions: any = { user: userConditions };
            if (filter === 'active') ticketConditions.status = { in: ['OPEN', 'PENDING'] };

            const userIdsWithTickets = await prisma.supportTicket.findMany({
                where: ticketConditions,
                orderBy: { updatedAt: 'desc' },
                select: { userId: true },
                distinct: ['userId'],
                skip,
                take: limit
            });

            const targetUserIds = userIdsWithTickets.map(t => t.userId);
            const users = await prisma.user.findMany({
                where: { id: { in: targetUserIds } },
                include: {
                    project: { select: { name: true, brandColor: true } },
                    tickets: {
                        select: {
                            id: true, status: true, subject: true, updatedAt: true,
                            messages: {
                                orderBy: { createdAt: 'desc' }, take: 1,
                                select: { text: true, sender: true, createdAt: true }
                            }
                        },
                        orderBy: { updatedAt: 'desc' }
                    }
                }
            });

            users.sort((a, b) => targetUserIds.indexOf(a.id) - targetUserIds.indexOf(b.id));

            const usersWithStats = users.map(user => ({
                id: user.id,
                username: user.username,
                tgId: user.tgId?.toString() || '',
                balance: user.balance.toString(),
                project: user.project ? { name: user.project.name, color: user.project.brandColor } : null,
                stats: {
                    open: user.tickets.filter((t: any) => t.status === 'OPEN').length,
                    pending: user.tickets.filter((t: any) => t.status === 'PENDING').length,
                    closed: user.tickets.filter((t: any) => t.status === 'CLOSED').length,
                    total: user.tickets.length
                },
                hasUnread: user.tickets[0]?.messages[0]?.sender === 'USER' && user.tickets[0]?.status !== 'CLOSED',
                lastActivity: user.tickets[0] ? {
                    ticketSubject: user.tickets[0].subject,
                    lastMessage: user.tickets[0].messages[0]?.text?.substring(0, 100) || '',
                    lastMessageSender: user.tickets[0].messages[0]?.sender || 'SYSTEM',
                    updatedAt: user.tickets[0].updatedAt.toISOString()
                } : null
            }));

            const allUsersCount = await prisma.user.count({ where: { tickets: { some: {} }, ...userConditions } });
            const activeUsersCount = await prisma.user.count({ where: { ...userConditions, tickets: { some: { status: { in: ['OPEN', 'PENDING'] } } } } });
            
            return this.success({
                users: usersWithStats,
                total: filter === 'active' ? activeUsersCount : allUsersCount,
                hasMore: usersWithStats.length === limit,
                stats: { totalUsers: allUsersCount }
            });
        } catch (error: any) {
            return this.error('SUPPORT_USER_LIST_FAILED', error.message, error);
        }
    }

    /**
     * Gets conversation details for a user.
     */
    async getSupportUserConversation(ctx: AdminContext, userId: string): Promise<AdminServiceResult<any>> {
        try {
            const user = await prisma.user.findFirst({
                where: { id: userId, ...(ctx.isGlobalAdmin ? {} : { projectId: { in: ctx.allowedProjects } }) },
                include: {
                    project: { select: { name: true, brandColor: true } },
                    tickets: {
                        orderBy: { updatedAt: 'desc' },
                        include: {
                            messages: { orderBy: { createdAt: 'asc' } }
                        }
                    }
                } as any
            });

            if (!user) throw new Error('User not found');

            const data = {
                user: {
                    id: user.id, username: user.username, tgId: user.tgId?.toString() || '',
                    balance: user.balance.toString(), spent: user.spent.toString(), createdAt: user.createdAt.toISOString(),
                    project: user.project ? { name: (user.project as any).name, color: (user.project as any).brandColor } : null
                },
                tickets: (user.tickets as any[]).map(t => ({
                    id: t.id, subject: t.subject, status: t.status, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString(),
                    messages: t.messages.map((m: any) => ({
                        id: m.id, sender: m.sender, text: m.text, createdAt: m.createdAt.toISOString(),
                        imageUrl: m.imageUrl || undefined, voiceUrl: m.voiceUrl || undefined, staffUsername: m.staffUsername || undefined
                    }))
                })).sort((a, b) => {
                    const statusOrder: any = { OPEN: 0, PENDING: 1, CLOSED: 2 };
                    return statusOrder[a.status] - statusOrder[b.status];
                })
            };

            return this.success(data);
        } catch (error: any) {
            return this.error('SUPPORT_CONVO_FAILED', error.message, error);
        }
    }

    /**
     * Gets combined templates and macros for support view.
     */
    async getSupportTemplatesAndMacros(_ctx: AdminContext): Promise<AdminServiceResult<any>> {
        try {
            const [templates, macros] = await Promise.all([
                prisma.supportTemplate.findMany({ orderBy: { updatedAt: 'desc' }, take: 20 }),
                prisma.supportMacro.findMany({ orderBy: { updatedAt: 'desc' }, take: 20 })
            ]);

            return this.success({
                templates: templates.map(t => ({ id: t.id, title: t.title, content: t.content })),
                macros: macros.map(m => ({ id: m.id, name: m.title, actions: m.actions }))
            });
        } catch (error: any) {
            return this.error('SUPPORT_UTILS_FAILED', error.message, error);
        }
    }
}

export const adminSupportService = AdminSupportService.getInstance();



