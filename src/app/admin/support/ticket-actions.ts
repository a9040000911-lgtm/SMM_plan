'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { getAdminSession } from '@/utils/admin-session';
import { AdminSupportService } from '@/services/admin/admin-support.service';
import { AdminOrderService } from '@/services/admin/admin-order.service';
import { AdminManagementService } from '@/services/admin/admin-management.service';
import { AdminContext } from '@/services/types';

export interface UserListItem {
    id: string;
    username: string | null;
    tgId: string | null;
    balance: number;
    totalSpent: number;
    lastActive: string | null;
    project: { name: string; color: string } | null;
    openTickets: number;
    hasUnread: boolean;
    stats: {
        open: number;
        pending: number;
        closed: number;
    };
    lastActivity: {
        lastMessage: string;
        lastMessageSender: 'USER' | 'STAFF' | 'SYSTEM';
        updatedAt: string;
    } | null;
}

export interface UserConversation {
    userId: string;
    username: string | null;
    tgId: string | null;
    user: {
        id: string;
        username: string | null;
        tgId: string | null;
        project: { name: string; color: string } | null;
        balance: number;
        spent: number;
        createdAt: string;
    };
    tickets: ConversationTicket[];
}

export interface ConversationTicket {
    id: string;
    subject: string;
    status: string;
    createdAt: string;
    messages: {
        id: string;
        text: string;
        sender: 'USER' | 'STAFF' | 'SYSTEM' | 'INTERNAL';
        createdAt: string;
        staffUsername?: string;
        imageUrl?: string;
        voiceUrl?: string;
    }[];
}

export interface UserOrder {
    id: number;
    serviceName: string;
    status: string;
    totalPrice: number;
    amount: number;
    link: string;
    createdAt: string;
}

async function getCtx(): Promise<AdminContext> {
    const session = await getAdminSession();
    if (!session || !['ADMIN', 'SUPPORT'].includes(session.role)) throw new Error('Unauthorized');
    return {
        userId: session.id,
        role: session.role as any,
        allowedProjects: session.allowedProjects,
        isGlobalAdmin: session.isGlobalAdmin
    };
}

export async function getUserListAction(
    filter: 'active' | 'all' = 'active',
    search: string = '',
    projectId: string | null = null,
    page: number = 1,
    limit: number = 20
) {
    const ctx = await getCtx();
    const result = await AdminSupportService.getInstance().getSupportUserList(ctx, { filter, search, projectId, page, limit });
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

export async function getUserConversationAction(userId: string) {
    const ctx = await getCtx();
    const result = await AdminSupportService.getInstance().getSupportUserConversation(ctx, userId);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

export async function getTemplatesAndMacrosAction() {
    const ctx = await getCtx();
    const result = await AdminSupportService.getInstance().getSupportTemplatesAndMacros(ctx);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

export async function getLatestUserOrdersAction(userId: string) {
    const ctx = await getCtx();
    const result = await AdminOrderService.getInstance().getSupportLatestUserOrders(ctx, userId);
    if (!result.success) throw new Error(result.error.message);
    return result.data;
}

export async function getSupportProjectsAction() {
    const ctx = await getCtx();
    const result = await AdminManagementService.getInstance().getProjects(ctx);
    if (!result.success) throw new Error(result.error.message);
    
    return result.data.map((p: any) => ({
        id: p.id,
        name: p.name,
        color: p.brandColor,
        slug: p.slug
    }));
}
