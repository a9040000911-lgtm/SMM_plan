"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/utils/admin-session";
import { AdminUserService } from "@/services/admin/admin-user.service";
import { AdminContext } from "@/services/types";

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

export async function warnUserAction(userId: string, reason: string) {
    const ctx = await getCtx();
    const result = await AdminUserService.getInstance().warnUser(ctx, userId, reason);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/support');
    revalidatePath(`/admin/support/${userId}`);
    return { success: true };
}

export async function banUserAction(userId: string, durationHours: number | 'PERMANENT', reason: string) {
    const ctx = await getCtx();
    const result = await AdminUserService.getInstance().banUser(ctx, userId, durationHours, reason);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/support');
    revalidatePath(`/admin/support/${userId}`);
    return { success: true };
}

export async function unbanUserAction(userId: string) {
    const ctx = await getCtx();
    const result = await AdminUserService.getInstance().unbanUser(ctx, userId);
    if (!result.success) throw new Error(result.error.message);

    revalidatePath('/admin/support');
    revalidatePath(`/admin/support/${userId}`);
    return { success: true };
}


