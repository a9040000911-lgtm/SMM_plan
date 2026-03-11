'use server';
/**
 * (c) 2024-2026 Smmplan. All rights reserved.
 * Created by Artem (http://artmspektr.ru)
 * Unauthorized copying of this file is strictly prohibited.
 */

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { BugStatus } from '@/generated/client';
import { Decimal } from 'decimal.js';

async function getAdminAccess() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');
    if (!session) return { isAuthorized: false, isGlobal: false, projectIds: [] };

    const { verifyAdminSession } = await import('@/lib/jwt');
    const data = await verifyAdminSession(session.value);
    if (!data) return { isAuthorized: false, isGlobal: false, projectIds: [] };
    return {
        isAuthorized: true,
        isGlobal: data.isGlobalAdmin,
        projectIds: data.allowedProjects || []
    };
}

export async function updateBugStatus(
    bugId: string,
    status: BugStatus,
    rewardAmount?: number,
    adminNotes?: string
) {
    const access = await getAdminAccess();
    if (!access.isAuthorized) return { success: false, error: 'Unauthorized' };

    const bug = await prisma.bugReport.findUnique({ where: { id: bugId } });
    if (!bug) return { success: false, error: 'Bug report not found' };

    if (!access.isGlobal && !access.projectIds.includes(bug.projectId)) {
        return { success: false, error: 'Access denied to this project' };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const data: any = {
                status,
                adminNotes: adminNotes ?? bug.adminNotes
            };

            if (rewardAmount !== undefined) {
                data.rewardAmount = new Decimal(rewardAmount);
            }

            // Logic: If status becomes ACCEPTED and there is a reward that hasn't been paid
            const finalReward = data.rewardAmount || bug.rewardAmount;
            const shouldPay = status === 'ACCEPTED' &&
                !bug.rewardPaid &&
                finalReward.greaterThan(0);

            if (shouldPay && bug.userId) {
                const userId = bug.userId;
                // Update User Balance
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        balance: { increment: finalReward }
                    }
                });

                // Get User for Ledger
                const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });

                // Create Ledger Entry
                await tx.ledgerEntry.create({
                    data: {
                        userId: userId,
                        projectId: bug.projectId,
                        amount: finalReward,
                        type: 'MANUAL_ADJUSTMENT', // Using MANUAL_ADJUSTMENT as generic bonus
                        description: `Bug Bounty Reward: ${bug.title} (#${bug.id.split('-')[0]})`,
                        balanceBefore: user.balance.minus(finalReward),
                        balanceAfter: user.balance
                    }
                });

                data.rewardPaid = true;
            }

            await tx.bugReport.update({
                where: { id: bugId },
                data
            });
        });

        revalidatePath('/admin/bug-reports');
        revalidatePath('/admin/support');
        return { success: true };
    } catch (e) {
        console.error('Failed to update bug report:', e);
        return { success: false, error: 'Database error' };
    }
}
