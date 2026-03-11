"use server";
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/utils/admin-session";
import { getActiveProjectId } from "@/utils/project-resolver";
import { revalidatePath } from "next/cache";
import { ReviewStatus } from '@/generated/client';

/**
 * Fetches reviews for the active project context.
 */
export async function getReviewsAction() {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const activeProjectId = await getActiveProjectId();

    const where: any = {};
    if (activeProjectId && activeProjectId !== "all") {
        where.projectId = activeProjectId;
    }

    return await prisma.review.findMany({
        where,
        include: {
            project: {
                select: { name: true, brandColor: true }
            },
            user: {
                select: { username: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
}

/**
 * Updates a review's status or content.
 */
export async function updateReviewAction(
    id: string,
    data: { status?: ReviewStatus; text?: string; rating?: number; userName?: string; userRole?: string }
) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const review = await prisma.review.findUnique({
        where: { id },
        select: { projectId: true }
    });

    if (!review) throw new Error("Review not found");

    // Project Isolation Check
    if (!session.isGlobalAdmin && !session.allowedProjects.includes(review.projectId)) {
        throw new Error("Forbidden: You do not have access to this project");
    }

    const updated = await prisma.review.update({
        where: { id },
        data: {
            ...data,
            moderatedBy: session.username,
            moderatedAt: new Date(),
        }
    });

    revalidatePath("/admin/marketing/reviews");
    return updated;
}

/**
 * Deletes a review.
 */
export async function deleteReviewAction(id: string) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    const review = await prisma.review.findUnique({
        where: { id },
        select: { projectId: true }
    });

    if (!review) throw new Error("Review not found");

    if (!session.isGlobalAdmin && !session.allowedProjects.includes(review.projectId)) {
        throw new Error("Forbidden");
    }

    await prisma.review.delete({ where: { id } });

    revalidatePath("/admin/marketing/reviews");
    return { success: true };
}

/**
 * Creates or updates a review (Admin manual entry).
 */
export async function upsertAdminReviewAction(
    id: string | null,
    data: {
        projectId: string;
        rating: number;
        text: string;
        userName: string;
        userRole: string;
        status: ReviewStatus;
        isAnonymous: boolean;
    }
) {
    const session = await getAdminSession();
    if (!session) throw new Error("Unauthorized");

    if (!session.isGlobalAdmin && !session.allowedProjects.includes(data.projectId)) {
        throw new Error("Forbidden");
    }

    // If no userId is provided (manual admin entry), we use a placeholder or system user if needed.
    // For simplicity, we assume Reviews can exist without a userId if userName is present.
    // However, schema says userId is NOT NULL. 
    // We'll find a system user or the admin user itself to link to.

    const targetUserId = session.id; // Link to the admin who created it

    const reviewData = {
        ...data,
        userId: targetUserId,
        moderatedBy: session.username,
        moderatedAt: new Date(),
    };

    if (id) {
        await prisma.review.update({ where: { id }, data: reviewData });
    } else {
        await prisma.review.create({ data: reviewData });
    }

    revalidatePath("/admin/marketing/reviews");
    return { success: true };
}
